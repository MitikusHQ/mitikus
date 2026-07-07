/**
 * Plan Ranking — ordena los planes por score y marca el mejor.
 *
 * Criterio de desempate (mismo total):
 *   1. Menor riesgo
 *   2. Mayor coverage
 *   3. Menor coste
 */

import { scorePlan } from './plan-score'
import type { ExecutionPlan, ToolHistoryScore } from './planner-types'
import type { CanonicalGoal } from '@/lib/intent-engine/types'
import { GOAL_CATALOG } from '@/lib/intent-engine/goals'

const RISK_ORDER: Record<string, number> = { low: 0, medium: 1, high: 2 }

/**
 * Aplica scores a los planes y los devuelve ordenados (mejor primero).
 */
export function rankPlans(
  plans: ExecutionPlan[],
  canonicalGoal: CanonicalGoal | null,
  historyScores: ToolHistoryScore[],
): ExecutionPlan[] {
  const primaryTools = canonicalGoal
    ? (GOAL_CATALOG[canonicalGoal]?.primaryTools ?? [])
    : []

  // Calcular score de cada plan
  const scored = plans.map((plan) => {
    const allSlugs = plan.phases.flatMap((ph) => ph.steps.map((s) => s.toolSlug))

    const score = scorePlan({
      toolSlugs:        allSlugs,
      goalPrimaryTools: primaryTools,
      totalMinutes:     plan.estimatedMinutes,
      totalCostEUR:     plan.estimatedCostEUR,
      risk:             plan.risk,
      strategyType:     plan.strategyType,
      historyScores,
    })

    return { ...plan, score }
  })

  // Ordenar por score total desc, luego por criterios de desempate
  const sorted = scored.sort((a, b) => {
    if (b.score.total !== a.score.total)         return b.score.total - a.score.total
    if (a.risk.level !== b.risk.level)           return RISK_ORDER[a.risk.level]! - RISK_ORDER[b.risk.level]!
    if (b.score.coverage !== a.score.coverage)   return b.score.coverage - a.score.coverage
    return a.estimatedCostEUR - b.estimatedCostEUR
  })

  // Marcar el plan ganador
  return sorted.map((plan, i) => ({ ...plan, isRecommended: i === 0 }))
}
