/**
 * Copilot Service — API pública del Business Copilot.
 *
 * Funciones exportadas:
 *   startCopilot()         — crea conversación, devuelve greeting
 *   sendMessage()          — procesa mensaje del usuario, avanza estado
 *   selectPlan()           — usuario elige estrategia → genera workflow
 *   getCopilotSuggestions() — sugerencias independientes de conversación
 *
 * Nunca lanza excepciones. Devuelve siempre un CopilotResponse válido.
 */

import {
  createConversation,
  getConversation,
  advanceConversation,
  closeConversation,
} from './conversation'
import { orchestrateGoal, orchestratePlanningOnly } from './goal-orchestrator'
import { generateSuggestions }   from './suggestion-engine'
import { getBusinessContext, updateMemoryFromIntent } from '@/lib/business-memory'
import { generateWorkflowFromPlan } from '@/lib/planning-engine'
import { analyzeIntent } from '@/lib/intent-engine'
import { createMissionFromPlan } from '@/lib/missions/mission-from-plan'

import {
  buildGreetingMessage,
  buildContextAwareGreeting,
  buildUnderstandingMessage,
  buildClarifyingMessage,
  buildPlanningMessage,
  buildWorkflowReadyMessage,
  buildErrorMessage,
  buildPlanActions,
  buildWorkflowActions,
  buildRestartActions,
} from './response-builder'

import { getFallbackSuggestions } from './sector-suggestions'
import { randomUUID } from 'crypto'
import type {
  CopilotResponse,
  CopilotSuggestion,
  PlanSummary,
} from './copilot-types'
import type { ExecutionPlan } from '@/lib/planning-engine/planner-types'
import type { BusinessContext } from '@/lib/business-memory/memory-types'

// ── Start ─────────────────────────────────────────────────────────

export async function startCopilot(
  workspaceId: string,
  userId: string,
  companyDescription?: string,
): Promise<CopilotResponse> {
  const startMs = Date.now()

  const [conversation, initialContext] = await Promise.all([
    createConversation(workspaceId, userId),
    getBusinessContext(workspaceId),
  ])

  // Si viene descripción de empresa (FirstTimeExperience), extraer contexto y guardarlo
  // sin crear ningún objetivo — canonicalGoal: null es la clave
  if (companyDescription && initialContext.isEmpty) {
    try {
      const intentResult = await analyzeIntent(companyDescription)
      await updateMemoryFromIntent({
        workspaceId,
        entities:      intentResult.entities,
        canonicalGoal: null,
        actorUserId:   userId,
      })
    } catch {
      // No bloquear si falla
    }
  }

  const context = companyDescription
    ? await getBusinessContext(workspaceId)
    : initialContext

  const suggestions = await generateSuggestions(workspaceId, context)

  const message = companyDescription && !context.isEmpty
    ? buildContextAwareGreeting(context)
    : buildGreetingMessage(context)

  return {
    conversationId: conversation.id,
    phase:          'greeting',
    message,
    context,
    suggestions,
    plans:          [],
    selectedPlan:   null,
    workflowId:     null,
    objectiveId:    null,
    question:       null,
    actions:        buildRestartActions(),
    responseMs:     Date.now() - startMs,
  }
}

// ── Send Message ─────────────────────────────────────────────────

