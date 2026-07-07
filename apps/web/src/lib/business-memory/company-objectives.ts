/**
 * Company Objectives — objetivos estratégicos del workspace.
 */

import { db } from '@/lib/db'
import { getOrCreateProfile } from './company-profile'
import type { CompanyObjectiveData, ObjectiveStatus, ObjectivePriority } from './memory-types'

function mapObjective(o: {
  id: string
  workspaceId: string
  canonicalGoal: string | null
  label: string
  description: string | null
  status: string
  priority: string
  progress: number
  dueDate: Date | null
  completedAt: Date | null
  linkedWorkflowId: string | null
}): CompanyObjectiveData {
  return {
    id:               o.id,
    workspaceId:      o.workspaceId,
    canonicalGoal:    o.canonicalGoal,
    label:            o.label,
    description:      o.description,
    status:           o.status as ObjectiveStatus,
    priority:         o.priority as ObjectivePriority,
    progress:         o.progress,
    dueDate:          o.dueDate?.toISOString() ?? null,
    completedAt:      o.completedAt?.toISOString() ?? null,
    linkedWorkflowId: o.linkedWorkflowId,
  }
}

export async function getObjectives(
  workspaceId: string,
  status?: ObjectiveStatus,
): Promise<CompanyObjectiveData[]> {
  const rows = await db.companyObjective.findMany({
    where:   { workspaceId, ...(status ? { status } : {}) },
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
  })
  return rows.map(mapObjective)
}

export async function createObjective(
  workspaceId: string,
  data: {
    canonicalGoal?: string
    label: string
    description?: string
    priority?: ObjectivePriority
    dueDate?: Date
    linkedWorkflowId?: string
  },
): Promise<CompanyObjectiveData> {
  const profile = await getOrCreateProfile(workspaceId)

  const obj = await db.companyObjective.create({
    data: {
      workspaceId,
      profileId:       profile.id,
      canonicalGoal:   data.canonicalGoal ?? null,
      label:           data.label.trim().slice(0, 300),
      description:     data.description?.trim().slice(0, 1000) ?? null,
      priority:        data.priority ?? 'medium',
      dueDate:         data.dueDate ?? null,
      linkedWorkflowId: data.linkedWorkflowId ?? null,
    },
  })
  return mapObjective(obj)
}

export async function updateObjectiveProgress(
  id: string,
  workspaceId: string,
  progress: number,
  linkedWorkflowId?: string,
): Promise<CompanyObjectiveData | null> {
  const obj = await db.companyObjective.findFirst({ where: { id, workspaceId } })
  if (!obj) return null

  const isCompleted = progress >= 100
  const updated     = await db.companyObjective.update({
    where: { id },
    data:  {
      progress:         Math.min(100, Math.max(0, progress)),
      status:           isCompleted ? 'completed' : obj.status,
      completedAt:      isCompleted ? new Date() : obj.completedAt,
      ...(linkedWorkflowId ? { linkedWorkflowId } : {}),
    },
  })
  return mapObjective(updated)
}

export async function upsertObjectiveByGoal(
  workspaceId: string,
  canonicalGoal: string,
  label: string,
  linkedWorkflowId?: string,
): Promise<CompanyObjectiveData> {
  const existing = await db.companyObjective.findFirst({
    where: { workspaceId, canonicalGoal, status: { not: 'cancelled' } },
  })

  if (existing) {
    const updated = await db.companyObjective.update({
      where: { id: existing.id },
      data:  { linkedWorkflowId: linkedWorkflowId ?? existing.linkedWorkflowId },
    })
    return mapObjective(updated)
  }

  return createObjective(workspaceId, { canonicalGoal, label, linkedWorkflowId })
}
