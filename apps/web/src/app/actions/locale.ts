'use server'

import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { LOCALE_COOKIE, BANNER_DISMISSED_COOKIE, sanitizeLocale } from '@/i18n/config'
import { db } from '@/lib/db'

const LOCALE_COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 365, // 1 año
  path: '/',
  sameSite: 'lax' as const,
  httpOnly: false,
}

export async function setLocale(locale: string): Promise<void> {
  const safe = sanitizeLocale(locale)
  const cookieStore = await cookies()

  cookieStore.set(LOCALE_COOKIE, safe, LOCALE_COOKIE_OPTIONS)
  // Guardar elección también descarta el banner
  cookieStore.set(BANNER_DISMISSED_COOKIE, '1', LOCALE_COOKIE_OPTIONS)

  // Sincroniza con DB si hay sesión activa (best-effort)
  try {
    const { userId } = await auth()
    if (userId) {
      await db.user.updateMany({
        where: { clerkId: userId },
        data: { locale: safe },
      })
    }
  } catch {
    // No bloquear si la DB falla — la cookie es suficiente
  }
}

export async function dismissLocaleBanner(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(BANNER_DISMISSED_COOKIE, '1', {
    ...LOCALE_COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 30, // 30 días (solo silencia el banner, no persiste locale)
  })
}
