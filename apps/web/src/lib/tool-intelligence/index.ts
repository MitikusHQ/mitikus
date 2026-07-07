// Public API — Tool Intelligence Service
export {
  getToolCapabilities,
  calculateWorkflowCompatibility,
  findCompatibleTools,
  suggestNextTools,
  getToolPrerequisites,
  findAlternatives,
  searchByBusinessGoal,
  searchByInput,
  searchByOutput,
  searchByDomain,
  buildToolGraph,
  serializeProfileForLLM,
} from './service'

export { calculateCompatibility } from './compatibility'

export {
  getNextSteps,
  getAlternatives as getAlternativesList,
  getPrerequisites,
} from './recommendations'

export type {
  BusinessDomain,
  IOType,
  QualityLevel,
  CapabilityProfile,
  ToolFullProfile,
  CompatibilityScore,
  ToolRecommendation,
  RecommendationType,
  IntelligenceSearchHit,
  ToolGraphNode,
} from './types'

export {
  BUSINESS_DOMAINS,
  BUSINESS_DOMAIN_LABELS,
  IO_TYPES,
  IO_TYPE_LABELS,
  QUALITY_LEVELS,
  QUALITY_LEVEL_LABELS,
  QUALITY_LEVEL_COLORS,
} from './types'
