/**
 * Mission Execution Engine — CRUD de pasos de misión.
 * MISSION-002: cada cambio de paso recalcula progreso + Mission State +
 * Next Action, y registra eventos de timeline simplificados.
 */

import { db } from '@/lib/db'
import type {
  MissionStepData,
  StepStatus,
  StepPriority,
  ResponsibleActor,
  CreateStepInput,
  UpdateStepInput,
} from './types'
import { computeMissionState, getNextAction } from './mission-state'
import { getOrCreateIntelligence, syncMissionState } from './intelligence'
import { logTimelineEvent } from './timeline'
import { generateMissionRecommendations } from './ai-recommendations'
import { saveAIRecommendations } from './intelligence'
import type { CompanyObjectiveData } from '@/lib/business-memory'

function mapStep(s: {
  id: string
  objectiveId: string
  workspaceId: string
  title: string
  description: string | null
  status: string
  priority: string
  responsibleActor: string
  estimatedMinutes: number | null
  sortOrder: number
  assignedUserId: string | null
  assignedUser?: { name: string | null } | null
  recommendedCategory: string | null
  linkedToolInstanceId: string | null
  completedAt: Date | null
  resultNote: string | null
  createdAt: Date
  updatedAt: Date
}): MissionStepData {
  return {
    id:          s.id,
    objectiveId: s.objectiveId,
    workspaceId: s.workspaceId,
    title:       s.title,
    description: s.description,
    status:      s.status as StepStatus,
    priority:    s.priority as StepPriority,
    responsibleActor: s.responsibleActor as ResponsibleActor,
    estimatedMinutes: s.estimatedMinutes,
    sortOrder:   s.sortOrder,
    assignedUserId:   s.assignedUserId,
    assignedUserName: s.assignedUser?.name ?? null,
    recommendedCategory:  s.recommendedCategory,
    linkedToolInstanceId: s.linkedToolInstanceId,
    completedAt: s.completedAt?.toISOString() ?? null,
    resultNote:  s.resultNote,
    createdAt:   s.createdAt.toISOString(),
    updatedAt:   s.updatedAt.toISOString(),
  }
}

export async function getSteps(
  objectiveId: string,
  workspaceId: string,
): Promise<MissionStepData[]> {
  const rows = await db.missionStep.findMany({
    where:   { objectiveId, workspaceId },
    orderBy: { sortOrder: 'asc' },
    include: { assignedUser: { select: { name: true } } },
  })
  return rows.map(mapStep)
}

export async function createStep(
  objectiveId: string,
  workspaceId: string,
  input: CreateStepInput,
): Promise<MissionStepData> {
  // sortOrder: coloca al final por defecto
  const maxOrder = await db.missionStep.aggregate({
    where: { objectiveId, workspaceId },
    _max:  { sortOrder: true },
  })
  const sortOrder = input.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1

  const step = await db.missionStep.create({
    data: {
      objectiveId,
      workspaceId,
      title:            input.title.trim().slice(0, 300),
      description:      input.description?.trim().slice(0, 1000) ?? null,
      priority:         input.priority ?? 'medium',
      responsibleActor: input.responsibleActor ?? 'user',
      estimatedMinutes: input.estimatedMinutes ?? null,
      sortOrder,
      recommendedCategory:  input.recommendedCategory ?? null,
      linkedToolInstanceId: input.linkedToolInstanceId ?? null,
    },
    include: { assignedUser: { select: { name: true } } },
  })

  await getOrCreateIntelligence(objectiveId, workspaceId)
  await logTimelineEvent(objectiveId, workspaceId, 'created')
  await _syncObjectiveProgress(objectiveId, workspaceId)

  return mapStep(step)
}

