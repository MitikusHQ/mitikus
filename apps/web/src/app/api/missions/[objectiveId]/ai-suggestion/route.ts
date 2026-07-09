/**
 * POST /api/missions/[objectiveId]/ai-suggestion — MISSION-002 Fase 8.
 * Genera (o regenera) recomendaciones de IA para la misión, disponibles
 * en cualquier momento de la ejecución (no solo al completarla).
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getSteps } from '@/lib/missions/mission-steps'
import { generateMissionRecommendations } from '@/lib/missions/ai-recommendations'
import { saveAIRecommendations } from '@/lib/missions/intelligence'
import type { CompanyObjectiveData } from '@/lib/business-memory'

export const runtime = 'nodejs'

async function resolveAccess(userId: string, objectiveId: string) {
  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { orgId: true } })
  if (!user) return null

  const objective = await db.companyObjective.findFirst({
    where: { id: objectiveId, workspace: { orgId: user.orgId } },
  })
  return objective
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ objectiveId: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { objectiveId } = await params
  const objective = await resolveAccess(userId, objectiveId)
  if (!objective) return NextResponse.json({ error: 'Misión no encontrada' }, { status: 404 })

  const steps = await getSteps(objectiveId, objective.workspaceId)

  const objectiveData: CompanyObjectiveData = {
    id:               objective.id,
    workspaceId:      objective.workspaceId,
    canonicalGoal:    objective.canonicalGoal,
    label:            objective.label,
    description:      objective.description,
    status:           objective.status as CompanyObjectiveData['status'],
    priority:         objective.priority as CompanyObjectiveData['priority'],
    progress:         objective.progress,
    dueDate:          objective.dueDate?.toISOString() ?? null,
    completedAt:      objective.completedAt?.toISOString() ?? null,
    linkedWorkflowId: objective.linkedWorkflowId,
    clientId:         null,
    clientName:       null,
  }

  const recommendations = await generateMissionRecommendations(objectiveData, steps, 'in_progress')
  if (recommendations.length > 0) {
    await saveAIRecommendations(objectiveId, objective.workspaceId, recommendations)
  }

  return NextResponse.json({ recommendations })
}