export async function sendMessage(
  conversationId: string,
  workspaceId:    string,
  userId:         string,
  message:        string,
): Promise<CopilotResponse> {
  const startMs = Date.now()

  const conversation = await getConversation(conversationId, workspaceId)
  if (!conversation) {
    const context = await getBusinessContext(workspaceId)
    return errorResponse(conversationId, context, 'unknown', Date.now() - startMs)
  }

  // Si la conversación está cerrada o en done, reiniciar
  if (conversation.phase === 'done') {
    return startCopilot(workspaceId, userId)
  }

  // ── Phase: clarifying → el usuario responde la pregunta ──────────
  if (conversation.phase === 'clarifying' && conversation.clarifyingQuestion) {
    const updatedAnswers = {
      ...conversation.collectedAnswers,
      [conversation.clarifyingQuestion]: message,
    }

    // Reejecutar planning con las respuestas acumuladas
    const intentResult = conversation.intentResult!
    const { plans, rawPlans, context } = await orchestratePlanningOnly(intentResult, workspaceId)

    const updated = await advanceConversation(conversationId, {
      phase:            'planning',
      collectedAnswers: updatedAnswers,
      rankedPlans:      plans,
    })

    console.info('[copilot] clarifying→planning', {
      conversationId,
      plansGenerated: plans.length,
    })

    return {
      conversationId,
      phase:        'planning',
      message:      buildPlanningMessage(plans, intentResult.rawGoal ?? message),
      context,
      suggestions:  [],
      plans,
      selectedPlan: null,
      workflowId:   null,
      objectiveId:  null,
      question:     null,
      actions:      buildPlanActions(plans),
      responseMs:   Date.now() - startMs,
    }
  }

  // ── Phase: planning → el usuario escribe en lugar de elegir plan ─
  if (conversation.phase === 'planning') {
    // Tratar el mensaje como un nuevo objetivo
    return processNewGoal(conversationId, workspaceId, userId, message, startMs)
  }

  // ── Phase: greeting / understanding → procesar nuevo objetivo ────
  return processNewGoal(conversationId, workspaceId, userId, message, startMs)
}

// ── Select Plan ──────────────────────────────────────────────────

export async function selectPlan(
  conversationId: string,
  workspaceId:    string,
  planId:         string,
  userId:         string,
): Promise<CopilotResponse> {
  const startMs = Date.now()

  const conversation = await getConversation(conversationId, workspaceId)
  if (!conversation || conversation.phase !== 'planning') {
    const context = await getBusinessContext(workspaceId)
    return errorResponse(conversationId, context, 'unknown', Date.now() - startMs)
  }

  const planSummary = conversation.rankedPlans.find((p) => p.id === planId)
  if (!planSummary) {
    const context = await getBusinessContext(workspaceId)
    return errorResponse(conversationId, context, 'no_plans', Date.now() - startMs)
  }

  const intentResult = conversation.intentResult!
  const context = await getBusinessContext(workspaceId)

  let objectiveId: string | null = null
  let stepsCreated = 0

  try {
    const { rawPlans } = await orchestratePlanningOnly(intentResult, workspaceId)
    // Buscar por strategyType (determinista) — los IDs son randomUUID() en cada llamada
    const selectedPlan = rawPlans.find((p) => p.strategyType === planSummary.strategyType) ?? null

    if (selectedPlan) {
      const mission = await createMissionFromPlan(selectedPlan, workspaceId, userId)
      objectiveId  = mission.objectiveId
      stepsCreated = mission.stepsCreated
    }
  } catch (err) {
    console.warn('[copilot] mission creation failed', err)
  }

  await advanceConversation(conversationId, {
    phase:               'workflow_ready',
    generatedWorkflowId: objectiveId ?? undefined,
  })

  console.info('[copilot] plan selected → mission created', {
    conversationId,
    planId,
    objectiveId,
    stepsCreated,
  })

  return {
    conversationId,
    phase:        'workflow_ready',
    message:      buildWorkflowReadyMessage(planSummary.label, objectiveId ?? ''),
    context,
    suggestions:  [],
    plans:        conversation.rankedPlans,
    selectedPlan: null,
    workflowId:   null,
    objectiveId,
    question:     null,
    actions:      buildWorkflowActions(objectiveId ?? ''),
    responseMs:   Date.now() - startMs,
  }
}

// ── Suggestions (sin conversación) ──────────────────────────────

export async function getCopilotSuggestions(
  workspaceId: string,
): Promise<CopilotSuggestion[]> {
  try {
    const context = await getBusinessContext(workspaceId)
    return generateSuggestions(workspaceId, context)
  } catch {
    return []
  }
}

// ── Private helpers ───────────────────────────────────────────────

