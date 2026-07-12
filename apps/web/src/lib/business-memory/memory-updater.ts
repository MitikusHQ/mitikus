/**
 * Memory Updater — extrae conocimiento de ejecuciones y actualiza la memoria.
 *
 * REGLAS, nunca IA.
 * Cuando una herramienta se ejecuta, se mapean sus variables a campos de CompanyProfile.
 *
 * Integración:
 *   - Llamar a `updateMemoryFromExecution()` después de ToolExecution COMPLETED
 *   - Llamar a `updateMemoryFromIntent()` cuando Intent Engine detecta entidades
 */

import { updateProfile } from './company-profile'
import { upsertProcess } from './company-processes'
import { upsertObjectiveByGoal } from './company-objectives'
import { CAPABILITY_PROFILES } from '@/registry/official/_capability-profiles'
import { GOAL_CATALOG } from '@/lib/intent-engine/goals'
import type { CompanyProfileUpdate, MemorySource, ProcessDomain } from './memory-types'
import type { IntentEntity } from '@/lib/intent-engine/types'
import type { CanonicalGoal } from '@/lib/intent-engine/types'

// ── Campo de variables → campo de CompanyProfile ──────────────────
// Mapeo de nombres comunes de variables de herramientas a campos del perfil

const VARIABLE_FIELD_MAP: Record<string, keyof CompanyProfileUpdate> = {
  // Nombre de empresa
  nombre_empresa:     'companyName',
  empresa:            'companyName',
  company:            'companyName',
  company_name:       'companyName',
  razon_social:       'companyName',
  nombre_cliente:     'companyName',

  // Web
  url:                'website',
  url_web:            'website',
  sitio_web:          'website',
  website:            'website',
  web:                'website',
  dominio:            'website',

  // Sector
  sector:             'sector',
  industry:           'sector',
  industria:          'sector',
  actividad:          'sector',

  // País y ciudad
  pais:               'country',
  country:            'country',
  ciudad:             'city',
  city:               'city',

  // Tamaño
  empleados:          'size',
  num_empleados:      'size',
  plantilla:          'size',

  // Mercado
  mercado:            'markets',
  mercados:           'markets',
  target_market:      'markets',

  // Competidores
  competidores:       'competitors',
  competitors:        'competitors',

  // Normativa
  normativa:          'regulations',
  certificacion:      'certifications',
  certification:      'certifications',

  // Software
  erp:                'softwareUsed',
  crm:                'softwareUsed',
  software:           'softwareUsed',

  // Servicios y productos
  servicios:          'services',
  services:           'services',
  productos:          'products',
  products:           'products',
}

// ── Tool slug → proceso de negocio ───────────────────────────────

