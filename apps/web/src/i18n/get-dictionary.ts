import type { Dictionary } from './types'
import type { Locale } from './config'
import { FALLBACK_LOCALE } from './config'

/**
 * Carga el diccionario bajo demanda — solo el locale solicitado.
 * Usar en Server Components: const dict = await getDictionary(locale)
 */
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  switch (locale) {
    case 'es':
      return (await import('./dictionaries/es.json')).default as unknown as Dictionary
    default:
      return (await import('./dictionaries/en.json')).default as unknown as Dictionary
  }
}

/**
 * Crea una función `t()` tipada para acceder a claves del diccionario por dotpath.
 *
 * Uso en Server Component:
 *   const dict = await getDictionary(locale)
 *   const t = createT(dict)
 *   t('common.save')           // → "Save"
 *   t('auth.signIn')           // → "Sign in"
 *   t('generate.title')        // → "Generate tool with AI"
 *   t('usage.remaining', { daily: 3, workspace: 10 })
 *
 * Nunca muestra claves: si la clave no existe → devuelve la clave como fallback.
 * Si la traducción no existe en el locale actual → fallback automático a inglés.
 */
export function createT(dict: Dictionary) {
  return function t(path: string, vars?: Record<string, string | number>): string {
    const value = resolvePath(dict, path)
    if (typeof value !== 'string') return path
    if (!vars) return value
    return value.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? key))
  }
}

/** Crea un `t()` con fallback explícito a inglés */
export async function createTWithFallback(locale: Locale) {
  const dict = await getDictionary(locale)
  const fallbackDict = locale === FALLBACK_LOCALE
    ? dict
    : await getDictionary(FALLBACK_LOCALE)

  return function t(path: string, vars?: Record<string, string | number>): string {
    const value = resolvePath(dict, path) ?? resolvePath(fallbackDict, path)
    if (typeof value !== 'string') return path
    if (!vars) return value
    return value.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? key))
  }
}

function resolvePath(obj: unknown, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}
