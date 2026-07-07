/**
 * Memory Validator — normaliza y valida datos antes de persistir.
 *
 * Nunca lanza excepciones. Siempre devuelve datos limpios.
 */

import type {
  CompanyProfileUpdate,
  CompanySize,
  DigitalMaturity,
} from './memory-types'

const VALID_SIZES: CompanySize[]         = ['micro', 'small', 'medium', 'large', 'enterprise', 'unknown']
const VALID_MATURITY: DigitalMaturity[]  = ['emerging', 'developing', 'advanced', 'leading']

/**
 * Normaliza un CompanyProfileUpdate antes de guardarlo.
 * - Elimina strings vacíos
 * - Deduplica arrays
 * - Normaliza enums a valores válidos
 * - Limita longitudes
 */
export function normalizeProfileUpdate(update: CompanyProfileUpdate): CompanyProfileUpdate {
  const clean: CompanyProfileUpdate = {}

  if (update.companyName !== undefined)
    clean.companyName = sanitizeString(update.companyName, 200)

  if (update.sector !== undefined)
    clean.sector = sanitizeString(update.sector, 100)

  if (update.subsector !== undefined)
    clean.subsector = sanitizeString(update.subsector, 100)

  if (update.country !== undefined)
    clean.country = sanitizeString(update.country, 100)

  if (update.city !== undefined)
    clean.city = sanitizeString(update.city, 100)

  if (update.website !== undefined)
    clean.website = sanitizeUrl(update.website)

  if (update.foundedYear !== undefined && update.foundedYear !== null) {
    const year = Number(update.foundedYear)
    clean.foundedYear = year >= 1800 && year <= new Date().getFullYear() ? year : null
  }

  if (update.size !== undefined)
    clean.size = VALID_SIZES.includes(update.size as CompanySize)
      ? update.size as CompanySize
      : 'unknown'

  if (update.digitalMaturity !== undefined)
    clean.digitalMaturity = VALID_MATURITY.includes(update.digitalMaturity as DigitalMaturity)
      ? update.digitalMaturity as DigitalMaturity
      : 'emerging'

  // Arrays — deduplicar y limpiar
  const arrayFields = [
    'languages', 'markets', 'services', 'products', 'customers',
    'competitors', 'regulations', 'certifications', 'softwareUsed',
    'integrations', 'departments',
  ] as const

  for (const field of arrayFields) {
    if (update[field] !== undefined) {
      clean[field] = deduplicateArray(update[field] as string[], 50)
    }
  }

  return clean
}

/**
 * Calcula la confianza de un perfil en función de cuántos campos están rellenos.
 */
export function calculateConfidence(profile: CompanyProfileUpdate): number {
  const fields: (keyof CompanyProfileUpdate)[] = [
    'companyName', 'sector', 'country', 'website', 'size',
    'services', 'products', 'markets', 'languages', 'digitalMaturity',
  ]

  let filled = 0
  for (const f of fields) {
    const v = profile[f]
    if (v === null || v === undefined) continue
    if (Array.isArray(v) && v.length === 0) continue
    if (typeof v === 'string' && v.trim() === '') continue
    filled++
  }

  return Math.round((filled / fields.length) * 100) / 100
}

// ── Helpers ────────────────────────────────────────────────────────

function sanitizeString(v: string | null | undefined, maxLen: number): string | null {
  if (!v || typeof v !== 'string') return null
  const trimmed = v.trim()
  return trimmed.length === 0 ? null : trimmed.slice(0, maxLen)
}

function sanitizeUrl(v: string | null | undefined): string | null {
  if (!v) return null
  const s = v.trim()
  if (s.length === 0) return null
  try {
    const url = new URL(s.startsWith('http') ? s : `https://${s}`)
    return url.href
  } catch {
    return s.slice(0, 500)
  }
}

function deduplicateArray(arr: string[], maxItems: number): string[] {
  if (!Array.isArray(arr)) return []
  return [...new Set(
    arr
      .filter((s) => typeof s === 'string' && s.trim().length > 0)
      .map((s) => s.trim()),
  )].slice(0, maxItems)
}
