/**
 * Business Memory Engine — public API
 *
 * Uso:
 *   import { getBusinessContext, updateMemoryFromExecution } from '@/lib/business-memory'
 */

export * from './memory-service'

export type {
  BusinessContext,
  CompanyProfileData,
  CompanyObjectiveData,
  CompanyAssetData,
  CompanyProcessData,
  CompanyRiskData,
  MemorySummary,
  MemoryUpdateEvent,
  CompanyProfileUpdate,
  CompanySize,
  DigitalMaturity,
  ObjectiveStatus,
  ObjectivePriority,
  AssetType,
  ProcessDomain,
  ProcessMaturity,
  RiskLevel,
  RiskStatus,
  RiskSource,
  MemorySource,
} from './memory-types'

export {
  COMPANY_SIZE_LABELS,
  DIGITAL_MATURITY_LABELS,
  OBJECTIVE_STATUS_LABELS,
  OBJECTIVE_PRIORITY_LABELS,
  ASSET_TYPE_LABELS,
  RISK_LEVEL_LABELS,
} from './memory-types'
