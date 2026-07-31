/**
 * Business Copilot — tipos del sistema.
 *
 * El Copilot es una máquina de estados ligera que orquesta:
 *   BusinessMemory → IntentEngine → PlanningEngine → WorkflowGenerator
 *
 * No contiene reglas de negocio. No conoce herramientas directamente.
 */

import type { IntentResult } from '@/lib/intent-engine/types'
import type { ExecutionPlan } from '@/lib/planning-engine/planner-types'
import type { BusinessContext } from '@/lib/business-memory/memory-types'

// ── Phases ───────────────────────────────────────────────────────

export type CopilotPhase =
  | 'greeting'        // Muestra contexto empresa + sugerencias
  | 'understanding'   // Procesando el objetivo del usuario
  | 'clarifying'      // Hace exactamente 1 pregunta
  | 'planning'        // Muestra los planes generados
  | 'workflow_ready'  // Plan seleccionado, workflow listo
  | 'done'            // Conversación cerrada

// ── Suggestion ───────────────────────────────────────────────────

export type SuggestionCategory =
  | 'objective'     // continúa un objetivo activo
  | 'risk'          // mitiga un riesgo detectado
  | 'process'       // mejora un proceso conocido
  | 'domain'        // cubre un dominio sin explorar
  | 'analytics'     // acción sugerida por historial
  | 'fiscal'        // obligación fiscal próxima

export interface CopilotSuggestion {
  id:          string
  category:    SuggestionCategory
  label:       string         // "Preparar campaña de marketing"
  description: string         // "Tu empresa no ha ejecutado herramientas de marketing este trimestre"
  canonicalGoal: string | null
  icon:        string         // emoji
}

// ── Plan Summary ─────────────────────────────────────────────────
// Versión ligera de ExecutionPlan para almacenar en JSON de la conversación

export interface PlanSummary {
  id:            string
  strategyType:  'complete' | 'fast' | 'economic'
  label:         string
  description:   string
  totalTools:    number
  estimatedDays: number
  score:         number         // 0-100
  riskLevel:     string
  isRecommended: boolean
  toolSlugs:     string[]       // solo los slugs, sin steps detallados
  reasoning:     string         // reasoning.strategyChoice
}

// ── Conversation State ────────────────────────────────────────────

export interface ConversationState {
  id:          string
  workspaceId: string
  userId:      string
  phase:       CopilotPhase

  rawInput:    string | null
  currentGoal: string | null

  intentResult:  IntentResult | null
  rankedPlans:   PlanSummary[]
  selectedPlan:  ExecutionPlan | null   // el plan completo cuando el usuario elige

  clarifyingQuestion: string | null
  collectedAnswers:   Record<string, string>

  generatedWorkflowId: string | null

  turnCount: number
  startedAt: string
  updatedAt: string
}

// ── Copilot Request / Response ────────────────────────────────────

export interface CopilotStartRequest {
  workspaceId: string
}

export interface CopilotMessageRequest {
  conversationId: string
  workspaceId:    string
  message:        string          // lo que escribe el usuario
}

export interface SelectPlanRequest {
  conversationId: string
  workspaceId:    string
  planId:         string
}

export interface CopilotResponse {
  conversationId:  string
  phase:           CopilotPhase
  message:         string          // respuesta en lenguaje natural
  context:         BusinessContext  // siempre incluido (puede estar isEmpty)
  suggestions:     CopilotSuggestion[]  // solo en greeting / done
  plans:           PlanSummary[]        // en planning
  selectedPlan:    ExecutionPlan | null  // en workflow_ready
  workflowId:      string | null        // en workflow_ready
  objectiveId:     string | null        // en workflow_ready — ID real de la Misión creada
  question:        string | null        // en clarifying
  actions:         CopilotAction[]      // botones de acción sugeridos
  responseMs:      number
}

export interface CopilotAction {
  id:     string
  label:  string
  type:   'select_plan' | 'generate_workflow' | 'save_objective' | 'more_info' | 'restart'
  data?:  Record<string, string>
}

// ── Observability ─────────────────────────────────────────────────

export interface CopilotRecord {
  conversationId: string
  workspaceId:    string
  phase:          CopilotPhase
  turnCount:      number
  canonicalGoal:  string | null
  plansGenerated: number
  workflowId:     string | null
  responseMs:     number
}
