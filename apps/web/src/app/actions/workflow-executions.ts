'use server'

import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'

export interface WorkflowExecutionSummary {
  id: string
  workflowId: string
  status: string
  totalCostEUR: number
  durationMs: number
  errorMessage: string | null
  nodeCount: number
  completedNodeCount: number
  createdAt: string
  completedAt: string | null
}

export interface WorkflowNodeExecutionDetail {
  id: string
  workflowNodeId: string
  nodeLabel: string
  toolName: string
  status: string
  output: string | null
  errorMessage: string | null
  durationMs: number
  inputTokens: number
  outputTokens: number
  estimatedCostEUR: number
  startedAt: string | null
  completedAt: string | null
  resolvedInputs: Record<string, string>
}

export interface WorkflowExecutionDetail extends WorkflowExecutionSummary {
  finalOutput: string | null
  variables: Record<string, string>
  nodeExecutions: WorkflowNodeExecutionDetail[]
  logs: Array<{
    id: string
    level: string
    message: string
    workflowNodeId: string | null
    createdAt: string
  }>
}

export async function listWorkflowExecutions(
  workflowId: string,
  workspaceId: string,
  limit = 20,
): Promise<WorkflowExecutionSummary[]> {
  const user = await requireUser()
  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!workspace) throw new Error('Workspace no encontrado')

  const executions = await db.workflowExecution.findMany({
    where: { workflowId, workspaceId },
    include: {
      _count: { select: { nodeExecutions: true } },
      nodeExecutions: { where: { status: 'COMPLETED' }, select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return executions.map((e) => ({
    id: e.id,
    workflowId: e.workflowId,
    status: e.status,
    totalCostEUR: e.totalCostEUR,
    durationMs: e.durationMs,
    errorMessage: e.errorMessage,
    nodeCount: e._count.nodeExecutions,
    completedNodeCount: e.nodeExecutions.length,
    createdAt: e.createdAt.toISOString(),
    completedAt: e.completedAt?.toISOString() ?? null,
  }))
}

export async function getWorkflowExecutionDetail(
  executionId: string,
  workspaceId: string,
): Promise<WorkflowExecutionDetail | null> {
  const user = await requireUser()
  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!workspace) return null

  const e = await db.workflowExecution.findFirst({
    where: { id: executionId, workspaceId },
    include: {
      nodeExecutions: {
        include: { workflowNode: { include: { toolDefinition: true } } },
        orderBy: { createdAt: 'asc' },
      },
      logs: { orderBy: { createdAt: 'asc' } },
      _count: { select: { nodeExecutions: true } },
    },
  })
  if (!e) return null

  const completedNodes = e.nodeExecutions.filter((n) => n.status === 'COMPLETED').length

  return {
    id: e.id,
    workflowId: e.workflowId,
    status: e.status,
    totalCostEUR: e.totalCostEUR,
    durationMs: e.durationMs,
    errorMessage: e.errorMessage,
    nodeCount: e._count.nodeExecutions,
    completedNodeCount: completedNodes,
    finalOutput: e.finalOutput,
    variables: (e.variables ?? {}) as Record<string, string>,
    createdAt: e.createdAt.toISOString(),
    completedAt: e.completedAt?.toISOString() ?? null,
    nodeExecutions: e.nodeExecutions.map((n) => ({
      id: n.id,
      workflowNodeId: n.workflowNodeId,
      nodeLabel: n.workflowNode.label,
      toolName: n.workflowNode.toolDefinition.name,
      status: n.status,
      output: n.output,
      errorMessage: n.errorMessage,
      durationMs: n.durationMs,
      inputTokens: n.inputTokens,
      outputTokens: n.outputTokens,
      estimatedCostEUR: n.estimatedCostEUR,
      startedAt: n.startedAt?.toISOString() ?? null,
      completedAt: n.completedAt?.toISOString() ?? null,
      resolvedInputs: (n.resolvedInputs ?? {}) as Record<string, string>,
    })),
    logs: e.logs.map((l) => ({
      id: l.id,
      level: l.level,
      message: l.message,
      workflowNodeId: l.workflowNodeId,
      createdAt: l.createdAt.toISOString(),
    })),
  }
}
