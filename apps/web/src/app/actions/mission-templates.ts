'use server'

import { requireUser } from '@/lib/auth'
import { createObjective } from '@/lib/business-memory/company-objectives'
import { createStep } from '@/lib/missions/mission-steps'
import { MISSION_TEMPLATES } from '@/lib/missions/templates'

export async function createMissionFromTemplate(
  workspaceId: string,
  templateId: string,
): Promise<{ objectiveId: string }> {
  const user = await requireUser()

  const template = MISSION_TEMPLATES.find((t) => t.id === templateId)
  if (!template) throw new Error('Plantilla no encontrada')

  const objective = await createObjective(workspaceId, {
    label:    template.label,
    description: template.description,
    priority: template.priority,
  })

  for (let i = 0; i < template.steps.length; i++) {
    const s = template.steps[i]!
    await createStep(objective.id, workspaceId, {
      title:               s.title,
      description:         s.description,
      priority:            i === 0 ? 'high' : 'medium',
      responsibleActor:    s.responsibleActor,
      estimatedMinutes:    s.estimatedMinutes,
      sortOrder:           i,
      recommendedCategory: s.recommendedCategory,
    })
  }

  void user // used for auth guard only

  return { objectiveId: objective.id }
}
