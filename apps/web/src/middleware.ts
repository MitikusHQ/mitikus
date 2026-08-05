import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import {
  LOCALE_COOKIE,
  LOCALE_HEADER,
} from './i18n/config'
import { resolveLocale } from './i18n/detect-locale'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/forgot-password(.*)',
  '/sso-callback(.*)',
  '/onboarding',
  '/setup-mfa',
  '/privacy',
  '/terms',
  '/dpa',
  '/shared/(.*)',
  '/portal/(.*)',
  '/invite/(.*)',
  '/p/(.*)',
  '/t/(.*)',
  '/contracts/sign/(.*)',
  '/sitemap.xml',
  '/robots.txt',
  '/llms.txt',
  '/api/og',
  '/api/health',
  '/api/webhooks/(.*)',
  '/api/onboarding/(.*)',
  '/api/leads',
  '/pricing',
])

// Rutas que un usuario autenticado pero sin MFA puede visitar
const isMfaExempt = createRouteMatcher([
  '/setup-mfa',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/api/(.*)',
])

// Segundo factor completado si la sesión incluye totp o phone_code
function hasCompletedMfa(sessionClaims: Record<string, unknown> | null): boolean {
  const fac = sessionClaims?.fac
  if (!Array.isArray(fac)) return false
  return fac.some((f: unknown) => typeof f === 'string' && ['totp', 'phone_code'].includes(f))
}

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  // Forzar MFA en todas las rutas protegidas
  if (!isMfaExempt(req)) {
    const { userId, sessionClaims } = await auth()
    if (userId && !hasCompletedMfa(sessionClaims as Record<string, unknown> | null)) {
      return NextResponse.redirect(new URL('/setup-mfa', req.url))
    }
  }

  const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value ?? null
  const country =
    req.headers.get('x-vercel-ip-country') ??
    req.headers.get('cf-ipcountry') ??
    null

  // Locale activo: cookie → España=es → 'en'
  const resolvedLocale = resolveLocale({ cookieLocale, country })

  const res = NextResponse.next()
  res.headers.set(LOCALE_HEADER, resolvedLocale)

  // La cookie de locale NUNCA se escribe aquí.
  // Solo se persiste cuando el usuario elige explícitamente (setLocale server action).

  return res
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
