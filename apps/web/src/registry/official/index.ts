import type { OfficialToolDefinition } from './_types'

// Audit
import { iso9001Audit } from './audit/iso9001-audit'
import { iso27001Audit } from './audit/iso27001-audit'
import { itAudit } from './audit/it-audit'
import { seoAudit } from './audit/seo-audit'
import { commercialAudit } from './audit/commercial-audit'
import { gdprAudit } from './audit/gdpr-audit'

// HR
import { employeeOnboarding } from './hr/employee-onboarding'
import { employeeOffboarding } from './hr/employee-offboarding'
import { annualReview } from './hr/annual-review'
import { objectivesTracking } from './hr/objectives-tracking'
import { jobInterview } from './hr/job-interview'
import { performanceReview } from './hr/performance-review'

// Quality
import { nonConformity } from './quality/non-conformity'
import { correctiveAction } from './quality/corrective-action'
import { preventiveAction } from './quality/preventive-action'
import { productionChecklist } from './quality/production-checklist'
import { qualityInspection } from './quality/quality-inspection'

// Purchasing
import { supplierEvaluation } from './purchasing/supplier-evaluation'
import { supplierHomologation } from './purchasing/supplier-homologation'
import { goodsReception } from './purchasing/goods-reception'
import { offerComparison } from './purchasing/offer-comparison'

// Sales
import { crmLeads } from './sales/crm-leads'
import { opportunityTracking } from './sales/opportunity-tracking'
import { commercialVisit } from './sales/commercial-visit'
import { discoverySession } from './sales/discovery-session'
import { salesPipeline } from './sales/sales-pipeline'
import { salesForecast } from './sales/sales-forecast'

// Marketing
import { editorialPlan } from './marketing/editorial-plan'
import { campaignBrief } from './marketing/campaign-brief'
import { socialMediaAudit } from './marketing/social-media-audit'
import { seoChecklist } from './marketing/seo-checklist'
import { campaignEvaluation } from './marketing/campaign-evaluation'

// Consulting
import { swotAnalysis } from './consulting/swot-analysis'
import { digitalMaturity } from './consulting/digital-maturity'
import { companyDiagnosis } from './consulting/company-diagnosis'
import { processMap } from './consulting/process-map'
import { strategicPlan } from './consulting/strategic-plan'

// Security
import { prlChecklist } from './security/prl-checklist'
import { incidentReport } from './security/incident-report'
import { evacuationChecklist } from './security/evacuation-checklist'
import { epiInspection } from './security/epi-inspection'

// IT
import { hardwareInventory } from './it/hardware-inventory'
import { softwareInventory } from './it/software-inventory'
import { itIncidents } from './it/it-incidents'
import { deploymentChecklist } from './it/deployment-checklist'
import { backupVerification } from './it/backup-verification'
import { accessControl } from './it/access-control'

// Administration
import { expenseControl } from './administration/expense-control'
import { assetInventory } from './administration/asset-inventory'
import { contractReview } from './administration/contract-review'
import { licenseControl } from './administration/license-control'

export const allOfficialTools: OfficialToolDefinition[] = [
  // Audit (1-6)
  iso9001Audit,
  iso27001Audit,
  itAudit,
  seoAudit,
  commercialAudit,
  gdprAudit,

  // HR (7-12)
  employeeOnboarding,
  employeeOffboarding,
  annualReview,
  objectivesTracking,
  jobInterview,
  performanceReview,

  // Quality (13-17)
  nonConformity,
  correctiveAction,
  preventiveAction,
  productionChecklist,
  qualityInspection,

  // Purchasing (18-21)
  supplierEvaluation,
  supplierHomologation,
  goodsReception,
  offerComparison,

  // Sales (22-27)
  crmLeads,
  opportunityTracking,
  commercialVisit,
  discoverySession,
  salesPipeline,
  salesForecast,

  // Marketing (28-32)
  editorialPlan,
  campaignBrief,
  socialMediaAudit,
  seoChecklist,
  campaignEvaluation,

  // Consulting (33-37)
  swotAnalysis,
  digitalMaturity,
  companyDiagnosis,
  processMap,
  strategicPlan,

  // Security (38-41)
  prlChecklist,
  incidentReport,
  evacuationChecklist,
  epiInspection,

  // IT (42-47)
  hardwareInventory,
  softwareInventory,
  itIncidents,
  deploymentChecklist,
  backupVerification,
  accessControl,

  // Administration (48-51)
  expenseControl,
  assetInventory,
  contractReview,
  licenseControl,
]

export type { OfficialToolDefinition } from './_types'
export { oid } from './_helpers'
