// Business Copilot — barrel de exportaciones públicas

export {
  startCopilot,
  sendMessage,
  selectPlan,
  getCopilotSuggestions,
} from './copilot-service'

export type {
  CopilotPhase,
  CopilotSuggestion,
  SuggestionCategory,
  PlanSummary,
  ConversationState,
  CopilotStartRequest,
  CopilotMessageRequest,
  SelectPlanRequest,
  CopilotResponse,
  CopilotAction,
  CopilotRecord,
} from './copilot-types'
