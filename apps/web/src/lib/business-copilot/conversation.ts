/**
 * Conversation — persistencia ligera del estado de conversación en DB.
 *
 * Solo guarda lo esencial. Los steps completos de un plan NO se almacenan.
 * El estado se reconstruye al vuelo desde los motores cuando es necesario.
 */

import { db } from '@/lib/db'
import type { ConversationState, CopilotPhase, PlanSummary } from './copilot-types'
import type { IntentResult } from '@/lib/intent-engine/types'
import type { ExecutionPlan } from '@/lib/planning-engine/planner-types'
import type { Prisma } from '@prisma/client'

// ── Mappers ────────────────────────────────────────────────────────

function toState(row: {
  id: string
  workspaceId: string
  userId: string
  phase: string
  rawInput: string | null
  currentGoal: string | null
  intentResult: Prisma.JsonValue
  rankedPlans: Prisma.JsonValue
  selectedPlan: Prisma.JsonValue
  clarifyingQuestion: string | null
  collectedAnswers: Prisma.JsonValue
  generatedWorkflowId: string | null
  turnCount: number
  createdAt: Date
  updatedAt: Date
}): ConversationState {
  return {
    id:                  row.id,
    workspaceId:         row.workspaceId,
    userId:              row.userId,
    phase:               row.phase as CopilotPhase,
    rawInput:            row.rawInput,
    currentGoal:         row.currentGoal,
    intentResult:        row.intentResult as IntentResult | null,
    rankedPlans:         (Array.isArray(row.rankedPlans) ? row.rankedPlans : []) as unknown as PlanSummary[],
    selectedPlan:        row.selectedPlan as ExecutionPlan | null,
    clarifyingQuestion:  row.clarifyingQuestion,
    collectedAnswers:    (row.collectedAnswers ?? {}) as Record<string, string>,
    generatedWorkflowId: row.generatedWorkflowId,
    turnCount:           row.turnCount,
    startedAt:           row.createdAt.toISOString(),
    updatedAt:           row.updatedAt.toISOString(),
  }
}

// ── Public functions ───────────────────────────────────────────────

export async function createConversation(
  workspaceId: string,
  userId: string,
): Promise<ConversationState> {
  // Cerrar conversaciones anteriores abiertas del mismo usuario/workspace
  await db.copilotConversation.updateMany({
    where:  { workspaceId, userId, closedAt: null, phase: { not: 'done' } },
    data:   { closedAt: new Date(), phase: 'done' },
  })

  const row = await db.copilotConversation.create({
    data: { workspaceId, userId, phase: 'greeting' },
  })
  return toState(row)
}

export async function getConversation(
  id: string,
  workspaceId: string,
): Promise<ConversationState | null> {
  const row = await db.copilotConversation.findFirst({
    where: { id, workspaceId, closedAt: null },
  })
  return row ? toState(row) : null
}

export async function getActiveConversation(
  workspaceId: string,
  userId: string,
): Promise<ConversationState | null> {
  const row = await db.copilotConversation.findFirst({
    where:   { workspaceId, userId, closedAt: null, phase: { not: 'done' } },
    orderBy: { updatedAt: 'desc' },
  })
  return row ? toState(row) : null
}

export async function advanceConversation(
  id: string,
  patch: Partial<{
    phase:               CopilotPhase
    rawInput:            string
    currentGoal:         string
    intentResult:        IntentResult
    rankedPlans:         PlanSummary[]
    selectedPlan:        ExecutionPlan
    clarifyingQuestion:  string | null
    collectedAnswers:    Record<string, string>
    generatedWorkflowId: string
  }>,
): Promise<ConversationState> {
  const data: Prisma.CopilotConversationUpdateInput = { turnCount: { increment: 1 } }

  if (patch.phase)               data.phase               = patch.phase
  if (patch.rawInput)            data.rawInput            = patch.rawInput
  if (patch.currentGoal)         data.currentGoal         = patch.currentGoal
  if (patch.intentResult)        data.intentResult        = patch.intentResult as unknown as Prisma.InputJsonValue
  if (patch.rankedPlans)         data.rankedPlans         = patch.rankedPlans as unknown as Prisma.InputJsonValue
  if (patch.selectedPlan)        data.selectedPlan        = patch.selectedPlan as unknown as Prisma.InputJsonValue
  if ('clarifyingQuestion' in patch) data.clarifyingQuestion = patch.clarifyingQuestion
  if (patch.collectedAnswers)    data.collectedAnswers    = patch.collectedAnswers as Prisma.InputJsonValue
  if (patch.generatedWorkflowId) data.generatedWorkflowId = patch.generatedWorkflowId

  const row = await db.copilotConversation.update({ where: { id }, data })
  return toState(row)
}

export async function closeConversation(id: string): Promise<void> {
  await db.copilotConversation.update({
    where: { id },
    data:  { phase: 'done', closedAt: new Date() },
  })
}