async function processNewGoal(
  conversationId: string,
  workspaceId:    string,
  userId:         string,
  message:        string,
  startMs:        number,
): Promise<CopilotResponse> {
  // Marca como "entendiendo"
  await advanceConversation(conversationId, {
    phase:    'understanding',
    rawInput: message,
  })

  try {
    const conversation = await getConversation(conversationId, workspaceId)
    const collectedAnswers = conversation?.collectedAnswers ?? {}

    const result = await orchestrateGoal(message, workspaceId, userId, collectedAnswers)

    if (result.needsQuestion && result.question) {
      await advanceConversation(conversationId, {
        phase:              'clarifying',
        intentResult:       result.intentResult,
        currentGoal:        result.intentResult.rawGoal ?? message,
        clarifyingQuestion: result.question.field,
      })

      console.info('[copilot] needs clarification', {
        conversationId,
        field: result.question.field,
      })

      return {
        conversationId,
        phase:        'clarifying',
        message:      buildClarifyingMessage(result.question),
        context:      result.context,
        suggestions:  [],
        plans:        [],
        selectedPlan: null,
        workflowId:   null,
        objectiveId:  null,
        question:     result.question.question,
        actions:      [],
        responseMs:   Date.now() - startMs,
      }
    }

    if (result.plans.length === 0) {
      await advanceConversation(conversationId, {
        phase:        'planning',
        intentResult: result.intentResult,
        currentGoal:  result.intentResult.rawGoal ?? message,
      })

      return {
        conversationId,
        phase:        'planning',
        message:      buildErrorMessage('no_plans'),
        context:      result.context,
        suggestions:  getFallbackSuggestions(result.context.sector),
        plans:        [],
        selectedPlan: null,
        workflowId:   null,
        objectiveId:  null,
        question:     null,
        actions:      buildRestartActions(),
        responseMs:   Date.now() - startMs,
      }
    }

    await advanceConversation(conversationId, {
      phase:        'planning',
      intentResult: result.intentResult,
      currentGoal:  result.intentResult.rawGoal ?? message,
      rankedPlans:  result.plans,
    })

    console.info('[copilot] plans ready', {
      conversationId,
      plansGenerated: result.plans.length,
      canonicalGoal:  result.intentResult.canonicalGoal,
    })

    return {
      conversationId,
      phase:        'planning',
      message:      buildPlanningMessage(result.plans, result.intentResult.rawGoal ?? message),
      context:      result.context,
      suggestions:  [],
      plans:        result.plans,
      selectedPlan: null,
      workflowId:   null,
      objectiveId:  null,
      question:     null,
      actions:      buildPlanActions(result.plans),
      responseMs:   Date.now() - startMs,
    }

  } catch (err) {
    console.error('[copilot] orchestration error', err)
    const context = await getBusinessContext(workspaceId).catch(() => emptyContext(workspaceId))
    return errorResponse(conversationId, context, 'unknown', Date.now() - startMs)
  }
}

function errorResponse(
  conversationId: string,
  context: BusinessContext,
  reason: 'no_goal' | 'no_plans' | 'unknown',
  responseMs: number,
): CopilotResponse {
  return {
    conversationId,
    phase:        'greeting',
    message:      buildErrorMessage(reason),
    context,
    suggestions:  getFallbackSuggestions(context.sector),
    plans:        [],
    selectedPlan: null,
    workflowId:   null,
    objectiveId:  null,
    question:     null,
    actions:      buildRestartActions(),
    responseMs,
  }
}

function emptyContext(workspaceId: string): BusinessContext {
  return {
    workspaceId,
    companyName:      null,
    sector:           null,
    country:          null,
    website:          null,
    size:             'unknown',
    languages:        [],
    services:         [],
    products:         [],
    markets:          [],
    competitors:      [],
    regulations:      [],
    certifications:   [],
    softwareUsed:     [],
    digitalMaturity:  'emerging',
    departments:      [],
    activeObjectives: [],
    openRisks:        [],
    knownProcesses:   [],
    keyAssets:        [],
    confidence:       0,
    lastUpdated:      null,
    isEmpty:          true,
  }
}
