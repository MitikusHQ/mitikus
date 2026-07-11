import {
  type Locale,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  SPANISH_SPEAKING_COUNTRIES,
  sanitizeLocale,
} from './config'

/**
 * Parsea la cabecera Accept-Language y devuelve el mejor locale soportado.
 * Ejemplo: "es-ES,es;q=0.9,en;q=0.8" → "es"
 */
export function detectLocaleFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null

  const tags = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=')
      return { tag: (tag ?? '').trim().toLowerCase(), q: parseFloat(q ?? '1') || 1 }
    })
    .sort((a, b) => b.q - a.q)

  for (const { tag } of tags) {
    // Primero coincidencia exacta (es-ES → es)
    const lang = tag.split('-')[0] as Locale
    if (SUPPORTED_LOCALES.includes(lang)) return lang
  }

  return null
}

/**
 * Detecta locale a partir del país (headers de hosting).
 * Solo devuelve un locale si hay certeza razonable.
 */
export function detectLocaleFromCountry(country: string | null): Locale | null {
  if (!country) return null
  const upper = country.toUpperCase()
  if (SPANISH_SPEAKING_COUNTRIES.has(upper)) return 'es'
  return null
}

/**
 * Resuelve el locale activo para el request.
 *
 * Prioridad:
 * 1. Cookie (elección explícita del usuario)
 * 2. IP del país (x-vercel-ip-country / cf-ipcountry)
 * 3. Accept-Language del navegador
 * 4. Fallback: 'en'
 */
export function resolveLocale({
  cookieLocale,
  acceptLanguage,
  country,
}: {
  cookieLocale: string | null
  acceptLanguage?: string | null
  country?: string | null
}): Locale {
  if (cookieLocale) return sanitizeLocale(cookieLocale)
  return (
    detectLocaleFromCountry(country ?? null) ??
    detectLocaleFromAcceptLanguage(acceptLanguage ?? null) ??
    'en'
  )
}

/**
 * Locale sugerido para el banner — igual que resolveLocale pero siempre
 * refleja la detección real (ignora cookie).
 */
export function suggestLocale({
  acceptLanguage,
  country,
}: {
  acceptLanguage: string | null
  country: string | null
}): Locale {
  return (
    detectLocaleFromCountry(country) ??
    detectLocaleFromAcceptLanguage(acceptLanguage) ??
    'en'
  )
}
