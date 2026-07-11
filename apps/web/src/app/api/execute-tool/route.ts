import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { runToolExecution } from '@/lib/execution-engine'
import { recordAIUsage } from '@/lib/ai-usage'
import { checkAllLimits } from '@/lib/ai-rate-limit'
import { validateToolSchema } from '@protools/schema'
import type { Prisma } from '@prisma/client'
import { audit } from '@/lib/audit'
import { updateMemoryFromExecution, getBusinessContext } from '@/lib/business-memory'
import { buildCompanyContextBlock } from '@/lib/context-autofill'
import { trackEvent } from '@/lib/product-analytics'

export const runtime = 'nodejs'
export const maxDuration = 60

interface RequestBody {
  toolInstanceId?: string
  workspaceId?: string
  variables?: Record<string, unknown>
  model?: string
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'AI no configurado. Añade ANTHROPIC_API_KEY u OPENAI_API_KEY a .env.local.' },
      { status: 503 },
    )
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true },
  })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { toolInstanceId, workspaceId, variables = {}, model } = body

  if (!toolInstanceId || !workspaceId) {
    return NextResponse.json(
      { error: 'toolInstanceId y workspaceId son obligatorios' },
      { status: 400 },
    )
  }

  const [workspace, instance] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } }),
    db.toolInstance.findFirst({
      where: { id: toolInstanceId, workspaceId, status: 'ACTIVE' },
      include: {
        toolDefinition: true,
        installationConfig: true,
      },
    }),
  ])

  if (!workspace) return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })
  if (!instance) return NextResponse.json({ error: 'Herramienta no encontrada' }, { status: 404 })

  const limitFailed = await checkAllLimits(user.id, workspaceId)
  if (limitFailed) {
    return NextResponse.json(
      { error: `Límite de IA alcanzado: ${limitFailed.reason}` },
      { status: 429 },
    )
  }

  const schemaResult = validateToolSchema(instance.toolDefinition.schema)
  if (!schemaResult.success) {
    return NextResponse.json({ error: 'Schema de herramienta inválido' }, { status: 422 })
  }

  // Lee configuración de la instalación (con fallbacks a valores por defecto)
  const cfg = instance.installationConfig
  const chosenModel = model ?? cfg?.model ?? 'claude-sonnet-4-6'
  const chosenProvider = cfg?.provider ?? 'anthropic'

  // Crear ejecución en estado RUNNING antes de llamar a la IA
  const execution = await db.toolExecution.create({
    data: {
      toolInstanceId,
      workspaceId,
      userId: user.id,
      status: 'RUNNING',
      variables: variables as Prisma.InputJsonValue,
      model: chosenModel,
      provider: chosenProvider,
    },
  })

  const businessContext = await getBusinessContext(workspaceId).catch(() => null)
  const companyContextBlock = businessContext && !businessContext.isEmpty
    ? buildCompanyContextBlock(businessContext)
    : null

  try {
    const execResult = await runToolExecution({
      toolName: instance.toolDefinition.name,
      toolDescription: instance.toolDefinition.description,
      category: instance.toolDefinition.category,
      fields: schemaResult.data.dataSchema.fields,
      variables,
      model: chosenModel,
      provider: chosenProvider,
      temperature: cfg?.temperature ?? null,
      maxTokens: cfg?.maxTokens ?? null,
      systemPromptOverride: cfg?.systemPromptOverride ?? null,
      customInstructions: cfg?.customInstructions ?? null,
      outputFormat: cfg?.outputFormat ?? 'markdown',
      language: cfg?.language ?? 'es',
      companyContextBlock,
    })

    await db.toolExecution.update({
      where: { id: execution.id },
      data: {
        status: 'COMPLETED',
        result: execResult.result,
        systemPrompt: execResult.systemPrompt,
        userPrompt: execResult.userPrompt,
        inputTokens: execResult.inputTokens,
        outputTokens: execResult.outputTokens,
        estimatedCostEUR: execResult.estimatedCostEUR,
        durationMs: execResult.durationMs,
      },
    })

    // Actualizar Business Memory con los datos de la ejecución (fire and forget)
    void updateMemoryFromExecution({
      workspaceId,
      toolSlug:    instance.toolDefinition.slug,
      variables:   variables as Record<string, unknown>,
      actorUserId: user.id,
      executionId: execution.id,
    })

    // DATA-001 — registrar primera ejecución exitosa por org (TTFV)
    void db.toolExecution
      .count({ where: { workspace: { orgId: user.orgId }, status: 'COMPLETED' } })
      .then((total) => {
        if (total === 1) {
          // Esta es la primera ejecución completada de la organización
          trackEvent({
            orgId:       user.orgId,
            userId:      user.id,
            workspaceId,
            event:       'tool.execution.first',
            source:      'api',
            properties:  {
              toolCategory: instance.toolDefinition.category,
              model:        execResult.model,
              durationMs:   execResult.durationMs,
            },
          })
        }
      })
      .catch(() => { /* silencioso — no bloquea */ })

    // Registrar uso (fire-and-forget centralizado)
    recordAIUsage({
      userId:           user.id,
      orgId:            user.orgId,
      workspaceId,
      model:            execResult.model,
      inputTokens:      execResult.inputTokens,
      outputTokens:     execResult.outputTokens,
      estimatedCostEUR: execResult.estimatedCostEUR,
      durationMs:       execResult.durationMs,
      status:           'success',
    })

    audit({
      orgId: user.orgId,
      workspaceId,
      actorUserId: user.id,
      action: 'tool.execute',
      entityType: 'tool_instance',
      entityId: toolInstanceId,
      result: 'success',
      metadata: { model: execResult.model, durationMs: execResult.durationMs, estimatedCostEUR: execResult.estimatedCostEUR },
    })

    return NextResponse.json({
      executionId: execution.id,
      result: execResult.result,
      model: execResult.model,
      inputTokens: execResult.inputTokens,
      outputTokens: execResult.outputTokens,
      estimatedCostEUR: execResult.estimatedCostEUR,
      durationMs: execResult.durationMs,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido'

    await db.toolExecution.update({
      where: { id: execution.id },
      data: { status: 'FAILED', errorMessage },
    })

    recordAIUsage({
      userId:           user.id,
      orgId:            user.orgId,
      workspaceId,
      model:            chosenModel,
      inputTokens:      0,
      outputTokens:     0,
      estimatedCostEUR: 0,
      durationMs:       0,
      status:           'error',
      errorMessage,
    })

    audit({
      orgId: user.orgId,
      workspaceId,
      actorUserId: user.id,
      action: 'tool.execute',
      entityType: 'tool_instance',
      entityId: toolInstanceId,
      result: 'failure',
      metadata: { errorMessage },
    })

    return NextResponse.json(
      { error: 'Error al ejecutar la herramienta. Inténtalo de nuevo.' },
      { status: 500 },
    )
  }
}
