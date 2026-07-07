/**
 * Plan Builder — construye ExecutionPlan a partir de una lista de herramientas y un IntentResult.
 *
 * Responsabilidades:
 *   - Organizar herramientas en fases (diagnóstico → diseño → implementación → cierre)
 *   - Generar PlanStep con rationale explicable
 *   - Construir PlanReasoning completo
 *   - Calcular missingRequirements
 *
 * NO hace peticiones a DB. Usa solo estructuras en memoria:
 *   CAPABILITY_PROFILES, GOAL_CATALOG, plan-cost, plan-risk.
 */

import { randomUUID } from 'crypto'
import { CAPABILITY_PROFILES } from '@/registry/official/_capability-profiles'
import { GOAL_CATALOG } from '@/lib/intent-engine/goals'
import { estimatePlanCost } from './plan-cost'
import { calculatePlanRisk } from './plan-risk'
import type { IntentResult } from '@/lib/intent-engine/types'
import type {
  ExecutionPlan,
  PlanPhase,
  PlanStep,
  PlanReasoning,
  PlanStrategyType,
} from './planner-types'
import type { StrategyToolList } from './goal-strategies'

// Heurísticas de fase por posición en el pipeline
const PHASE_LABELS = ['Diagnóstico', 'Diseño', 'Implementación', 'Cierre']
const PHASE_DESCRIPTIONS = [
  'Análisis y evaluación del estado actual',
  'Definición de la estrategia y planificación',
  'Ejecución de las acciones del plan',
  'Revisión, validación y entrega de resultados',
]

/**
 * Construye un ExecutionPlan completo a partir de una estrategia y un IntentResult.
 */
export function buildPlan(
  intentResult: IntentResult,
  strategy: StrategyToolList,
  historyPenalties: Record<string, number> = {},
): ExecutionPlan {
  const { canonicalGoal, rawGoal, domain, constraints, missingInformation } = intentResult

  const goalDef = canonicalGoal ? GOAL_CATALOG[canonicalGoal] : null
  const primaryTools = goalDef?.primaryTools ?? []

  // Calcular coste y tiempo
  const costData = estimatePlanCost(strategy.toolSlugs)

  // Construir steps con metadata
  const allSteps = strategy.toolSlugs.map((slug, i) =>
    buildStep(slug, i + 1, intentResult, primaryTools, historyPenalties),
  )

  // Organizar en fases
  const phases = groupIntoPhases(allSteps, strategy.strategyType)

  // Calcular missingRequirements
  const missingRequirements = buildMissingRequirements(
    canonicalGoal,
    intentResult,
    primaryTools,
  )

  // Riesgo
  const risk = calculatePlanRisk({
    toolSlugs: strategy.toolSlugs,
    missingRequirements,
    estimatedDays: costData.estimatedDays,
  })

  // Reasoning (explicabilidad)
  const reasoning = buildReasoning(
    intentResult,
    strategy,
    primaryTools,
    missingRequirements,
  )

  return {
    id:                  randomUUID(),
    canonicalGoal,
    rawGoal,
    domain,
    strategyType:        strategy.strategyType,
    label:               strategy.label,
    description:         strategy.description,
    phases,
    totalSteps:          allSteps.length,
    totalTools:          new Set(strategy.toolSlugs).size,
    estimatedMinutes:    costData.totalMinutes,
    estimatedDays:       costData.estimatedDays,
    estimatedCostEUR:    costData.totalCostEUR,
    recommendedProvider: costData.dominantProvider,
    recommendedModel:    costData.dominantModel,
    score:               { total: 0, compatibility: 0, coverage: 0, quality: 0, speed: 0, cost: 0, risk: 0, history: 0 },
    risk,
    constraints,
    missingRequirements,
    reasoning,
    isRecommended:       false,
    generatedAt:         new Date().toISOString(),
  }
}

// ── Step builder ──────────────────────────────────────────────────

