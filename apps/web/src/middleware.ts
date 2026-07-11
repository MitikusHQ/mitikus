import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import {
  LOCALE_COOKIE,
  BANNER_DISMISSED_COOKIE,
  LOCALE_HEADER,
  SUGGESTED_LOCALE_HEADER,
} from './i18n/config'
import { resolveLocale, suggestLocale } from './i18n/detect-locale'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/forgot-password(.*)',
  '/sso-callback(.*)',
  '/onboarding',
  '/privacy',
  '/shared/(.*)',
  '/sitemap.xml',
  '/robots.txt',
  '/llms.txt',
  '/api/og',
  '/api/health',
  '/api/webhooks/(.*)',
  '/api/onboarding/(.*)',
  '/api/leads',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value ?? null
  const acceptLanguage = req.headers.get('accept-language')
  const country =
    req.headers.get('x-vercel-ip-country') ??
    req.headers.get('cf-ipcountry') ??
    null

  // Locale activo: cookie → país IP → Accept-Language → 'en'
  const resolvedLocale = resolveLocale({ cookieLocale, acceptLanguage, country })

  const res = NextResponse.next()
  res.headers.set(LOCALE_HEADER, resolvedLocale)

  // Banner de sugerencia: solo si no hay cookie y el navegador/país sugiere español.
  // No escribe ninguna cookie — solo informa al layout para mostrar el banner.
  const bannerDismissed = req.cookies.get(BANNER_DISMISSED_COOKIE)?.value
  if (!bannerDismissed) {
    const suggested = suggestLocale({ acceptLanguage, country })
    res.headers.set(SUGGESTED_LOCALE_HEADER, suggested)
  }

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
