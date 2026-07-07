/**
 * Planner Service — API pública del Planning Engine.
 *
 * Orquesta:
 *   IntentResult → [goal-strategies] → [plan-builder × 3] → [plan-ranking] → RankedPlanResult
 *
 * Integra Analytics (ToolExecution en DB) para penalizar herramientas
 * con mal historial. Sin embargo, NO modifica Analytics.
 *
 * Consume (sin modificar):
 *   - tool-intelligence: getToolCapabilities, searchByBusinessGoal
 *   - intent-engine/goals: GOAL_CATALOG
 *   - registry: CAPABILITY_PROFILES
 *   - db: ToolExecution (solo lectura para historial)
 */

import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { buildStrategiesForGoal, buildStrategiesForDomain } from './goal-strategies'
import { buildPlan } from './plan-builder'
import { rankPlans } from './plan-ranking'
import { filterValidPlans, validatePlan } from './plan-validator'
import { generateWorkflow } from './workflow-generator'
import type { IntentResult } from '@/lib/intent-engine/types'
import type {
  ExecutionPlan,
  RankedPlanResult,
  GeneratedWorkflow,
  PlanningRecord,
  ToolHistoryScore,
} from './planner-types'

// ── Public API ────────────────────────────────────────────────────

/**
 * Punto de entrada principal.
 * Recibe un IntentResult y devuelve 3 planes rankeados.
 */
export async function buildExecutionPlans(
  intentResult: IntentResult,
): Promise<RankedPlanResult> {
  const start     = Date.now()
  const requestId = randomUUID()

  const { canonicalGoal, domain } = intentResult

  // 1. Obtener historial de Analytics (fire y olvida en caso de error)
  const historyScores = await fetchToolHistoryScores(intentResult.suggestedTools).catch(() => [])
  const historyPenalties = Object.fromEntries(
    historyScores.map((h) => [h.toolSlug, h.score]),
  )

  // 2. Obtener estrategias de herramientas
  const strategies = canonicalGoal
    ? buildStrategiesForGoal(canonicalGoal)
    : buildStrategiesForDomain(domain)

  if (strategies.length === 0) {
    throw new Error(`No se encontraron estrategias para el objetivo: ${intentResult.rawGoal}`)
  }

  // 3. Construir un plan por estrategia
  const rawPlans = strategies.map((strategy) =>
    buildPlan(intentResult, strategy, historyPenalties),
  )

  // 4. Filtrar inválidos y rankear
  const { valid } = filterValidPlans(rawPlans)
  if (valid.length === 0) {
    throw new Error('Ningún plan superó la validación de integridad')
  }

  const rankedPlans = rankPlans(valid, canonicalGoal, historyScores)
  const best        = rankedPlans[0]!

  const planningMs = Date.now() - start

  // 5. Observabilidad (fire and forget)
  void persistPlanningRecord({
    requestId,
    intentGoal:     canonicalGoal,
    domain,
    plansGenerated: rankedPlans.length,
    bestStrategy:   best.strategyType,
    bestScore:      best.score.total,
    bestRisk:       best.risk.level,
    toolsInBest:    best.totalTools,
    estimatedDays:  best.estimatedDays,
    planningMs,
    timestamp:      new Date().toISOString(),
  })

  return {
    requestId,
    intentInput:   intentResult.input,
    canonicalGoal,
    domain,
    plans:         rankedPlans,
    best,
    planningMs,
  }
}

/**
 * Rankea una lista de planes ya construidos.
 * Útil si el cliente construye planes propios.
 */
export function rankPlansPublic(
  plans: ExecutionPlan[],
  canonicalGoal: IntentResult['canonicalGoal'],
): ExecutionPlan[] {
  return rankPlans(plans, canonicalGoal, [])
}

/**
 * Genera el workflow graph de un plan específico.
 */
export function generateWorkflowFromPlan(plan: ExecutionPlan): GeneratedWorkflow {
  return generateWorkflow(plan)
}

/**
 * Estima el coste de ejecución de un plan (sin ejecutarlo).
 */
