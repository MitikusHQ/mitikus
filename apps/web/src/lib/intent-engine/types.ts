/**
 * Intent Engine — sistema de tipos.
 *
 * El Intent Engine transforma lenguaje natural → IntentResult estructurado.
 * No genera workflows ni ejecuta herramientas. Solo comprende.
 *
 * Flujo:
 *   input (string) → ParsedIntent (Claude) → NormalizedIntent → IntentResult
 */

// ── Canonical Goals ────────────────────────────────────────────────
// Identificadores estables de objetivos empresariales.
// No cambian aunque cambien los slugs de las herramientas.

export const CANONICAL_GOALS = [
  // Strategy
  'strategic_planning',
  'business_diagnosis',
  'digital_transformation',
  'process_improvement',
  // Marketing
  'seo_optimization',
  'content_marketing',
  'campaign_management',
  'social_media_analysis',
  // Sales
  'crm_lead_management',
  'sales_pipeline_management',
  'sales_forecasting',
  'commercial_visit_tracking',
  'sales_diagnosis',
  // HR
  'employee_onboarding',
  'employee_offboarding',
  'performance_evaluation',
  'okr_management',
  'talent_acquisition',
  // Quality
  'quality_management',
  'corrective_actions',
  'preventive_actions',
  'production_quality_control',
  // Compliance / Legal
  'iso9001_certification',
  'iso27001_certification',
  'gdpr_compliance',
  'legal_compliance',
  // Procurement
  'supplier_management',
  'procurement_optimization',
  // IT
  'it_audit',
  'it_infrastructure_management',
  'it_security_management',
  // Finance & Admin
  'financial_control',
  'asset_management',
] as const

export type CanonicalGoal = (typeof CANONICAL_GOALS)[number]

// ── Intent Domain ─────────────────────────────────────────────────
// Alias de BusinessDomain — mantiene coherencia con el Capability Graph.

export type IntentDomain =
  | 'strategy'
  | 'hr'
  | 'finance'
  | 'it'
  | 'marketing'
  | 'quality'
  | 'operations'
  | 'legal'
  | 'sales'
  | 'admin'
  | 'procurement'

export const INTENT_DOMAIN_LABELS: Record<IntentDomain, string> = {
  strategy:    'Estrategia',
  hr:          'Recursos Humanos',
  finance:     'Finanzas',
  it:          'Tecnología',
  marketing:   'Marketing',
  quality:     'Calidad',
  operations:  'Operaciones',
  legal:       'Legal',
  sales:       'Ventas',
  admin:       'Administración',
  procurement: 'Compras',
}

// ── Intent Entities ────────────────────────────────────────────────
// Entidades extraídas del input del usuario.

export interface IntentEntity {
  company_name: string | null
  website:      string | null
  product:      string | null
  market:       string | null
  sector:       string | null
  regulation:   string | null
  competitors:  string[]
  brand:        string | null
  country:      string | null
}

// ── Intent Constraints ─────────────────────────────────────────────
// Restricciones y preferencias detectadas en el input.

export interface IntentConstraint {
  budget:          'low' | 'medium' | 'high' | null
  quality:         'draft' | 'standard' | 'professional' | null
  speed:           'fast' | 'standard' | 'thorough' | null
  depth:           'superficial' | 'standard' | 'deep' | null
  language:        string | null    // ISO 639-1: 'es', 'en', 'fr'...
  preferredModel:  string | null
}

// ── Parsed Intent ─────────────────────────────────────────────────
// Salida raw de Claude, validada por IntentValidator.

export interface ParsedIntent {
  rawGoal:                    string           // descripción 5-10 palabras
  domain:                     IntentDomain
  confidence:                 number           // 0.0 – 1.0
  language:                   string           // idioma detectado
  entities:                   IntentEntity
  constraints:                IntentConstraint
  missingInformation:         string[]         // preguntas/campos pendientes
  alternativeInterpretations: string[]         // lecturas alternativas si ambiguo
}

// ── Normalized Intent ──────────────────────────────────────────────
// ParsedIntent enriquecido con el mapeado al Capability Graph.

export interface NormalizedIntent extends ParsedIntent {
  canonicalGoal: CanonicalGoal | null
  primaryTool:   string | null              // slug de la herramienta más relevante
  relatedGoals:  CanonicalGoal[]
}

// ── Intent Result ─────────────────────────────────────────────────
// Salida pública del Intent Engine.

export interface IntentResult {
  requestId:                  string
  input:                      string          // input original (truncado a 500 chars)
  canonicalGoal:              CanonicalGoal | null
  rawGoal:                    string
  domain:                     IntentDomain
  confidence:                 number
  language:                   string
  entities:                   IntentEntity
  constraints:                IntentConstraint
  missingInformation:         string[]
  suggestedTools:             string[]        // slugs desde el Capability Graph
  relatedGoals:               CanonicalGoal[]
  alternativeInterpretations: string[]
  analysisMs:                 number
  modelUsed:                  string
}

// ── Observability Record ──────────────────────────────────────────
// Registro para analytics y monitorización futura.

export interface IntentAnalysisRecord {
  requestId:          string
  inputLength:        number
  analysisMs:         number
  canonicalGoal:      CanonicalGoal | null
  domain:             IntentDomain
  confidence:         number
  entitiesExtracted:  number
  constraintsFound:   number
  missingCount:       number
  suggestedToolCount: number
  modelUsed:          string
  inputTokens:        number
  outputTokens:       number
  timestamp:          string           // ISO 8601
}

// ── Validation Result ─────────────────────────────────────────────

export interface IntentValidationResult {
  valid:    boolean
  errors:   string[]
  warnings: string[]
}

// ── Goal Catalog Entry ────────────────────────────────────────────
// Metadatos de cada objetivo canónico para normalización y resolución.

export interface CanonicalGoalDefinition {
  goal:             CanonicalGoal
  domain:           IntentDomain
  labelEs:          string
  keywords:         string[]           // términos en español que apuntan a este objetivo
  primaryTools:     string[]           // slugs de herramientas (por relevancia)
  requiredEntities: (keyof IntentEntity)[]   // entidades necesarias para este objetivo
}
