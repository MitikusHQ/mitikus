// Public API — Intent Engine
export {
  analyzeIntent,
  validateIntentResult,
  normalizeIntentData,
  resolveBusinessGoal,
  extractRelevantEntities,
  extractActiveConstraints,
  serializeIntentForPlanner,
} from './service'

export {
  normalizeIntent,
  resolveToolsForGoal,
  enrichMissingInfo,
} from './normalizer'

export {
  validateIntent,
  sanitizeParsedIntent,
} from './validator'

export {
  GOAL_CATALOG,
  getAllCatalogTools,
  getGoalsByDomain,
} from './goals'

export {
  PROMPT_VERSION,
  INTENT_MODEL_CONFIG,
} from './prompts'

export type {
  CanonicalGoal,
  IntentDomain,
  IntentEntity,
  IntentConstraint,
  ParsedIntent,
  NormalizedIntent,
  IntentResult,
  IntentAnalysisRecord,
  IntentValidationResult,
  CanonicalGoalDefinition,
} from './types'

export {
  CANONICAL_GOALS,
  INTENT_DOMAIN_LABELS,
} from './types'
