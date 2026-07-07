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
 * Solo acepta elección explícita del usuario (cookie).
 * Fallback siempre "en" — nunca cambia el locale por Accept-Language ni país.
 * La detección del navegador/país es exclusiva de suggestLocale() para el banner.
 */
export function resolveLocale({ cookieLocale }: { cookieLocale: string | null }): Locale {
  if (cookieLocale) return sanitizeLocale(cookieLocale)
  return DEFAULT_LOCALE
}

/**
 * Locale sugerido para el banner (ignorando cookie — refleja lo que detecta el navegador).
 * Solo se usa si el usuario aún no ha elegido idioma (no hay cookie).
 */
export function suggestLocale({
  acceptLanguage,
  country,
}: {
  acceptLanguage: string | null
  country: string | null
}): Locale {
  return (
    detectLocaleFromAcceptLanguage(acceptLanguage) ??
    detectLocaleFromCountry(country) ??
    DEFAULT_LOCALE
  )
}
