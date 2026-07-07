'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'

// Tipo serializable para RSC → client
export interface ExecutionSummary {
  id: string
  status: string
  model: string
  inputTokens: number
  outputTokens: number
  estimatedCostEUR: number
  durationMs: number
  errorMessage: string | null
  createdAt: string // ISO string
  userName: string | null
}

export interface ExecutionDetail extends ExecutionSummary {
  result: string | null
  systemPrompt: string | null
  userPrompt: string | null
  variables: Record<string, unknown>
  provider: string
}

async function resolveUser() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true },
  })
  if (!user) redirect('/onboarding')
  return user
}

async function verifyWorkspace(workspaceId: string, orgId: string) {
  return db.workspace.findFirst({
    where: { id: workspaceId, orgId },
    select: { id: true },
  })
}

export async function getExecutionHistory(
  toolInstanceId: string,
  workspaceId: string,
  limit = 20,
): Promise<ExecutionSummary[]> {
  const user = await resolveUser()
  const workspace = await verifyWorkspace(workspaceId, user.orgId)
  if (!workspace) return []

  const rows = await db.toolExecution.findMany({
    where: { toolInstanceId, workspaceId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return rows.map((e) => ({
    id: e.id,
    status: e.status,
    model: e.model,
    inputTokens: e.inputTokens,
    outputTokens: e.outputTokens,
    estimatedCostEUR: e.estimatedCostEUR,
    durationMs: e.durationMs,
    errorMessage: e.errorMessage,
    createdAt: e.createdAt.toISOString(),
    userName: e.user.name,
  }))
}

export async function getExecutionDetail(
  executionId: string,
  workspaceId: string,
): Promise<ExecutionDetail | null> {
  const user = await resolveUser()
  const workspace = await verifyWorkspace(workspaceId, user.orgId)
  if (!workspace) return null

  const e = await db.toolExecution.findFirst({
    where: { id: executionId, workspaceId },
    include: { user: { select: { name: true } } },
  })
  if (!e) return null

  return {
    id: e.id,
    status: e.status,
    model: e.model,
    provider: e.provider,
    inputTokens: e.inputTokens,
    outputTokens: e.outputTokens,
    estimatedCostEUR: e.estimatedCostEUR,
    durationMs: e.durationMs,
    errorMessage: e.errorMessage,
    createdAt: e.createdAt.toISOString(),
    userName: e.user.name,
    result: e.result,
    systemPrompt: e.systemPrompt,
    userPrompt: e.userPrompt,
    variables: (e.variables ?? {}) as Record<string, unknown>,
  }
}

export async function deleteExecution(
  executionId: string,
  workspaceId: string,
): Promise<{ error?: string }> {
  const user = await resolveUser()
  const workspace = await verifyWorkspace(workspaceId, user.orgId)
  if (!workspace) return { error: 'Workspace no encontrado' }

  const existing = await db.toolExecution.findFirst({
    where: { id: executionId, workspaceId },
    select: { id: true },
  })
  if (!existing) return { error: 'Ejecución no encontrada' }

  await db.toolExecution.delete({ where: { id: executionId } })
  return {}
}