const TOOL_TO_PROCESS: Record<string, { domain: ProcessDomain; name: string }> = {
  'seo-audit':          { domain: 'marketing',   name: 'SEO y posicionamiento web' },
  'seo-checklist':      { domain: 'marketing',   name: 'SEO y posicionamiento web' },
  'editorial-plan':     { domain: 'marketing',   name: 'Marketing de contenidos' },
  'campaign-brief':     { domain: 'marketing',   name: 'Gestión de campañas' },
  'campaign-evaluation':{ domain: 'marketing',   name: 'Evaluación de campañas' },
  'social-media-audit': { domain: 'marketing',   name: 'Redes sociales' },
  'crm-leads':          { domain: 'sales',       name: 'Gestión de leads' },
  'opportunity-tracking':{ domain: 'sales',      name: 'Seguimiento de oportunidades' },
  'commercial-visit':   { domain: 'sales',       name: 'Visitas comerciales' },
  'sales-forecast':     { domain: 'sales',       name: 'Previsión de ventas' },
  'iso9001-audit':      { domain: 'quality',     name: 'Auditoría ISO 9001' },
  'corrective-action':  { domain: 'quality',     name: 'Acciones correctivas' },
  'preventive-action':  { domain: 'quality',     name: 'Acciones preventivas' },
  'gdpr-audit':         { domain: 'legal',       name: 'Cumplimiento RGPD' },
  'supplier-eval':      { domain: 'procurement', name: 'Evaluación de proveedores' },
  'onboarding-checklist':{ domain: 'hr',         name: 'Onboarding de empleados' },
  'offboarding-process':{ domain: 'hr',          name: 'Offboarding de empleados' },
  'okr-planning':       { domain: 'operations',  name: 'Planificación OKR' },
  'it-audit':           { domain: 'it',          name: 'Auditoría TI' },
  'digital-diagnosis':  { domain: 'operations',  name: 'Diagnóstico digital' },
  'strategic-plan':     { domain: 'operations',  name: 'Planificación estratégica' },
  'business-diagnosis': { domain: 'operations',  name: 'Diagnóstico de negocio' },
  'financial-report':   { domain: 'finance',     name: 'Reporting financiero' },
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Extrae datos de una ejecución de herramienta y actualiza la memoria.
 * Llamar después de ToolExecution COMPLETED.
 */
export async function updateMemoryFromExecution(params: {
  workspaceId:  string
  toolSlug:     string
  variables:    Record<string, unknown>
  actorUserId:  string | null
  executionId:  string
}): Promise<void> {
  const { workspaceId, toolSlug, variables, actorUserId, executionId } = params

  try {
    // 1. Extraer campos del perfil de las variables
    const profileUpdate = extractProfileFromVariables(variables)
    if (Object.keys(profileUpdate).length > 0) {
      await updateProfile(workspaceId, profileUpdate, 'tool_execution', actorUserId, 0.7, executionId)
    }

    // 2. Registrar el proceso de negocio conocido
    const processMapping = TOOL_TO_PROCESS[toolSlug]
    if (processMapping) {
      await upsertProcess(workspaceId, {
        ...processMapping,
        toolSlug,
      })
    }

    // 3. Actualizar dominio del perfil si se puede inferir del tool
    const profile = CAPABILITY_PROFILES[toolSlug]
    if (profile && profileUpdate.sector === undefined) {
      const domainToSector: Partial<Record<string, string>> = {
        marketing:   profileUpdate.sector ?? undefined,
        quality:     profileUpdate.sector ?? undefined,
      }
      void domainToSector  // solo se usa como referencia de mapeo
    }
  } catch {
    // Errores de memoria nunca bloquean la ejecución principal
  }
}

/**
 * Actualiza la memoria a partir de las entidades detectadas por el Intent Engine.
 * Alta confianza (0.9) porque el usuario lo expresó explícitamente.
 */
export async function updateMemoryFromIntent(params: {
  workspaceId:   string
  entities:      IntentEntity
  canonicalGoal: CanonicalGoal | null
  actorUserId:   string | null
}): Promise<void> {
  const { workspaceId, entities, canonicalGoal, actorUserId } = params

  try {
    // 1. Mapear entidades del Intent al perfil
    const update: CompanyProfileUpdate = {}

    if (entities.company_name) update.companyName = entities.company_name
    if (entities.website)      update.website      = entities.website
    if (entities.sector)       update.sector       = entities.sector
    if (entities.country)      update.country      = entities.country
    if (entities.market)       update.markets      = [entities.market]
    if (entities.competitors && entities.competitors.length > 0)
      update.competitors = entities.competitors
    if (entities.regulation)   update.regulations  = [entities.regulation]
    if (entities.brand)        update.companyName  = update.companyName ?? entities.brand

    if (Object.keys(update).length > 0) {
      await updateProfile(workspaceId, update, 'intent', actorUserId, 0.9, null)
    }

    // 2. Registrar el objetivo canónico si existe
    if (canonicalGoal) {
      const goalDef = GOAL_CATALOG[canonicalGoal]
      if (goalDef) {
        await upsertObjectiveByGoal(workspaceId, canonicalGoal, goalDef.labelEs)
      }
    }
  } catch {
    // Silencioso — no bloquear el flujo del Intent Engine
  }
}

/**
 * Actualiza la memoria cuando un workflow se publica o completa.
 */
export async function updateMemoryFromWorkflow(params: {
  workspaceId:   string
  workflowId:    string
  canonicalGoal: string | null
  actorUserId:   string | null
}): Promise<void> {
  const { workspaceId, workflowId, canonicalGoal, actorUserId } = params

  if (!canonicalGoal) return

  try {
    const goalDef = GOAL_CATALOG[canonicalGoal as CanonicalGoal]
    if (goalDef) {
      await upsertObjectiveByGoal(workspaceId, canonicalGoal, goalDef.labelEs, workflowId)
    }
  } catch {
    // Silencioso
  }
}

// ── Helpers privados ──────────────────────────────────────────────

function extractProfileFromVariables(vars: Record<string, unknown>): CompanyProfileUpdate {
  const update: CompanyProfileUpdate = {}

  for (const [varName, value] of Object.entries(vars)) {
    const field = VARIABLE_FIELD_MAP[varName.toLowerCase()]
    if (!field || value === null || value === undefined) continue

    const strVal = String(value).trim()
    if (!strVal) continue

    // Arrays: si el campo del perfil es un array, convertir el valor a array de un elemento
    const arrayFields: (keyof CompanyProfileUpdate)[] = [
      'languages', 'markets', 'services', 'products', 'customers',
      'competitors', 'regulations', 'certifications', 'softwareUsed',
      'integrations', 'departments',
    ]

    if (arrayFields.includes(field)) {
      const existing = (update[field] as string[] | undefined) ?? []
      ;(update[field] as string[]) = [...existing, strVal]
    } else {
      ;(update as any)[field] = strVal
    }
  }

  return update
}