export async function updateStep(
  id: string,
  workspaceId: string,
  input: UpdateStepInput,
): Promise<MissionStepData | null> {
  const existing = await db.missionStep.findFirst({ where: { id, workspaceId } })
  if (!existing) return null

  const isCompleting = input.status === 'completed' && existing.status !== 'completed'

  const step = await db.missionStep.update({
    where: { id },
    data: {
      ...(input.title       !== undefined ? { title: input.title.trim().slice(0, 300) } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim().slice(0, 1000) ?? null } : {}),
      ...(input.status      !== undefined ? { status: input.status } : {}),
      ...(input.priority    !== undefined ? { priority: input.priority } : {}),
      ...(input.responsibleActor !== undefined ? { responsibleActor: input.responsibleActor } : {}),
      ...(input.estimatedMinutes !== undefined ? { estimatedMinutes: input.estimatedMinutes } : {}),
      ...(input.sortOrder   !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...('assignedUserId'  in input ? { assignedUserId: input.assignedUserId ?? null } : {}),
      ...(input.recommendedCategory  !== undefined ? { recommendedCategory: input.recommendedCategory } : {}),
      ...(input.linkedToolInstanceId !== undefined ? { linkedToolInstanceId: input.linkedToolInstanceId } : {}),
      ...(input.resultNote  !== undefined ? { resultNote: input.resultNote?.trim().slice(0, 2000) ?? null } : {}),
      ...(isCompleting ? { completedAt: new Date() } : {}),
    },
    include: { assignedUser: { select: { name: true } } },
  })

  // Recalcula progreso, Mission State, Next Action y timeline del objetivo padre
  await _syncObjectiveProgress(existing.objectiveId, workspaceId)

  return mapStep(step)
}

export async function deleteStep(
  id: string,
  workspaceId: string,
): Promise<boolean> {
  const existing = await db.missionStep.findFirst({ where: { id, workspaceId } })
  if (!existing) return false

  await db.missionStep.delete({ where: { id } })
  await _syncObjectiveProgress(existing.objectiveId, workspaceId)
  return true
}

/**
 * Recalcula y persiste el progreso (0-100) en el CompanyObjective padre,
 * deriva el Mission State + Next Action (MISSION-002), registra el evento
 * de timeline correspondiente, y dispara recomendaciones de IA al completar.
 */
async function _syncObjectiveProgress(
  objectiveId: string,
  workspaceId: string,
): Promise<void> {
  const all = await db.missionStep.findMany({
    where:   { objectiveId, workspaceId },
    orderBy: { sortOrder: 'asc' },
    include: { assignedUser: { select: { name: true } } },
  })

  if (all.length === 0) return

  const completed = all.filter((s) => s.status === 'completed').length
  const progress  = Math.round((completed / all.length) * 100)
  const wasCompleting = progress >= 100

  await db.companyObjective.updateMany({
    where: { id: objectiveId, workspaceId },
    data:  {
      progress,
      ...(wasCompleting ? { status: 'completed', completedAt: new Date() } : {}),
    },
  })

  const steps = all.map(mapStep)
  const objectiveRow = await db.companyObjective.findFirst({ where: { id: objectiveId, workspaceId } })
  const objectiveStatus = objectiveRow?.status ?? 'active'

  const prevIntelligence = await getOrCreateIntelligence(objectiveId, workspaceId)
  const state = computeMissionState(objectiveStatus, steps)
  const action = getNextAction(state, steps)
  await syncMissionState(objectiveId, workspaceId, state, action)

  // Timeline simplificado: created ya se registra al crear el primer paso.
  if (state === 'in_progress' && prevIntelligence.state === 'ready') {
    await logTimelineEvent(objectiveId, workspaceId, 'started')
  } else if (state === 'waiting_user' && prevIntelligence.state === 'in_progress') {
    await logTimelineEvent(objectiveId, workspaceId, 'paused')
  } else if (state === 'completed' && prevIntelligence.state !== 'completed') {
    await logTimelineEvent(objectiveId, workspaceId, 'completed')

    // Recomendaciones de IA al completar — no bloqueante (fire-and-forget)
    if (objectiveRow) {
      const objectiveData: CompanyObjectiveData = {
        id:               objectiveRow.id,
        workspaceId:      objectiveRow.workspaceId,
        canonicalGoal:    objectiveRow.canonicalGoal,
        label:            objectiveRow.label,
        description:      objectiveRow.description,
        status:           objectiveRow.status as CompanyObjectiveData['status'],
        priority:         objectiveRow.priority as CompanyObjectiveData['priority'],
        progress:         objectiveRow.progress,
        dueDate:          objectiveRow.dueDate?.toISOString() ?? null,
        completedAt:      objectiveRow.completedAt?.toISOString() ?? null,
        linkedWorkflowId: objectiveRow.linkedWorkflowId,
        clientId:         null,
        clientName:       null,
      }
      generateMissionRecommendations(objectiveData, steps, 'completion')
        .then((recs) => {
          if (recs.length > 0) return saveAIRecommendations(objectiveId, workspaceId, recs)
        })
        .catch(() => { /* fallo silencioso: no bloquea el flujo del usuario */ })
    }
  }
}
