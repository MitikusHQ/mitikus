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
  '/api/leads',
  '/pricing',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
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
