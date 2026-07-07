/**
 * Planning Engine — public API
 *
 * Uso:
 *   import { buildExecutionPlans, generateWorkflowFromPlan } from '@/lib/planning-engine'
 */

// Service (main entrypoint)
export {
  buildExecutionPlans,
  rankPlansPublic,
  generateWorkflowFromPlan,
  estimateExecution,
  validatePlanPublic,
  serializePlanForLLM,
} from './planner-service'

// Types
export type {
  ExecutionPlan,
  PlanPhase,
  PlanStep,
  PlanScore,
  PlanRisk,
  PlanReasoning,
  PlanStrategyType,
  RankedPlanResult,
  GeneratedWorkflow,
  GeneratedWorkflowNode,
  GeneratedWorkflowConnection,
  PlanningRecord,
  ToolHistoryScore,
  RiskLevel,
} from './planner-types'

// Constants
export {
  PLAN_STRATEGY_LABELS,
  PLAN_STRATEGY_ICONS,
  RISK_LEVEL_LABELS,
} from './planner-types'
