/**
 * Business Memory Engine — sistema de tipos.
 *
 * Todos los tipos son independientes de Prisma para que puedan
 * ser consumidos por Intent Engine, Planning Engine y Execution Engine
 * sin acoplarlos a la capa de persistencia.
 */

// ── Company Size ───────────────────────────────────────────────────

export type CompanySize =
  | 'micro'       // 1-9 empleados
  | 'small'       // 10-49
  | 'medium'      // 50-249
  | 'large'       // 250-999
  | 'enterprise'  // 1000+
  | 'unknown'

export const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
  micro:      'Microempresa (1-9)',
  small:      'Pequeña (10-49)',
  medium:     'Mediana (50-249)',
  large:      'Grande (250-999)',
  enterprise: 'Corporación (1000+)',
  unknown:    'Sin determinar',
}

// ── Digital Maturity ──────────────────────────────────────────────

export type DigitalMaturity = 'emerging' | 'developing' | 'advanced' | 'leading'

export const DIGITAL_MATURITY_LABELS: Record<DigitalMaturity, string> = {
  emerging:   'Emergente',
  developing: 'En desarrollo',
  advanced:   'Avanzada',
  leading:    'Referente digital',
}

// ── Objective Status & Priority ───────────────────────────────────

export type ObjectiveStatus   = 'active' | 'completed' | 'paused' | 'cancelled'
export type ObjectivePriority = 'low' | 'medium' | 'high' | 'critical'

export const OBJECTIVE_STATUS_LABELS: Record<ObjectiveStatus, string> = {
  active:    'Activo',
  completed: 'Completado',
  paused:    'En pausa',
  cancelled: 'Cancelado',
}

export const OBJECTIVE_PRIORITY_LABELS: Record<ObjectivePriority, string> = {
  low:      'Baja',
  medium:   'Media',
  high:     'Alta',
  critical: 'Crítica',
}

// ── Asset Type ────────────────────────────────────────────────────

export type AssetType =
  | 'web'
  | 'erp'
  | 'crm'
  | 'software'
  | 'document'
  | 'equipment'
  | 'integration'
  | 'other'

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  web:         'Sitio web',
  erp:         'ERP',
  crm:         'CRM',
  software:    'Software',
  document:    'Documentación',
  equipment:   'Equipamiento',
  integration: 'Integración',
  other:       'Otro',
}

// ── Process Domain & Maturity ─────────────────────────────────────

export type ProcessDomain =
  | 'sales'
  | 'marketing'
  | 'quality'
  | 'operations'
  | 'hr'
  | 'finance'
  | 'legal'
  | 'procurement'
  | 'it'
  | 'admin'

export type ProcessMaturity = 'informal' | 'documented' | 'optimized' | 'automated'

// ── Risk Level & Status ───────────────────────────────────────────

export type RiskLevel  = 'low' | 'medium' | 'high' | 'critical'
export type RiskStatus = 'open' | 'mitigated' | 'resolved' | 'accepted'
export type RiskSource = 'manual' | 'tool_execution' | 'workflow' | 'system'

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low:      'Bajo',
  medium:   'Medio',
  high:     'Alto',
  critical: 'Crítico',
}

// ── Memory Source ─────────────────────────────────────────────────

export type MemorySource = 'tool_execution' | 'workflow' | 'user' | 'intent' | 'system'

// ── Domain Data Objects (sin dependencia de Prisma) ───────────────

export interface CompanyProfileData {
  id:             string
  workspaceId:    string
  companyName:    string | null
  sector:         string | null
  subsector:      string | null
  country:        string | null
  city:           string | null
  website:        string | null
  foundedYear:    number | null
  size:           CompanySize
  languages:      string[]
  markets:        string[]
  services:       string[]
  products:       string[]
  customers:      string[]
  competitors:    string[]
  regulations:    string[]
  certifications: string[]
  softwareUsed:   string[]
  integrations:   string[]
  digitalMaturity: DigitalMaturity
  departments:    string[]
  confidence:     number   // 0.0-1.0
  lastUpdatedBy:  string | null
  lastUpdatedAt:  string   // ISO 8601
}

export interface CompanyObjectiveData {
  id:              string
  workspaceId:     string
  canonicalGoal:   string | null
  label:           string
  description:     string | null
  status:          ObjectiveStatus
  priority:        ObjectivePriority
  progress:        number   // 0-100
  dueDate:         string | null
  completedAt:     string | null
  linkedWorkflowId: string | null
  // WM-001 Sprint 0
  clientId:        string | null
  clientName:      string | null
}

export interface CompanyAssetData {
  id:          string
  workspaceId: string
  type:        AssetType
  name:        string
  description: string | null
  url:         string | null
  vendor:      string | null
  status:      'active' | 'inactive' | 'planned'
}

export interface CompanyProcessData {
  id:           string
  workspaceId:  string
  domain:       ProcessDomain
  name:         string
  description:  string | null
  isDocumented: boolean
  maturity:     ProcessMaturity
  toolSlugs:    string[]
}

export interface CompanyRiskData {
  id:          string
  workspaceId: string
  domain:      string
  level:       RiskLevel
  title:       string
  description: string | null
  status:      RiskStatus
  source:      RiskSource
  detectedAt:  string
  resolvedAt:  string | null
}

// ── Business Context ──────────────────────────────────────────────
// Objeto agregado que consume el Intent Engine, Planning Engine, etc.

export interface BusinessContext {
  workspaceId:      string
  companyName:      string | null
  sector:           string | null
  country:          string | null
  website:          string | null
  size:             CompanySize
  languages:        string[]
  services:         string[]
  products:         string[]
  markets:          string[]
  competitors:      string[]
  regulations:      string[]
  certifications:   string[]
  softwareUsed:     string[]
  digitalMaturity:  DigitalMaturity
  departments:      string[]
  activeObjectives: CompanyObjectiveData[]
  openRisks:        CompanyRiskData[]
  knownProcesses:   CompanyProcessData[]
  keyAssets:        CompanyAssetData[]
  confidence:       number
  lastUpdated:      string | null
  isEmpty:          boolean   // true si no hay datos aún
  docsContext:      string | null
}

// ── Memory Update Input ────────────────────────────────────────────

export type CompanyProfileUpdate = Partial<Omit<CompanyProfileData, 'id' | 'workspaceId' | 'lastUpdatedAt' | 'confidence'>>

export interface MemoryUpdateEvent {
  workspaceId: string
  source:      MemorySource
  sourceId:    string | null
  actorUserId: string | null
  changes:     CompanyProfileUpdate
  confidence:  number   // 0.0-1.0 de la fuente de datos
}

// ── Memory Summary (para LLMs) ────────────────────────────────────

export interface MemorySummary {
  workspaceId:  string
  companyLine:  string          // "ACME SL — Software B2B — España"
  contextLines: string[]        // máx 10 líneas de contexto clave
  objectivesLine: string        // "Objetivos: ISO 9001 (alta prioridad), SEO (media)"
  risksLine:    string          // "Riesgos: sin backup documental (alto)"
  confidence:   number
  tokenEstimate: number         // estimación de tokens del resumen
}
