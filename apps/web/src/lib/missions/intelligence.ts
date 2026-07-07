/**
 * Mission Intelligence (MISSION-002) — capa 1:1 sobre CompanyObjective.
 * Mantiene CompanyObjective pequeño: todo lo "inteligente" vive aquí.
 */

import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import type {
  MissionIntelligenceData,
  MissionState,
  NextAction,
  AIRecommendation,
} from './types'

function mapIntelligence(row: {
  id: string
  objectiveId: string
  workspaceId: string
  why: string | null
  expectedBenefit: string | null
  whatItUnlocks: string | null
  departmentsAffected: string | null
  impactScore: number
  urgencyScore: number
  effortScore: number
  riskLevel: string
  state: string
  nextActionText: string | null
  nextActionStepId: string | null
  aiRecommendations: Prisma.JsonValue
  completedLearnings: string | null
  createdAt: Date
  updatedAt: Date
}): MissionIntelligenceData {
  return {
    id:          row.id,
    objectiveId: row.objectiveId,
    workspaceId: row.workspaceId,
    why:                 row.why,
    expectedBenefit:     row.expectedBenefit,
    whatItUnlocks:       row.whatItUnlocks,
    departmentsAffected: row.departmentsAffected,
    impactScore:  row.impactScore,
    urgencyScore: row.urgencyScore,
    effortScore:  row.effortScore,
    riskLevel:    row.riskLevel as 'low' | 'medium' | 'high',
    state:        row.state as MissionState,
    nextActionText:   row.nextActionText,
    nextActionStepId: row.nextActionStepId,
    aiRecommendations:  (row.aiRecommendations as unknown as AIRecommendation[] | null) ?? null,
    completedLearnings: row.completedLearnings,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

/** Lee la inteligencia de una misión; la crea con defaults si no existe. */
export async function getOrCreateIntelligence(
  objectiveId: string,
  workspaceId: string,
): Promise<MissionIntelligenceData> {
  const existing = await db.missionIntelligence.findUnique({ where: { objectiveId } })
  if (existing) return mapIntelligence(existing)

  const created = await db.missionIntelligence.create({
    data: { objectiveId, workspaceId },
  })
  return mapIntelligence(created)
}

/** Sincroniza el estado derivado y la próxima acción (llamado tras cada cambio de paso). */
export async function syncMissionState(
  objectiveId: string,
  workspaceId: string,
  state: MissionState,
  nextAction: NextAction,
): Promise<void> {
  await db.missionIntelligence.upsert({
    where:  { objectiveId },
    create: {
      objectiveId,
      workspaceId,
      state,
      nextActionText:   nextAction.text,
      nextActionStepId: nextAction.stepId,
    },
    update: {
      state,
      nextActionText:   nextAction.text,
      nextActionStepId: nextAction.stepId,
    },
  })
}

export interface UpdateIntelligenceInput {
  why?:                 string
  expectedBenefit?:     string
  whatItUnlocks?:       string
  departmentsAffected?: string
  impactScore?:  number
  urgencyScore?: number
  effortScore?:  number
  riskLevel?:    'low' | 'medium' | 'high'
}

/** Actualiza los campos editables de Mission Insights / Business Impact. */
export async function updateIntelligence(
  objectiveId: string,
  workspaceId: string,
  input: UpdateIntelligenceInput,
): Promise<MissionIntelligenceData> {
  const row = await db.missionIntelligence.upsert({
    where:  { objectiveId },
    create: { objectiveId, workspaceId, ...input },
    update: input,
  })
  return mapIntelligence(row)
}

/** Persiste la última tanda de recomendaciones de IA. */
export async function saveAIRecommendations(
  objectiveId: string,
  workspaceId: string,
  recommendations: AIRecommendation[],
): Promise<void> {
  await db.missionIntelligence.upsert({
    where:  { objectiveId },
    create: { objectiveId, workspaceId, aiRecommendations: recommendations as unknown as Prisma.InputJsonValue },
    update: { aiRecommendations: recommendations as unknown as Prisma.InputJsonValue },
  })
}
