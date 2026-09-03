import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import {
  LOCALE_COOKIE,
  LOCALE_HEADER,
} from './i18n/config'
import { resolveLocale } from './i18n/detect-locale'
import { ratelimit } from './lib/rate-limit'

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
  '/api/desktop/license-token',
  '/api/webhooks/(.*)',
  '/api/leads',
  '/api/cron/(.*)',
  '/blog',
  '/blog/(.*)',
  '/pricing',
])

const isRateLimitedRoute = createRouteMatcher(['/api/(.*)'])
const isRateLimitExempt = createRouteMatcher([
  '/api/health',
  '/api/og',
  '/api/brain/query',
  '/api/desktop/license-token',
  '/api/webhooks/(.*)',
  '/api/leads',
  '/api/cron/(.*)',
])
const isRateLimitReadExempt = createRouteMatcher([
  '/api/workspace/(.*)/brain/history',
  '/api/workspace/(.*)/memory',
])

export default clerkMiddleware(async (auth, req) => {
  const skipReadRateLimit = req.method === 'GET' && isRateLimitReadExempt(req)

  if (ratelimit && isRateLimitedRoute(req) && !isRateLimitExempt(req) && !skipReadRateLimit) {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      '127.0.0.1'

    const { success } = await ratelimit.limit(ip)

    if (!success) {
      return new NextResponse(
        JSON.stringify({ error: 'Demasiadas solicitudes. Inténtalo en un momento.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        },
      )
    }
  }

  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value ?? null
  const country =
    req.headers.get('x-vercel-ip-country') ??
    req.headers.get('cf-ipcountry') ??
    null

  const resolvedLocale = resolveLocale({ cookieLocale, country })

  const res = NextResponse.next()
  res.headers.set(LOCALE_HEADER, resolvedLocale)

  return res
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
