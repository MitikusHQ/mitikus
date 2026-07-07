/**
 * Mission Prioritization Engine (MISSION-002) — ordena las misiones
 * automáticamente (no por fecha) y explica siempre por qué.
 * Determinista, sin IA: rápido y gratis de ejecutar en cada carga del dashboard.
 */

import type { CompanyObjectiveData } from '@/lib/business-memory'
import type { MissionIntelligenceData, MissionState } from './types'

const OBJECTIVE_PRIORITY_WEIGHT: Record<string, number> = {
  critical: 5,
  high:     4,
  medium:   3,
  low:      1,
}

const STATE_WEIGHT: Record<MissionState, number> = {
  blocked:      -3, // baja prioridad de "hacer ahora" — necesita resolución, no impulso
  waiting_ai:    1,
  in_progress:   2, // ya empezada: terminar lo empezado
  waiting_user:  3, // pausada con progreso: recuperar el impulso
  ready:         1,
  new:           0,
  completed:    -10,
  archived:     -10,
}

export interface PriorityResult {
  score:   number
  reasons: string[]
}

/**
 * Calcula el score de prioridad de una misión.
 * Factores: prioridad de negocio, impacto, urgencia, esfuerzo (inverso),
 * estado actual (impulso/bloqueo) y riesgo.
 */
export function computePriorityScore(
  objective: CompanyObjectiveData,
  intelligence: MissionIntelligenceData | null,
  state: MissionState,
): PriorityResult {
  const reasons: string[] = []

  const priorityW = OBJECTIVE_PRIORITY_WEIGHT[objective.priority] ?? 3
  const impact   = intelligence?.impactScore  ?? 3
  const urgency  = intelligence?.urgencyScore ?? 3
  const effort   = intelligence?.effortScore  ?? 3
  const risk     = intelligence?.riskLevel    ?? 'medium'
  const stateW   = STATE_WEIGHT[state] ?? 0

  let score = priorityW * 2 + impact + urgency + (5 - effort) + stateW

  if (risk === 'high') {
    score += 1
    reasons.push('Mitiga un riesgo alto para el negocio')
  }

  if (objective.priority === 'critical' || objective.priority === 'high') {
    reasons.push(`Prioridad ${objective.priority === 'critical' ? 'crítica' : 'alta'} para la empresa`)
  }
  if (impact >= 4) reasons.push('Alto impacto esperado')
  if (urgency >= 4) reasons.push('Urgente')
  if (effort <= 2) reasons.push('Esfuerzo bajo: rápida de completar')
  if (state === 'in_progress') reasons.push('Ya está en marcha — termínala')
  if (state === 'waiting_user') reasons.push('Tiene progreso pausado esperando que continúes')
  if (state === 'blocked') reasons.push('Está bloqueada y necesita resolución')

  if (reasons.length === 0) reasons.push('Objetivo activo del negocio')

  return { score, reasons }
}

export interface RankedMission<T> {
  item:    T
  score:   number
  reasons: string[]
}

/** Ordena una lista de misiones por score descendente. */
export function rankMissions<
  T extends { objective: CompanyObjectiveData; intelligence: MissionIntelligenceData | null; state: MissionState },
>(missions: T[]): RankedMission<T>[] {
  return missions
    .map((m) => {
      const { score, reasons } = computePriorityScore(m.objective, m.intelligence, m.state)
      return { item: m, score, reasons }
    })
    .sort((a, b) => b.score - a.score)
}