export function estimateExecution(plan: ExecutionPlan): {
  totalCostEUR:  number
  totalMinutes:  number
  estimatedDays: number
  provider:      string
  model:         string
} {
  return {
    totalCostEUR:  plan.estimatedCostEUR,
    totalMinutes:  plan.estimatedMinutes,
    estimatedDays: plan.estimatedDays,
    provider:      plan.recommendedProvider,
    model:         plan.recommendedModel,
  }
}

/**
 * Valida un plan y devuelve errores/advertencias.
 */
export function validatePlanPublic(plan: ExecutionPlan) {
  return validatePlan(plan)
}

/**
 * Serializa un plan para consumo por LLMs (estructura plana).
 */
export function serializePlanForLLM(plan: ExecutionPlan): Record<string, unknown> {
  return {
    goal:             plan.rawGoal,
    canonicalGoal:    plan.canonicalGoal,
    domain:           plan.domain,
    strategy:         plan.strategyType,
    totalTools:       plan.totalTools,
    estimatedDays:    plan.estimatedDays,
    riskLevel:        plan.risk.level,
    riskFactors:      plan.risk.factors,
    score:            plan.score.total,
    tools:            plan.phases.flatMap((ph) =>
      ph.steps.map((s) => ({ slug: s.toolSlug, rationale: s.rationale })),
    ),
    missingInfo:      plan.missingRequirements,
    goalMapping:      plan.reasoning.goalMapping,
    strategyChoice:   plan.reasoning.strategyChoice,
  }
}

// ── Analytics integration (read-only) ─────────────────────────────

/**
 * Consulta el historial de ToolExecution para calcular la tasa de éxito
 * y duración media de cada herramienta solicitada.
 *
 * No modifica ningún dato. Solo lectura.
 */
async function fetchToolHistoryScores(toolSlugs: string[]): Promise<ToolHistoryScore[]> {
  if (toolSlugs.length === 0) return []

  // Buscar ejecuciones recientes (últimos 90 días) para las herramientas del plan
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  const executions = await db.toolExecution.findMany({
    where: {
      createdAt: { gte: since },
      toolInstance: {
        toolDefinition: {
          slug: { in: toolSlugs },
        },
      },
    },
    select: {
      status:     true,
      durationMs: true,
      toolInstance: {
        select: {
          toolDefinition: { select: { slug: true } },
        },
      },
    },
    take: 1000,   // límite para no hacer scans enormes
  })

  // Agrupar por slug
  const grouped: Record<string, { total: number; success: number; durations: number[] }> = {}

  for (const exec of executions) {
    const slug = exec.toolInstance.toolDefinition.slug
    if (!grouped[slug]) grouped[slug] = { total: 0, success: 0, durations: [] }

    grouped[slug]!.total++
    if (exec.status === 'COMPLETED') grouped[slug]!.success++
    if (exec.durationMs) grouped[slug]!.durations.push(exec.durationMs)
  }

  return Object.entries(grouped).map(([toolSlug, data]) => {
    const successRate  = data.total > 0 ? data.success / data.total : 1.0
    const avgDurationMs = data.durations.length > 0
      ? Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length)
      : 0

    // Penalizar si muchos fallos, o si tarda demasiado (> 2 min)
    let score = successRate
    if (avgDurationMs > 120_000) score *= 0.9

    return {
      toolSlug,
      score:       Math.min(1, Math.max(0, score)),
      executions:  data.total,
      successRate,
      avgDurationMs,
    }
  })
}

// ── Observabilidad ────────────────────────────────────────────────

async function persistPlanningRecord(record: PlanningRecord): Promise<void> {
  // El AuditLog requiere orgId que el servicio no conoce.
  // La API route llama a audit() con contexto completo.
  // Aquí solo trazamos para debugging.
  console.info('[planning-engine]', JSON.stringify({
    event:    'plan.generated',
    goal:     record.intentGoal,
    domain:   record.domain,
    strategy: record.bestStrategy,
    score:    record.bestScore,
    ms:       record.planningMs,
  }))
}
