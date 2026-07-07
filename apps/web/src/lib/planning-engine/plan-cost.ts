/**
 * Plan Cost — estimación de coste y tiempo por herramienta y por plan.
 *
 * Fuentes:
 *   - CAPABILITY_PROFILES.executionCostEUR (coste por ejecución)
 *   - Mapeo qualityLevel → estimatedMinutes (sin DB round-trip)
 *   - ai-cost.ts (pricing por modelo, para coste IA refinado)
 */

import { CAPABILITY_PROFILES } from '@/registry/official/_capability-profiles'
import type { QualityLevel } from '@/lib/tool-intelligence/types'

// Estimación de minutos por nivel de calidad (heurística conservadora)
const QUALITY_MINUTES: Record<QualityLevel, number> = {
  draft:        15,
  standard:     30,
  professional: 60,
}

const MINUTES_PER_DAY = 480   // 8h laborables

export interface ToolCostEstimate {
  toolSlug:         string
  estimatedMinutes: number
  estimatedCostEUR: number
  model:            string
  provider:         string
}

/**
 * Estima coste y tiempo de una herramienta individual.
 */
export function estimateToolCost(toolSlug: string): ToolCostEstimate {
  const profile = CAPABILITY_PROFILES[toolSlug]

  if (!profile) {
    return {
      toolSlug,
      estimatedMinutes: 30,
      estimatedCostEUR: 0.05,
      model:    'claude-sonnet-4-6',
      provider: 'anthropic',
    }
  }

  const model    = profile.recommendedModels[0]    ?? 'claude-sonnet-4-6'
  const provider = profile.supportedProviders[0]   ?? 'anthropic'

  return {
    toolSlug,
    estimatedMinutes: QUALITY_MINUTES[profile.qualityLevel],
    estimatedCostEUR: profile.executionCostEUR,
    model,
    provider,
  }
}

/**
 * Agrega coste y tiempo de una lista de tools.
 */
export function estimatePlanCost(toolSlugs: string[]): {
  totalMinutes:    number
  totalCostEUR:    number
  estimatedDays:   number
  dominantModel:   string
  dominantProvider: string
  perTool:         ToolCostEstimate[]
} {
  const perTool = toolSlugs.map(estimateToolCost)

  const totalMinutes  = perTool.reduce((s, t) => s + t.estimatedMinutes, 0)
  const totalCostEUR  = perTool.reduce((s, t) => s + t.estimatedCostEUR, 0)
  const estimatedDays = Math.max(1, Math.ceil(totalMinutes / MINUTES_PER_DAY))

  // Modelo/proveedor más frecuente
  const modelCounts: Record<string, number>    = {}
  const providerCounts: Record<string, number> = {}
  for (const t of perTool) {
    modelCounts[t.model]       = (modelCounts[t.model]    ?? 0) + 1
    providerCounts[t.provider] = (providerCounts[t.provider] ?? 0) + 1
  }

  const dominantModel    = mostFrequent(modelCounts)    ?? 'claude-sonnet-4-6'
  const dominantProvider = mostFrequent(providerCounts) ?? 'anthropic'

  return {
    totalMinutes,
    totalCostEUR: Math.round(totalCostEUR * 1000) / 1000,
    estimatedDays,
    dominantModel,
    dominantProvider,
    perTool,
  }
}

function mostFrequent(counts: Record<string, number>): string | undefined {
  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0]
}