function buildStep(
  slug: string,
  order: number,
  intent: IntentResult,
  primaryTools: string[],
  historyPenalties: Record<string, number>,
): PlanStep {
  const profile = CAPABILITY_PROFILES[slug]

  const toolName = slugToLabel(slug)
  const isPrimary = primaryTools.includes(slug)
  const penalty   = historyPenalties[slug] ?? 1.0

  const rationale = buildRationale(slug, profile, isPrimary, penalty, intent)

  return {
    id:               `step-${order}-${slug}`,
    toolSlug:         slug,
    toolName,
    order,
    rationale,
    estimatedMinutes: profile ? minutesByQuality(profile.qualityLevel) : 30,
    estimatedCostEUR: profile?.executionCostEUR ?? 0.05,
    qualityLevel:     profile?.qualityLevel ?? 'standard',
    isOptional:       !isPrimary,
    canAutomate:      profile?.automationFriendly ?? false,
    inputTypes:       profile?.inputTypes ?? [],
    outputTypes:      profile?.outputTypes ?? [],
    dependencies:     resolveStepDependencies(slug, order),
    provider:         profile?.supportedProviders[0] ?? 'anthropic',
    model:            profile?.recommendedModels[0] ?? 'claude-sonnet-4-6',
  }
}

function buildRationale(
  slug: string,
  profile: import('@/lib/tool-intelligence/types').CapabilityProfile | null | undefined,
  isPrimary: boolean,
  penalty: number,
  intent: IntentResult,
): string {
  if (!profile) return `Herramienta seleccionada para ${intent.rawGoal}`

  const parts: string[] = []

  if (isPrimary) {
    parts.push(`Herramienta principal para "${intent.rawGoal}"`)
  } else {
    parts.push(`Complementa el objetivo en el dominio ${profile.businessDomain}`)
  }

  if (profile.outputTypes.length > 0) {
    parts.push(`produce ${profile.outputTypes.slice(0, 2).join(', ')}`)
  }

  if (!profile.automationFriendly) {
    parts.push('requiere revisión humana')
  }

  if (penalty < 0.7) {
    parts.push(`historial de éxito bajo (${Math.round(penalty * 100)}%)`)
  }

  return parts.join(' — ')
}

function resolveStepDependencies(slug: string, order: number): string[] {
  if (order <= 1) return []
  const profile = CAPABILITY_PROFILES[slug]
  if (!profile || profile.dependencies.length === 0) return []
  // Devuelve los IDs de steps previos que corresponden a las deps declaradas
  return profile.dependencies.map((dep) => `step-${order - 1}-${dep}`)
}

// ── Phase grouper ─────────────────────────────────────────────────

function groupIntoPhases(steps: PlanStep[], strategy: PlanStrategyType): PlanPhase[] {
  if (steps.length === 0) return []

  // Para fast y economic: todo en una sola fase
  if (strategy !== 'complete' || steps.length <= 3) {
    return [
      {
        id:          'phase-1',
        order:       1,
        label:       `Fase 1 — ${PHASE_LABELS[0] ?? 'Diagnóstico'}`,
        description: PHASE_DESCRIPTIONS[0] ?? 'Análisis y evaluación del estado actual',
        steps,
        canParallel: steps.every((s) => s.canAutomate) && steps.length > 1,
      },
    ]
  }

  // Para complete: dividir en hasta 4 fases por cuartos
  const phaseCount   = Math.min(4, Math.ceil(steps.length / 2))
  const chunkSize    = Math.ceil(steps.length / phaseCount)
  const phases: PlanPhase[] = []

  for (let i = 0; i < phaseCount; i++) {
    const chunk = steps.slice(i * chunkSize, (i + 1) * chunkSize)
    if (chunk.length === 0) continue

    phases.push({
      id:          `phase-${i + 1}`,
      order:       i + 1,
      label:       `Fase ${i + 1} — ${PHASE_LABELS[i] ?? `Etapa ${i + 1}`}`,
      description: PHASE_DESCRIPTIONS[i] ?? `Etapa ${i + 1} del proceso`,
      steps:       chunk,
      canParallel: chunk.every((s) => s.canAutomate) && chunk.length > 1,
    })
  }

  return phases
}

