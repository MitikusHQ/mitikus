import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { executeWorkflow } from '@/lib/workflow-engine'
import { validateGraph } from '@/lib/workflow-graph'
import { audit } from '@/lib/audit'

export const runtime = 'nodejs'
export const maxDuration = 300  // 5 minutos — workflows pueden ser largos

interface RouteParams {
  params: Promise<{ workflowId: string }>
}

interface RequestBody {
  workspaceId?: string
  variables?: Record<string, string>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { workflowId } = await params
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

  const { workspaceId, variables = {} } = body
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId requerido' }, { status: 400 })

  const [workspace, workflow] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } }),
    db.workflow.findFirst({
      where: { id: workflowId, workspaceId },
      include: {
        nodes: { where: { isDisabled: false } },
        connections: true,
      },
    }),
  ])

  if (!workspace) return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })
  if (!workflow) return NextResponse.json({ error: 'Workflow no encontrado' }, { status: 404 })
  if (!workflow.isActive) return NextResponse.json({ error: 'Workflow desactivado' }, { status: 400 })

  const activeNodes = workflow.nodes
  const activeConnections = workflow.connections.filter(
    (c) => activeNodes.some((n) => n.id === c.sourceNodeId) && activeNodes.some((n) => n.id === c.targetNodeId),
  )

  const validation = validateGraph(
    activeNodes.map((n) => ({ id: n.id })),
    activeConnections.map((c) => ({ sourceNodeId: c.sourceNodeId, targetNodeId: c.targetNodeId })),
  )

  if (!validation.isValid) {
    return NextResponse.json({ error: validation.errors.join('; ') }, { status: 422 })
  }

  // Crear registro de ejecución
  const execution = await db.workflowExecution.create({
    data: {
      workflowId,
      workspaceId,
      userId: user.id,
      status: 'PENDING',
      variables: variables as Record<string, string>,
    },
  })

  try {
    const result = await executeWorkflow(execution.id, user.id, workspaceId, user.orgId, workflowId, variables)

    audit({
      orgId: user.orgId,
      workspaceId,
      actorUserId: user.id,
      action: 'workflow.execute',
      entityType: 'workflow',
      entityId: workflowId,
      result: result.status === 'COMPLETED' ? 'success' : 'failure',
      metadata: { executionId: execution.id, totalCostEUR: result.totalCostEUR, durationMs: result.durationMs },
    })

    return NextResponse.json({
      workflowExecutionId: result.workflowExecutionId,
      status: result.status,
      finalOutput: result.finalOutput,
      totalCostEUR: result.totalCostEUR,
      durationMs: result.durationMs,
      errorMessage: result.errorMessage ?? null,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
    await db.workflowExecution.update({
      where: { id: execution.id },
      data: { status: 'FAILED', errorMessage, completedAt: new Date() },
    })
    audit({
      orgId: user.orgId,
      workspaceId,
      actorUserId: user.id,
      action: 'workflow.execute',
      entityType: 'workflow',
      entityId: workflowId,
      result: 'failure',
      metadata: { executionId: execution.id, errorMessage },
    })
    return NextResponse.json({ error: 'Error al ejecutar el workflow. Consulta el historial para más detalles.' }, { status: 500 })
  }
}
