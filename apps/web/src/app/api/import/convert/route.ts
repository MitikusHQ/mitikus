// POST /api/import/convert
// Recibe un NormalizedDocument + workspaceId, llama a Claude y devuelve un ToolSchema candidato

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { convertToToolSchema, validateImportedSchema } from '@protools/import-engine'
import type { NormalizedDocument } from '@protools/import-engine'
import { db } from '@/lib/db'
import { checkAllLimits } from '@/lib/ai-rate-limit'
import { estimateCostEUR } from '@/lib/ai-cost'
import { recordAIUsage } from '@/lib/ai-usage'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MODEL = 'claude-sonnet-4-6'

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, orgId: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (!body || !body.document || !body.workspaceId) {
    return NextResponse.json({ error: 'Se requieren: document, workspaceId' }, { status: 400 })
  }

  const document: NormalizedDocument = body.document
  const workspaceId: string = body.workspaceId

  // Verificar que el workspace pertenece al org del usuario (anti-IDOR)
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })
  }

  // Rate limiting
  const limitHit = await checkAllLimits(user.id, workspaceId)
  if (limitHit && !limitHit.allowed) {
    return NextResponse.json({ error: limitHit.reason ?? 'Límite de uso alcanzado' }, { status: 429 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const startMs = Date.now()
  let inputTokens = 0
  let outputTokens = 0

  try {
    const result = await convertToToolSchema(document, {
      callAI: async (systemPrompt, userPrompt) => {
        const msg = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        })
        inputTokens = msg.usage.input_tokens
        outputTokens = msg.usage.output_tokens
        return msg.content[0]?.type === 'text' ? msg.content[0].text : ''
      },
    })

    const durationMs = Date.now() - startMs

    recordAIUsage({
      userId:           user.id,
      orgId:            user.orgId,
      workspaceId,
      model:            MODEL,
      inputTokens,
      outputTokens,
      estimatedCostEUR: estimateCostEUR(MODEL, inputTokens, outputTokens),
      durationMs,
      status:           'success',
    })

    const validation = validateImportedSchema(result.schema)

    return NextResponse.json({
      schema:           result.schema,
      valid:            validation.valid,
      validationErrors: validation.errors,
      warnings:         result.warnings,
      usage: {
        inputTokens,
        outputTokens,
        costEUR:    estimateCostEUR(MODEL, inputTokens, outputTokens),
        durationMs,
      },
    })
  } catch {
    const durationMs = Date.now() - startMs

    recordAIUsage({
      userId:           user.id,
      orgId:            user.orgId,
      workspaceId,
      model:            MODEL,
      inputTokens,
      outputTokens,
      estimatedCostEUR: estimateCostEUR(MODEL, inputTokens, outputTokens),
      durationMs,
      status:           'error',
    })

    return NextResponse.json(
      { error: 'Error al convertir el documento. Inténtalo de nuevo.' },
      { status: 500 },
    )
  }
}
