/**
 * Planning Engine — sistema de tipos.
 *
 * Flujo:
 *   IntentResult → [PlanBuilder] → ExecutionPlan[] → [PlanRanker] → RankedPlanResult
 *                                                 ↓
 *                                      [WorkflowGenerator] → GeneratedWorkflow
 */

import type { CanonicalGoal, IntentDomain, IntentConstraint } from '@/lib/intent-engine/types'
import type { QualityLevel, IOType } from '@/lib/tool-intelligence/types'

// ── Strategy Types ────────────────────────────────────────────────

export type PlanStrategyType = 'complete' | 'fast' | 'economic'

export const PLAN_STRATEGY_LABELS: Record<PlanStrategyType, string> = {
  complete: 'Plan Completo',
  fast:     'Plan Rápido',
  economic: 'Plan Económico',
}

export const PLAN_STRATEGY_ICONS: Record<PlanStrategyType, string> = {
  complete: '⭐',
  fast:     '⚡',
  economic: '💰',
}

// ── Risk ─────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high'

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low:    'Bajo',
  medium: 'Medio',
  high:   'Alto',
}

export interface PlanRisk {
  level:   RiskLevel
  factors: string[]   // motivos del nivel de riesgo (explicabilidad)
}

// ── Step & Phase ──────────────────────────────────────────────────

export interface PlanStep {
  id:               string          // stepId único dentro del plan
  toolSlug:         string
  toolName:         string
  order:            number          // posición en el flujo (1-based)
  rationale:        string          // POR QUÉ se eligió esta herramienta
  estimatedMinutes: number          // tiempo estimado de ejecución
  estimatedCostEUR: number          // coste estimado una ejecución
  qualityLevel:     QualityLevel
  isOptional:       boolean
  canAutomate:      boolean         // automationFriendly del perfil
  inputTypes:       IOType[]
  outputTypes:      IOType[]
  dependencies:     string[]        // stepIds que deben completarse antes
  provider:         string          // proveedor recomendado para este step
  model:            string          // modelo recomendado para este step
}

export interface PlanPhase {
  id:          string
  order:       number
  label:       string         // "Fase 1 — Diagnóstico"
  description: string
  steps:       PlanStep[]
  canParallel: boolean        // ¿pueden ejecutarse los steps en paralelo?
}

// ── Score ─────────────────────────────────────────────────────────

export interface PlanScore {
  total:         number   // 0-100, score final ponderado
  compatibility: number   // 0-100, compatibilidad entre herramientas consecutivas
  coverage:      number   // 0-100, cobertura de los requisitos del objetivo
  quality:       number   // 0-100, nivel de calidad medio de las herramientas
  speed:         number   // 0-100, inverso del tiempo (más rápido = mayor score)
  cost:          number   // 0-100, inverso del coste (más barato = mayor score)
  risk:          number   // 0-100, inverso del riesgo (menor riesgo = mayor score)
  history:       number   // 0-100, puntuación histórica (0.5 si sin datos)
}

// ── Reasoning (Explicabilidad) ─────────────────────────────────────

export interface PlanReasoning {
  goalMapping:    string     // "iso9001_certification → dominio: quality"
  toolSelection:  string[]   // motivo por cada herramienta incluida
  toolsDiscarded: string[]   // herramientas consideradas y descartadas
  strategyChoice: string     // por qué esta estrategia (complete/fast/economic)
  dataFlow:       string[]   // flujo de datos entre herramientas (A produce X → B consume X)
}

// ── Execution Plan ────────────────────────────────────────────────

export interface ExecutionPlan {
  id:                  string
  canonicalGoal:       CanonicalGoal | null
  rawGoal:             string
  domain:              IntentDomain
  strategyType:        PlanStrategyType
  label:               string              // "Plan Completo"
  description:         string
  phases:              PlanPhase[]
  totalSteps:          number
  totalTools:          number              // herramientas únicas
  estimatedDays:       number              // ceil(totalMinutes / 480)
  estimatedMinutes:    number
  estimatedCostEUR:    number
  recommendedProvider: string
  recommendedModel:    string
  score:               PlanScore
  risk:                PlanRisk
  constraints:         IntentConstraint
  missingRequirements: string[]            // info faltante para ejecutar
  reasoning:           PlanReasoning
  isRecommended:       boolean             // true solo en el plan ganador
  generatedAt:         string             // ISO 8601
}

// ── Ranked Result ─────────────────────────────────────────────────

export interface RankedPlanResult {
  requestId:     string
  intentInput:   string          // input original del usuario
  canonicalGoal: CanonicalGoal | null
  domain:        IntentDomain
  plans:         ExecutionPlan[] // ordenados por score desc
  best:          ExecutionPlan   // el plan con mayor score
  planningMs:    number          // tiempo de planificación
}

// ── Generated Workflow ────────────────────────────────────────────
// Estructura directamente compatible con Prisma WorkflowNode + WorkflowConnection

export interface GeneratedWorkflowNode {
  label:          string
  toolDefinitionId: string       // se resolverá a ID en DB
  toolSlug:       string         // para lookup en DB
  positionX:      number
  positionY:      number
  executionOrder: number
  inputMapping:   Record<string, string>
}

export interface GeneratedWorkflowConnection {
  sourceIndex: number   // índice del nodo origen en nodes[]
  targetIndex: number   // índice del nodo destino en nodes[]
}

export interface GeneratedWorkflow {
  name:        string
  description: string
  nodes:       GeneratedWorkflowNode[]
  connections: GeneratedWorkflowConnection[]
  totalNodes:  number
}

// ── Observability ─────────────────────────────────────────────────

export interface PlanningRecord {
  requestId:     string
  intentGoal:    CanonicalGoal | null
  domain:        IntentDomain
  plansGenerated: number
  bestStrategy:  PlanStrategyType
  bestScore:     number
  bestRisk:      RiskLevel
  toolsInBest:   number
  estimatedDays: number
  planningMs:    number
  timestamp:     string
}

// ── Analytics Tool History ────────────────────────────────────────
// Resultado de consultar ToolExecution en DB para penalizar herramientas con mal historial

export interface ToolHistoryScore {
  toolSlug:    string
  score:       number    // 0.0 – 1.0 (1.0 = perfecto historial)
  executions:  number    // total ejecuciones encontradas
  successRate: number    // 0.0 – 1.0
  avgDurationMs: number
}
