/**
 * Goal Orchestrator — orquesta los motores existentes en el orden correcto.
 *
 * Flujo:
 *   1. analyzeIntent(input)                 — Intent Engine
 *   2. getBusinessContext(workspaceId)       — Business Memory
 *   3. determineClarifyingQuestion(...)      — Question Engine
 *   4. buildExecutionPlans(intentResult)     — Planning Engine
 *   5. toPlanSummary(plans)                 — serialización ligera
 *
 * El Orchestrator NO contiene reglas de negocio.
 * Cada motor es responsable de su propio dominio.
 */

import { analyzeIntent } from '@/lib/intent-engine'
import { buildExecutionPlans } from '@/lib/planning-engine'
import { getBusinessContext } from '@/lib/business-memory'
import { updateMemoryFromIntent } from '@/lib/business-memory'
import { determineClarifyingQuestion } from './question-engine'
import type { PlanSummary } from './copilot-types'
import type { IntentResult } from '@/lib/intent-engine/types'
import type { ExecutionPlan } from '@/lib/planning-engine/planner-types'
import type { BusinessContext } from '@/lib/business-memory/memory-types'

// ── Orchestration result ─────────────────────────────────────────

export interface OrchestrationResult {
  intentResult:  IntentResult
  context:       BusinessContext
  needsQuestion: boolean
  question:      { question: string; field: string; options?: string[] } | null
  plans:         PlanSummary[]
  rawPlans:      ExecutionPlan[]     // planes completos para selección posterior
}

// ── Main entrypoint ───────────────────────────────────────────────

export async function orchestrateGoal(
  input: string,
  workspaceId: string,
  actorUserId: string,
  collectedAnswers: Record<string, string> = {},
): Promise<OrchestrationResult> {

  // 1. Intent Engine (LLM call — el único del copilot)
  const intentResult = await analyzeIntent(input)

  // 2. Business Memory — en paralelo al planning engine
  const context = await getBusinessContext(workspaceId)

  // 3. ¿Hace falta preguntar algo?
  const question = determineClarifyingQuestion(intentResult, context, collectedAnswers)

  if (question) {
    // Guardar intención en memoria incluso si no podemos planificar aún
    void updateMemoryFromIntent({
      workspaceId,
      entities:      intentResult.entities,
      canonicalGoal: intentResult.canonicalGoal,
      actorUserId,
    }).catch(() => undefined)

    return {
      intentResult,
      context,
      needsQuestion: true,
      question,
      plans:    [],
      rawPlans: [],
    }
  }

  // 4. Planning Engine (determinista, sin LLM)
  const rankedResult = await buildExecutionPlans(intentResult)

  // 5. Fire-and-forget — actualizar memoria
  void updateMemoryFromIntent({
    workspaceId,
    entities:      intentResult.entities,
    canonicalGoal: intentResult.canonicalGoal,
    actorUserId,
  }).catch(() => undefined)

  return {
    intentResult,
    context,
    needsQuestion: false,
    question:      null,
    plans:         rankedResult.plans.map(toPlanSummary),
    rawPlans:      rankedResult.plans,
  }
}

/**
 * Re-orquesta solo el planning cuando ya tenemos intención.
 * Se usa tras responder la pregunta de aclaración.
 */
export async function orchestratePlanningOnly(
  intentResult: IntentResult,
  workspaceId: string,
): Promise<{ plans: PlanSummary[]; rawPlans: ExecutionPlan[]; context: BusinessContext }> {
  const [rankedResult, context] = await Promise.all([
    buildExecutionPlans(intentResult),
    getBusinessContext(workspaceId),
  ])

  return {
    plans:    rankedResult.plans.map(toPlanSummary),
    rawPlans: rankedResult.plans,
    context,
  }
}

// ── Serialization ─────────────────────────────────────────────────

function toPlanSummary(plan: ExecutionPlan): PlanSummary {
  const toolSlugs = plan.phases.flatMap((ph) => ph.steps).map((s) => s.toolSlug)
  return {
    id:            plan.id,
    strategyType:  plan.strategyType,
    label:         plan.label,
    description:   plan.description,
    totalTools:    plan.totalTools,
    estimatedDays: plan.estimatedDays,
    score:         plan.score.total,
    riskLevel:     plan.risk.level,
    isRecommended: plan.isRecommended,
    toolSlugs,
    reasoning:     plan.reasoning.strategyChoice,
  }
}

/**
 * Recupera el plan completo dado un id desde los rawPlans.
 * Se usa cuando el usuario elige una estrategia.
 */
export function findPlanById(
  rawPlans: ExecutionPlan[],
  planId: string,
): ExecutionPlan | null {
  return rawPlans.find((p) => p.id === planId) ?? null
}
