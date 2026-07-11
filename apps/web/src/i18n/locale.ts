import { cookies, headers } from 'next/headers'
import { type Locale, LOCALE_COOKIE, LOCALE_HEADER, sanitizeLocale } from './config'

/**
 * Obtiene el locale activo en un Server Component.
 *
 * Prioridad:
 * 1. Cookie protools-locale (preferencia guardada)
 * 2. Header x-protools-locale (inyectado por el middleware)
 * 3. Fallback: "en"
 *
 * No consulta la DB — la cookie es el mecanismo primario.
 * La DB (User.locale) se sincroniza al guardar preferencia, no se lee en cada request.
 */
export async function getLocale(): Promise<Locale> {
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()])

  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value
  if (cookieLocale) return sanitizeLocale(cookieLocale)

  const headerLocale = headersList.get(LOCALE_HEADER)
  if (headerLocale) return sanitizeLocale(headerLocale)

  return 'es'
}
