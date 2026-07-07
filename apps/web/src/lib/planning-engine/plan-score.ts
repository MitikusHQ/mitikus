/**
 * Plan Score — puntuación determinista de un plan (0-100).
 *
 * Pesos:
 *   compatibility 30% — compatibilidad entre herramientas consecutivas
 *   coverage      20% — cobertura de herramientas del goal
 *   quality       15% — calidad media de las herramientas
 *   speed         15% — inverso del tiempo (más rápido = mayor score)
 *   cost          10% — inverso del coste (más barato = mayor score)
 *   risk          10% — inverso del riesgo
 *
 * Sin IA. Sin randomness. Dado el mismo input siempre devuelve el mismo output.
 */

import { calculateCompatibility } from '@/lib/tool-intelligence/compatibility'
import { CAPABILITY_PROFILES } from '@/registry/official/_capability-profiles'
import type { PlanScore, PlanRisk, PlanStrategyType } from './planner-types'
import type { ToolHistoryScore } from './planner-types'

const QUALITY_SCORES: Record<string, number> = {
  draft:        50,
  standard:     75,
  professional: 100,
}

const RISK_INVERSE: Record<string, number> = {
  low:    100,
  medium: 60,
  high:   20,
}

const WEIGHTS = {
  compatibility: 0.30,
  coverage:      0.20,
  quality:       0.15,
  speed:         0.15,
  cost:          0.10,
  risk:          0.10,
} as const

// Umbrales de tiempo y coste para normalización
const MAX_MINUTES_REFERENCE = 7 * 480  // 7 días laborables
const MAX_COST_REFERENCE    = 10.0     // 10 EUR = coste máximo de referencia

interface ScoreInput {
  toolSlugs:           string[]
  goalPrimaryTools:    string[]    // herramientas canónicas del objetivo
  totalMinutes:        number
  totalCostEUR:        number
  risk:                PlanRisk
  strategyType:        PlanStrategyType
  historyScores:       ToolHistoryScore[]  // puede estar vacío
}

/**
 * Calcula la puntuación determinista de un plan.
 */
export function scorePlan(input: ScoreInput): PlanScore {
  const {
    toolSlugs,
    goalPrimaryTools,
    totalMinutes,
    totalCostEUR,
    risk,
    historyScores,
  } = input

  // ── Compatibility: media de compatibilidad entre pares consecutivos ──────
  const compatibility = calcCompatibility(toolSlugs)

  // ── Coverage: % de herramientas del goal incluidas en el plan ────────────
  const coverage = calcCoverage(toolSlugs, goalPrimaryTools)

  // ── Quality: media de qualityLevel de las herramientas ──────────────────
  const quality = calcQuality(toolSlugs)

  // ── Speed: inverso del tiempo normalizado ────────────────────────────────
  const speed = calcSpeed(totalMinutes)

  // ── Cost: inverso del coste normalizado ──────────────────────────────────
  const cost = calcCost(totalCostEUR)

  // ── Risk: inverso del nivel de riesgo ────────────────────────────────────
  const riskScore = RISK_INVERSE[risk.level] ?? 60

  // ── History: media de scores históricos (0.5 neutral si sin datos) ───────
  const history = calcHistory(toolSlugs, historyScores)

  // ── Total ponderado ───────────────────────────────────────────────────────
  const total = Math.round(
    compatibility * WEIGHTS.compatibility +
    coverage      * WEIGHTS.coverage      +
    quality       * WEIGHTS.quality       +
    speed         * WEIGHTS.speed         +
    cost          * WEIGHTS.cost          +
    riskScore     * WEIGHTS.risk,
  )

  return {
    total:         clamp(total),
    compatibility: clamp(compatibility),
    coverage:      clamp(coverage),
    quality:       clamp(quality),
    speed:         clamp(speed),
    cost:          clamp(cost),
    risk:          riskScore,
    history:       clamp(history),
  }
}

// ── Helpers ───────────────────────────────────────────────────────

function calcCompatibility(slugs: string[]): number {
  if (slugs.length < 2) return 80  // plan de 1 tool → score neutro

  let total = 0
  let pairs = 0
  for (let i = 0; i < slugs.length - 1; i++) {
    const slugA = slugs[i]
    const slugB = slugs[i + 1]
    if (!slugA || !slugB) continue
    const a = CAPABILITY_PROFILES[slugA]
    const b = CAPABILITY_PROFILES[slugB]
    if (a && b) {
      const compat = calculateCompatibility(a, b, slugB)
      total += compat.score
      pairs++
    }
  }

  return pairs > 0 ? Math.round(total / pairs) : 70
}

function calcCoverage(slugs: string[], primary: string[]): number {
  if (primary.length === 0) return 70
  const planSet   = new Set(slugs)
  const covered   = primary.filter((s) => planSet.has(s)).length
  return Math.round((covered / primary.length) * 100)
}

function calcQuality(slugs: string[]): number {
  if (slugs.length === 0) return 50
  const scores = slugs.map((slug) => {
    const p = CAPABILITY_PROFILES[slug]
    return p ? (QUALITY_SCORES[p.qualityLevel] ?? 75) : 75
  })
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

function calcSpeed(totalMinutes: number): number {
  if (totalMinutes <= 0) return 100
  const normalized = totalMinutes / MAX_MINUTES_REFERENCE
  return Math.round((1 - Math.min(normalized, 1)) * 100)
}

function calcCost(totalCostEUR: number): number {
  if (totalCostEUR <= 0) return 100
  const normalized = totalCostEUR / MAX_COST_REFERENCE
  return Math.round((1 - Math.min(normalized, 1)) * 100)
}

function calcHistory(slugs: string[], history: ToolHistoryScore[]): number {
  if (history.length === 0) return 75  // sin datos → score neutro

  const histMap = new Map(history.map((h) => [h.toolSlug, h.score]))
  const scores  = slugs.map((slug) => {
    const h = histMap.get(slug)
    return h !== undefined ? h * 100 : 75  // neutral si no hay dato de ese tool
  })
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v))
}
