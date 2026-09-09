import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import {
  buildCalendarIntegrationState,
  decodeCalendarState,
  getCalendarRedirectUri,
  withCalendarIntegration,
  type CalendarProvider,
} from '@/lib/integrations/calendar'

interface RouteContext {
  params: Promise<{ provider: string }>
}

interface TokenResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  id_token?: string
  error?: string
  error_description?: string
}

async function exchangeGoogleCode(code: string, redirectUri: string): Promise<TokenResponse> {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Google Calendar no está configurado.')

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })
  const data = await res.json() as TokenResponse
  if (!res.ok || data.error) throw new Error(data.error_description ?? 'No se pudo conectar Google Calendar.')
  return data
}

async function exchangeOutlookCode(code: string, redirectUri: string): Promise<TokenResponse> {
  const clientId = process.env.MICROSOFT_CALENDAR_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CALENDAR_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Microsoft Calendar no está configurado.')

  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })
  const data = await res.json() as TokenResponse
  if (!res.ok || data.error) throw new Error(data.error_description ?? 'No se pudo conectar Outlook Calendar.')
  return data
}

async function fetchGoogleEmail(accessToken: string) {
  const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  const data = await res.json() as { email?: string }
  return data.email ?? null
}

async function fetchOutlookEmail(accessToken: string) {
  const res = await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName', {
    headers: { authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  const data = await res.json() as { mail?: string | null; userPrincipalName?: string | null }
  return data.mail ?? data.userPrincipalName ?? null
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { provider: rawProvider } = await context.params
  const provider = rawProvider as CalendarProvider
  const fallbackUrl = new URL('/onboarding', request.url)

  if (provider !== 'google' && provider !== 'outlook') {
    return NextResponse.redirect(fallbackUrl)
  }

  const code = request.nextUrl.searchParams.get('code')
  const state = decodeCalendarState(request.nextUrl.searchParams.get('state'))
  if (!code || !state || state.provider !== provider) {
    return NextResponse.redirect(fallbackUrl)
  }

  const user = await requireUser()
  const workspace = await db.workspace.findFirst({
    where: { id: state.workspaceId, orgId: user.orgId },
    select: {
      id: true,
      companyProfile: { select: { integrations: true } },
    },
  })
  if (!workspace) return NextResponse.redirect(fallbackUrl)

  const redirectUri = getCalendarRedirectUri(provider)
  const token = provider === 'google'
    ? await exchangeGoogleCode(code, redirectUri)
    : await exchangeOutlookCode(code, redirectUri)

  if (!token.access_token) throw new Error('El proveedor no devolvió token de acceso.')

  const accountEmail = provider === 'google'
    ? await fetchGoogleEmail(token.access_token)
    : await fetchOutlookEmail(token.access_token)

  const calendar = buildCalendarIntegrationState({
    provider,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresIn: token.expires_in,
    scope: token.scope,
    accountEmail,
  })
  if (!calendar) throw new Error('No se pudieron cifrar las credenciales de calendario.')

  const integrations = withCalendarIntegration(workspace.companyProfile?.integrations, calendar) as Prisma.InputJsonValue

  await db.companyProfile.upsert({
    where: { workspaceId: workspace.id },
    create: { workspaceId: workspace.id, integrations },
    update: { integrations },
  })

  return NextResponse.redirect(new URL(`/workspace/${workspace.id}/integrations`, request.url))
}
