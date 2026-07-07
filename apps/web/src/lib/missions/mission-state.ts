/**
 * Mission State Engine (MISSION-002) — deriva el estado de una misión
 * y la "próxima acción" a partir de sus pasos. Determinista, sin IA:
 * el usuario nunca debe preguntarse "¿y ahora qué?".
 */

import type {
  MissionStepData,
  MissionState,
  NextAction,
  StepPriority,
} from './types'
import { nextStep } from './types'

/** Deriva el MissionState a partir del estado del objetivo y sus pasos. */
export function computeMissionState(
  objectiveStatus: string,
  steps: MissionStepData[],
): MissionState {
  if (objectiveStatus === 'cancelled') return 'archived'

  if (steps.length === 0) {
    return objectiveStatus === 'completed' ? 'completed' : 'new'
  }

  if (steps.some((s) => s.status === 'blocked')) return 'blocked'

  const allDone = steps.every((s) => s.status === 'completed' || s.status === 'skipped')
  if (allDone) return 'completed'

  const next = nextStep(steps)
  if (!next) return 'completed'

  if (next.responsibleActor === 'ai') return 'waiting_ai'

  if (next.status === 'in_progress') return 'in_progress'

  // next.status === 'pending'
  const hasAnyProgress = steps.some((s) => s.status === 'completed')
  return hasAnyProgress ? 'waiting_user' : 'ready'
}

/** Devuelve siempre una respuesta a "¿qué tengo que hacer ahora?". */
export function getNextAction(
  state: MissionState,
  steps: MissionStepData[],
): NextAction {
  if (steps.length === 0) {
    return {
      text:     'Define los pasos de esta misión para empezar.',
      actor:    'user',
      stepId:   null,
      ctaLabel: 'Añadir primer paso',
    }
  }

  if (state === 'completed') {
    return {
      text:     'Misión completada. Revisa las recomendaciones para continuar.',
      actor:    'shared',
      stepId:   null,
      ctaLabel: 'Ver recomendaciones',
    }
  }

  if (state === 'blocked') {
    const blocked = steps.find((s) => s.status === 'blocked')
    return {
      text:     blocked ? `"${blocked.title}" está bloqueado. Resuélvelo para continuar.` : 'Hay un paso bloqueado.',
      actor:    blocked?.responsibleActor ?? 'user',
      stepId:   blocked?.id ?? null,
      ctaLabel: 'Revisar bloqueo',
    }
  }

  const next = nextStep(steps)
  if (!next) {
    return {
      text:     'Misión completada. Revisa las recomendaciones para continuar.',
      actor:    'shared',
      stepId:   null,
      ctaLabel: 'Ver recomendaciones',
    }
  }

  if (next.responsibleActor === 'ai') {
    return {
      text:     next.status === 'in_progress'
        ? `La IA está trabajando en "${next.title}".`
        : `La IA se encargará de "${next.title}".`,
      actor:    'ai',
      stepId:   next.id,
      ctaLabel: 'Ver progreso',
    }
  }

  return {
    text:     `Tu próximo paso: "${next.title}".`,
    actor:    next.responsibleActor,
    stepId:   next.id,
    ctaLabel: next.status === 'in_progress' ? 'Continuar paso' : 'Iniciar paso',
  }
}

/** Tiempo restante (minutos) sumando los pasos no completados/omitidos. */
export function remainingMinutes(steps: MissionStepData[]): number {
  return steps
    .filter((s) => s.status !== 'completed' && s.status !== 'skipped')
    .reduce((sum, s) => sum + (s.estimatedMinutes ?? 0), 0)
}

const PRIORITY_STARS: Record<StepPriority, number> = {
  critical: 5,
  high:     4,
  medium:   3,
  low:      2,
}

export function priorityToStars(priority: StepPriority): number {
  return PRIORITY_STARS[priority]
}
