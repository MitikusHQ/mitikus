/**
 * mission-from-plan — crea una Misión real (CompanyObjective + MissionSteps)
 * a partir de un ExecutionPlan generado por el Planning Engine.
 *
 * Llamado desde el Copilot cuando el usuario selecciona un plan.
 */

import { createObjective, upsertObjectiveByGoal } from '@/lib/business-memory/company-objectives'
import { createStep } from './mission-steps'
import { db } from '@/lib/db'
import type { ExecutionPlan } from '@/lib/planning-engine/planner-types'

export interface MissionFromPlanResult {
  objectiveId: string
  stepsCreated: number
}

/**
 * Crea o reutiliza un CompanyObjective y genera sus MissionSteps
 * a partir de cada PlanStep del ExecutionPlan seleccionado.
 *
 * Si ya existe un objetivo activo con el mismo canonicalGoal, reutiliza
 * el existente y reemplaza sus pasos para reflejar el plan elegido.
 */
export async function createMissionFromPlan(
  plan: ExecutionPlan,
  workspaceId: string,
  userId: string,
): Promise<MissionFromPlanResult> {
  // 1. Crear o reutilizar el CompanyObjective
  const objective = plan.canonicalGoal
    ? await upsertObjectiveByGoal(workspaceId, plan.canonicalGoal, plan.rawGoal)
    : await createObjective(workspaceId, {
        label:       plan.rawGoal,
        description: plan.description,
        priority:    'high',
      })

  // 2. Si el objetivo ya tenía pasos (reutilización), borrarlos para evitar duplicados
  const existingSteps = await db.missionStep.count({
    where: { objectiveId: objective.id, workspaceId },
  })
  if (existingSteps > 0) {
    await db.missionStep.deleteMany({
      where: { objectiveId: objective.id, workspaceId },
    })
  }

  // 3. Aplanar fases → pasos en orden global
  const allSteps = plan.phases.flatMap((phase) =>
    phase.steps.map((step) => ({ phase, step })),
  )

  // 4. Pre-fetch ToolDefinitions y crear/reutilizar ToolInstances
  const slugs = [...new Set(allSteps.map(({ step }) => step.toolSlug))]
  const toolDefs = await db.toolDefinition.findMany({
    where:  { slug: { in: slugs } },
    select: { id: true, slug: true, category: true, name: true },
  })
  const defBySlug = Object.fromEntries(toolDefs.map((t) => [t.slug, t]))

  // Para cada ToolDefinition, encontrar o crear una ToolInstance en este workspace
  const instanceBySlug: Record<string, string> = {}
  for (const def of toolDefs) {
    const existing = await db.toolInstance.findFirst({
      where:  { workspaceId, toolDefinitionId: def.id, status: 'ACTIVE' },
      select: { id: true },
    })
    if (existing) {
      instanceBySlug[def.slug] = existing.id
    } else {
      const created = await db.toolInstance.create({
        data: {
          toolDefinitionId: def.id,
          workspaceId,
          name:      def.name,
          createdBy: userId,
        },
        select: { id: true },
      })
      instanceBySlug[def.slug] = created.id
    }
  }

  // 5. Crear cada MissionStep con su ToolInstance vinculada
  let sortOrder = 0
  for (const { step } of allSteps) {
    const isFirst = sortOrder === 0
    const def     = defBySlug[step.toolSlug]
    await createStep(objective.id, workspaceId, {
      title:            step.toolName,
      description:      step.rationale,
      priority:         isFirst ? 'high' : 'medium',
      responsibleActor: 'user',
      estimatedMinutes: step.estimatedMinutes,
      sortOrder,
      recommendedCategory:  def?.category ?? undefined,
      linkedToolInstanceId: instanceBySlug[step.toolSlug] ?? undefined,
    })
    sortOrder++
  }

  return {
    objectiveId:  objective.id,
    stepsCreated: allSteps.length,
  }
}