// ── Reasoning ─────────────────────────────────────────────────────

function buildReasoning(
  intent: IntentResult,
  strategy: StrategyToolList,
  primaryTools: string[],
  missingRequirements: string[],
): PlanReasoning {
  const goalLabel = intent.canonicalGoal ?? intent.rawGoal
  const domainLabel = intent.domain

  // Qué herramientas se descartaron (primarias no incluidas)
  const included   = new Set(strategy.toolSlugs)
  const discarded  = primaryTools
    .filter((s) => !included.has(s))
    .map((s) => `"${slugToLabel(s)}" excluido — estrategia ${strategy.strategyType} prioriza ${strategy.strategyType === 'fast' ? 'automatización' : 'coste'}`)

  // Flujo de datos entre herramientas consecutivas
  const dataFlow: string[] = []
  for (let i = 0; i < strategy.toolSlugs.length - 1; i++) {
    const slugA = strategy.toolSlugs[i]
    const slugB = strategy.toolSlugs[i + 1]
    if (!slugA || !slugB) continue
    const a = CAPABILITY_PROFILES[slugA]
    const b = CAPABILITY_PROFILES[slugB]
    if (a && b) {
      const aOutputs = a.outputTypes as string[]
      const bInputs  = b.inputTypes  as string[]
      const shared   = aOutputs.filter((t) => bInputs.includes(t))
      if (shared.length > 0) {
        dataFlow.push(`${slugToLabel(slugA)} → ${shared.join(', ')} → ${slugToLabel(slugB)}`)
      }
    }
  }

  const strategyDescriptions: Record<PlanStrategyType, string> = {
    complete: 'Estrategia completa — maximiza cobertura y calidad del objetivo',
    fast:     'Estrategia rápida — prioriza herramientas automatizables para ejecución inmediata',
    economic: 'Estrategia económica — selecciona herramientas de menor coste por ejecución',
  }

  return {
    goalMapping:    `${goalLabel} → dominio: ${domainLabel}`,
    toolSelection:  strategy.toolSlugs.map((slug) => {
      const p = CAPABILITY_PROFILES[slug]
      return `"${slugToLabel(slug)}" seleccionado${p ? ` (${p.businessDomain}, ${p.qualityLevel})` : ''}`
    }),
    toolsDiscarded: discarded,
    strategyChoice: strategyDescriptions[strategy.strategyType],
    dataFlow,
  }
}

// ── Missing requirements ──────────────────────────────────────────

function buildMissingRequirements(
  canonicalGoal: IntentResult['canonicalGoal'],
  intent: IntentResult,
  _primaryTools: string[],
): string[] {
  const missing: string[] = [...intent.missingInformation]

  // Si el goal tiene requiredEntities, verificar cuáles faltan
  if (canonicalGoal) {
    const goalDef = GOAL_CATALOG[canonicalGoal]
    if (goalDef) {
      for (const entity of goalDef.requiredEntities) {
        const value = intent.entities[entity as keyof typeof intent.entities]
        if (!value) {
          const labels: Record<string, string> = {
            company_name: 'Nombre de la empresa',
            website:      'URL del sitio web',
            product:      'Nombre del producto o servicio',
            market:       'Mercado objetivo',
            sector:       'Sector de actividad',
            regulation:   'Normativa aplicable',
            brand:        'Nombre de marca',
            country:      'País de operación',
          }
          const label = labels[entity] ?? entity
          if (!missing.includes(label)) missing.push(label)
        }
      }
    }
  }

  return missing
}

// ── Utils ─────────────────────────────────────────────────────────

function slugToLabel(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function minutesByQuality(level: string): number {
  const map: Record<string, number> = { draft: 15, standard: 30, professional: 60 }
  return map[level] ?? 30
}
