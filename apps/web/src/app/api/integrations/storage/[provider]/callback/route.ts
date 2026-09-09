import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import {
  buildStorageIntegrationState,
  decodeStorageState,
  getStorageRedirectUri,
  withStorageIntegration,
  type StorageProvider,
} from '@/lib/integrations/calendar'

interface RouteContext {
  params: Promise<{ provider: string }>
}

interface TokenResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  error?: string
  error_description?: string
}

async function exchangeGoogleDriveCode(code: string, redirectUri: string): Promise<TokenResponse> {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Google Drive no está configurado.')

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
  if (!res.ok || data.error) throw new Error(data.error_description ?? 'No se pudo conectar Google Drive.')
  return data
}

async function exchangeOneDriveCode(code: string, redirectUri: string): Promise<TokenResponse> {
  const clientId = process.env.MICROSOFT_STORAGE_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_STORAGE_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('OneDrive no está configurado.')

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
  if (!res.ok || data.error) throw new Error(data.error_description ?? 'No se pudo conectar OneDrive.')
  return data
}

async function exchangeDropboxCode(code: string, redirectUri: string): Promise<TokenResponse> {
  const clientId = process.env.DROPBOX_CLIENT_ID
  const clientSecret = process.env.DROPBOX_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Dropbox no está configurado.')

  const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
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
  if (!res.ok || data.error) throw new Error(data.error_description ?? 'No se pudo conectar Dropbox.')
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

async function fetchMicrosoftEmail(accessToken: string) {
  const res = await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName', {
    headers: { authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  const data = await res.json() as { mail?: string | null; userPrincipalName?: string | null }
  return data.mail ?? data.userPrincipalName ?? null
}

async function fetchDropboxEmail(accessToken: string) {
  const res = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: 'null',
  })
  if (!res.ok) return null
  const data = await res.json() as { email?: string }
  return data.email ?? null
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { provider: rawProvider } = await context.params
  const provider = rawProvider as StorageProvider
  const fallbackUrl = new URL('/onboarding', request.url)

  if (provider !== 'google_drive' && provider !== 'onedrive' && provider !== 'dropbox') {
    return NextResponse.redirect(fallbackUrl)
  }

  const code = request.nextUrl.searchParams.get('code')
  const state = decodeStorageState(request.nextUrl.searchParams.get('state'))
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

  const redirectUri = getStorageRedirectUri(provider)
  const token =
    provider === 'google_drive'
      ? await exchangeGoogleDriveCode(code, redirectUri)
      : provider === 'onedrive'
        ? await exchangeOneDriveCode(code, redirectUri)
        : await exchangeDropboxCode(code, redirectUri)

  if (!token.access_token) throw new Error('El proveedor no devolvió token de acceso.')

  const accountEmail =
    provider === 'google_drive'
      ? await fetchGoogleEmail(token.access_token)
      : provider === 'onedrive'
        ? await fetchMicrosoftEmail(token.access_token)
        : await fetchDropboxEmail(token.access_token)

  const storage = buildStorageIntegrationState({
    provider,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresIn: token.expires_in,
    scope: token.scope,
    accountEmail,
  })
  if (!storage) throw new Error('No se pudieron cifrar las credenciales de almacenamiento.')

  const integrations = withStorageIntegration(workspace.companyProfile?.integrations, storage) as Prisma.InputJsonValue

  await db.companyProfile.upsert({
    where: { workspaceId: workspace.id },
    create: { workspaceId: workspace.id, integrations },
    update: { integrations },
  })

  return NextResponse.redirect(new URL(`/workspace/${workspace.id}/integrations`, request.url))
}
