/**
 * Intent Validator — valida la respuesta raw de Claude.
 *
 * No lanza excepciones: devuelve siempre un ParsedIntent válido,
 * aplicando defaults seguros cuando Claude devuelva valores inesperados.
 */

import type {
  ParsedIntent,
  IntentDomain,
  IntentEntity,
  IntentConstraint,
  IntentValidationResult,
} from './types'

const VALID_DOMAINS: IntentDomain[] = [
  'strategy', 'hr', 'finance', 'it', 'marketing',
  'quality', 'operations', 'legal', 'sales', 'admin', 'procurement',
]

const VALID_BUDGETS   = ['low', 'medium', 'high'] as const
const VALID_QUALITIES = ['draft', 'standard', 'professional'] as const
const VALID_SPEEDS    = ['fast', 'standard', 'thorough'] as const
const VALID_DEPTHS    = ['superficial', 'standard', 'deep'] as const

function isValidDomain(v: unknown): v is IntentDomain {
  return typeof v === 'string' && VALID_DOMAINS.includes(v as IntentDomain)
}

function safeString(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null
}

function safeStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
}

function safeConfidence(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  if (isNaN(n)) return 0.5
  return Math.min(1, Math.max(0, n))
}

function sanitizeEntity(raw: unknown): IntentEntity {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    company_name: safeString(r.company_name),
    website:      safeString(r.website),
    product:      safeString(r.product),
    market:       safeString(r.market),
    sector:       safeString(r.sector),
    regulation:   safeString(r.regulation),
    competitors:  safeStringArray(r.competitors),
    brand:        safeString(r.brand),
    country:      safeString(r.country),
  }
}

function sanitizeConstraint(raw: unknown): IntentConstraint {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>

  function oneOf<T extends string>(v: unknown, valid: readonly T[]): T | null {
    return typeof v === 'string' && valid.includes(v as T) ? (v as T) : null
  }

  return {
    budget:         oneOf(r.budget, VALID_BUDGETS),
    quality:        oneOf(r.quality, VALID_QUALITIES),
    speed:          oneOf(r.speed, VALID_SPEEDS),
    depth:          oneOf(r.depth, VALID_DEPTHS),
    language:       safeString(r.language),
    preferredModel: safeString(r.preferredModel),
  }
}

/**
 * Valida y sanitiza la respuesta raw de Claude → ParsedIntent.
 * Siempre devuelve un objeto válido aunque el JSON sea parcialmente incorrecto.
 */
export function sanitizeParsedIntent(raw: unknown): ParsedIntent {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>

  return {
    rawGoal:    safeString(r.rawGoal) ?? 'objetivo no especificado',
    domain:     isValidDomain(r.domain) ? r.domain : 'strategy',
    confidence: safeConfidence(r.confidence),
    language:   safeString(r.language) ?? 'es',
    entities:   sanitizeEntity(r.entities),
    constraints: sanitizeConstraint(r.constraints),
    missingInformation:         safeStringArray(r.missingInformation),
    alternativeInterpretations: safeStringArray(r.alternativeInterpretations),
  }
}

/**
 * Valida semánticamente un ParsedIntent ya sanitizado.
 * Devuelve warnings/errors pero NO lanza excepciones.
 */
export function validateIntent(intent: ParsedIntent): IntentValidationResult {
  const errors:   string[] = []
  const warnings: string[] = []

  if (intent.rawGoal.length < 3) {
    errors.push('rawGoal demasiado corto — el objetivo no pudo extraerse')
  }

  if (intent.confidence < 0.5) {
    warnings.push(`Confianza baja (${intent.confidence.toFixed(2)}) — el objetivo puede ser incorrecto`)
  }

  if (!isValidDomain(intent.domain)) {
    errors.push(`Dominio '${intent.domain}' no válido`)
  }

  if (intent.missingInformation.length > 5) {
    warnings.push('Demasiada información faltante — el input puede ser muy vago')
  }

  return {
    valid:    errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Extrae JSON de la respuesta de Claude aunque venga con texto extra.
 * Busca el primer '{' y el último '}' como delimitadores.
 */
export function extractJsonFromResponse(text: string): unknown {
  const start = text.indexOf('{')
  const end   = text.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No se encontró JSON válido en la respuesta de Claude')
  }

  const jsonStr = text.slice(start, end + 1)
  return JSON.parse(jsonStr)
}
