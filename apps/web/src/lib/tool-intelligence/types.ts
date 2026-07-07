/**
 * Tool Intelligence — tipos del sistema de capacidades de herramientas.
 *
 * Esta capa es independiente de la capa de presentación (ToolRegistryMeta)
 * y de la capa de ejecución (ExecutionEngine). Su propósito es codificar
 * el CONOCIMIENTO que el sistema tiene sobre cada herramienta.
 */

// ── Business Domains ─────────────────────────────────────────────

export const BUSINESS_DOMAINS = [
  'strategy',
  'hr',
  'finance',
  'it',
  'marketing',
  'quality',
  'operations',
  'legal',
  'sales',
  'admin',
  'procurement',
] as const

export type BusinessDomain = (typeof BUSINESS_DOMAINS)[number]

export const BUSINESS_DOMAIN_LABELS: Record<BusinessDomain, string> = {
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

// ── IO Types — the "data currency" flowing between tools ─────────

export const IO_TYPES = [
  'text_brief',           // texto libre / brief de entrada
  'structured_data',      // datos de formulario / tabla
  'analysis_result',      // resultado de análisis (SWOT, diagnóstico, etc.)
  'audit_report',         // informe de auditoría
  'compliance_report',    // informe de cumplimiento normativo
  'strategy_document',    // plan estratégico / documento de estrategia
  'financial_data',       // datos financieros / presupuestos
  'employee_data',        // datos de empleados / RRHH
  'supplier_data',        // datos de proveedor
  'market_data',          // análisis de mercado
  'campaign_data',        // datos de campaña de marketing
  'seo_data',             // métricas SEO / keywords
  'it_asset_list',        // inventario hardware/software
  'risk_matrix',          // matriz de riesgos evaluados
  'checklist_result',     // resultado de checklist completado
  'evaluation_scorecard', // scorecard de evaluación con puntuaciones
  'action_plan',          // plan de acción con tareas concretas
  'crm_record',           // datos de cliente / lead
  'hr_process_result',    // resultado de proceso RRHH (onboarding, entrevista, etc.)
  'quality_record',       // registro de calidad (no conformidad, acción, etc.)
  'process_map',          // mapa de procesos empresariales
  'it_report',            // informe IT / incidente técnico / verificación de sistemas
] as const

export type IOType = (typeof IO_TYPES)[number]

export const IO_TYPE_LABELS: Record<IOType, string> = {
  text_brief:           'Brief de texto',
  structured_data:      'Datos estructurados',
  analysis_result:      'Resultado de análisis',
  audit_report:         'Informe de auditoría',
  compliance_report:    'Informe de cumplimiento',
  strategy_document:    'Documento estratégico',
  financial_data:       'Datos financieros',
  employee_data:        'Datos de empleado',
  supplier_data:        'Datos de proveedor',
  market_data:          'Datos de mercado',
  campaign_data:        'Datos de campaña',
  seo_data:             'Datos SEO',
  it_asset_list:        'Inventario IT',
  risk_matrix:          'Matriz de riesgos',
  checklist_result:     'Resultado de checklist',
  evaluation_scorecard: 'Scorecard de evaluación',
  action_plan:          'Plan de acción',
  crm_record:           'Registro CRM',
  hr_process_result:    'Resultado de proceso RRHH',
  quality_record:       'Registro de calidad',
  process_map:          'Mapa de procesos',
  it_report:            'Informe IT',
}

// ── Quality Levels ────────────────────────────────────────────────

export const QUALITY_LEVELS = ['draft', 'standard', 'professional'] as const
export type QualityLevel = (typeof QUALITY_LEVELS)[number]

export const QUALITY_LEVEL_LABELS: Record<QualityLevel, string> = {
  draft:        'Borrador',
  standard:     'Estándar',
  professional: 'Profesional',
}

export const QUALITY_LEVEL_COLORS: Record<QualityLevel, string> = {
  draft:        'text-muted-foreground',
  standard:     'text-blue-600 dark:text-blue-400',
  professional: 'text-violet-600 dark:text-violet-400',
}

// ── Capability Profile ────────────────────────────────────────────

/**
 * Perfil de capacidades de una herramienta.
 * Es la representación en memoria del modelo ToolCapabilityProfile de la DB.
 * Todas las propiedades son opcionales en runtime para soportar herramientas sin perfil.
 */
export interface CapabilityProfile {
  businessDomain:    BusinessDomain
  businessGoals:     string[]
  useCases:          string[]
  inputTypes:        IOType[]
  outputTypes:       IOType[]
  expectedOutput:    string
  requiredVariables: string[]
  optionalVariables: string[]
  recommendedModels: string[]
  supportedProviders: string[]
  executionCostEUR:  number
  qualityLevel:      QualityLevel
  automationFriendly: boolean
  dependencies:      string[]    // tool slugs — ejecutar ANTES de esta herramienta
  relatedTools:      string[]    // tool slugs — usadas frecuentemente juntas
  alternativeTools:  string[]    // tool slugs — mismo propósito, alternativa
}

// ── Full Tool Profile — resultado enriquecido de la BD ───────────

export interface ToolFullProfile {
  id:          string
  slug:        string
  name:        string
  description: string
  category:    string
  source:      string
  // RegistryMeta (presentación)
  icon:             string | null
  color:            string | null
  displayCategory:  string | null
  complexity:       string | null
  estimatedMinutes: number | null
  tags:             string[]
  keywords:         string[]
  tier:             string | null
  // CapabilityProfile (inteligencia)
  profile: CapabilityProfile | null
}

// ── Compatibility ─────────────────────────────────────────────────

export interface CompatibilityScore {
  score:        number          // 0-100
  level:        'none' | 'low' | 'medium' | 'high' | 'excellent'
  reasons:      string[]        // factores positivos
  blockers:     string[]        // factores negativos
  dataFlowMatch: boolean        // ¿outputTypes[A] ∩ inputTypes[B] ≠ ∅?
  isDeclared:   boolean         // ¿la relación está declarada explícitamente?
}

// ── Tool Graph Node ───────────────────────────────────────────────

export interface ToolGraphNode {
  slug:         string
  name:         string
  domain:       BusinessDomain
  outputTypes:  IOType[]
  inputTypes:   IOType[]
  successors:   string[]    // slugs that can follow (consume this tool's output)
  predecessors: string[]    // slugs that should run before (feed this tool)
  alternatives: string[]
}

// ── Recommendation ────────────────────────────────────────────────

export type RecommendationType =
  | 'next_step'        // "Los usuarios suelen ejecutar después..."
  | 'related'          // "Herramienta relacionada"
  | 'faster'           // "Alternativa más rápida"
  | 'cheaper'          // "Alternativa más económica"
  | 'more_precise'     // "Alternativa más precisa"
  | 'prerequisite'     // "Ejecutar antes de esta herramienta"

export interface ToolRecommendation {
  slug:        string
  name:        string
  description: string
  type:        RecommendationType
  reason:      string
  score:       number   // relevance 0-100
}

// ── Search ───────────────────────────────────────────────────────

export interface IntelligenceSearchHit {
  toolDefinitionId: string
  slug:             string
  name:             string
  description:      string
  domain:           BusinessDomain | null
  matchType:        'goal' | 'capability' | 'input' | 'output' | 'text'
  matchedTerms:     string[]
  score:            number
}
