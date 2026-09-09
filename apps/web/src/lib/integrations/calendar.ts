import { createHash, randomBytes } from 'node:crypto'
import { decryptSafe, encryptSafe } from '@/lib/crypto'

export type CalendarProvider = 'google' | 'outlook'
export type StorageProvider = 'google_drive' | 'onedrive' | 'dropbox'
export type AiProvider = 'openai' | 'anthropic' | 'gemini'

export interface CalendarIntegrationState {
  provider: CalendarProvider
  connectedAt: string
  accountEmail?: string | null
  accessTokenEncrypted?: string | null
  refreshTokenEncrypted?: string | null
  expiresAt?: string | null
  scope?: string | null
}

export interface WorkspaceIntegrationsState {
  calendar?: CalendarIntegrationState | null
  storage?: StorageIntegrationState | null
  aiProvider?: AiProviderIntegrationState | null
  forms?: FormsIntegrationState | null
}

export interface StorageIntegrationState {
  provider: StorageProvider
  connectedAt: string
  accountEmail?: string | null
  accessTokenEncrypted?: string | null
  refreshTokenEncrypted?: string | null
  expiresAt?: string | null
  scope?: string | null
}

export interface AiProviderIntegrationState {
  provider: AiProvider
  connectedAt: string
  label?: string | null
  apiKeyEncrypted?: string | null
}

export interface FormsIntegrationState {
  webhookTokenHash: string
  webhookTokenPreview: string
  createdAt: string
  rotatedAt?: string | null
}

export function parseWorkspaceIntegrations(value: unknown): WorkspaceIntegrationsState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as WorkspaceIntegrationsState
}

export function withCalendarIntegration(
  value: unknown,
  calendar: CalendarIntegrationState | null,
): WorkspaceIntegrationsState {
  return {
    ...parseWorkspaceIntegrations(value),
    calendar,
  }
}

export function withStorageIntegration(
  value: unknown,
  storage: StorageIntegrationState | null,
): WorkspaceIntegrationsState {
  return {
    ...parseWorkspaceIntegrations(value),
    storage,
  }
}

export function withAiProviderIntegration(
  value: unknown,
  aiProvider: AiProviderIntegrationState | null,
): WorkspaceIntegrationsState {
  return {
    ...parseWorkspaceIntegrations(value),
    aiProvider,
  }
}

export function withFormsIntegration(
  value: unknown,
  forms: FormsIntegrationState | null,
): WorkspaceIntegrationsState {
  return {
    ...parseWorkspaceIntegrations(value),
    forms,
  }
}

export function createFormsWebhookToken() {
  return randomBytes(32).toString('base64url')
}

export function hashFormsWebhookToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function buildFormsIntegrationState(token: string, previous?: FormsIntegrationState | null): FormsIntegrationState {
  return {
    webhookTokenHash: hashFormsWebhookToken(token),
    webhookTokenPreview: token.slice(0, 8),
    createdAt: previous?.createdAt ?? new Date().toISOString(),
    rotatedAt: previous ? new Date().toISOString() : null,
  }
}

export function buildFormsWebhookUrl(workspaceId: string, token: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mitikus.com').replace(/\/$/, '')
  const params = new URLSearchParams({ token })
  return baseUrl + '/api/integrations/forms/' + workspaceId + '/lead?' + params.toString()
}

export function buildAiProviderIntegrationState(input: {
  provider: AiProvider
  apiKey: string
  label?: string | null
}): AiProviderIntegrationState | null {
  const apiKeyEncrypted = encryptSafe(input.apiKey)
  if (!apiKeyEncrypted) return null
  return {
    provider: input.provider,
    connectedAt: new Date().toISOString(),
    label: input.label?.trim() || null,
    apiKeyEncrypted,
  }
}

export function getCalendarRedirectUri(provider: CalendarProvider) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mitikus.com').replace(/\/$/, '')
  return `${baseUrl}/api/integrations/calendar/${provider}/callback`
}

export function getCalendarAuthorizeUrl(provider: CalendarProvider, workspaceId: string) {
  const redirectUri = getCalendarRedirectUri(provider)
  const state = Buffer.from(JSON.stringify({ workspaceId, provider })).toString('base64url')

  if (provider === 'google') {
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID
    if (!clientId) return null

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline',
      prompt: 'consent',
      state,
    })
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  const clientId = process.env.MICROSOFT_CALENDAR_CLIENT_ID
  if (!clientId) return null

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    response_mode: 'query',
    scope: 'offline_access openid email User.Read Calendars.ReadWrite',
    state,
  })
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
}

export function decodeCalendarState(state: string | null): { workspaceId: string; provider: CalendarProvider } | null {
  if (!state) return null
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as {
      workspaceId?: unknown
      provider?: unknown
    }
    if (typeof parsed.workspaceId !== 'string') return null
    if (parsed.provider !== 'google' && parsed.provider !== 'outlook') return null
    return { workspaceId: parsed.workspaceId, provider: parsed.provider }
  } catch {
    return null
  }
}

export function buildCalendarIntegrationState(input: {
  provider: CalendarProvider
  accessToken?: string | null
  refreshToken?: string | null
  expiresIn?: number | null
  scope?: string | null
  accountEmail?: string | null
}): CalendarIntegrationState | null {
  const accessTokenEncrypted = encryptSafe(input.accessToken)
  const refreshTokenEncrypted = encryptSafe(input.refreshToken)
  if (input.accessToken && !accessTokenEncrypted) return null
  if (input.refreshToken && !refreshTokenEncrypted) return null

  const expiresAt = input.expiresIn
    ? new Date(Date.now() + input.expiresIn * 1000).toISOString()
    : null

  return {
    provider: input.provider,
    connectedAt: new Date().toISOString(),
    accountEmail: input.accountEmail ?? null,
    accessTokenEncrypted,
    refreshTokenEncrypted,
    expiresAt,
    scope: input.scope ?? null,
  }
}

export function getCalendarAccessToken(calendar: CalendarIntegrationState | null | undefined) {
  return decryptSafe(calendar?.accessTokenEncrypted)
}

export function getStorageRedirectUri(provider: StorageProvider) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mitikus.com').replace(/\/$/, '')
  return `${baseUrl}/api/integrations/storage/${provider}/callback`
}

export function getStorageAuthorizeUrl(provider: StorageProvider, workspaceId: string) {
  const redirectUri = getStorageRedirectUri(provider)
  const state = Buffer.from(JSON.stringify({ workspaceId, provider })).toString('base64url')

  if (provider === 'google_drive') {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID
    if (!clientId) return null

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email https://www.googleapis.com/auth/drive.file',
      access_type: 'offline',
      prompt: 'consent',
      state,
    })
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  if (provider === 'onedrive') {
    const clientId = process.env.MICROSOFT_STORAGE_CLIENT_ID
    if (!clientId) return null

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      response_mode: 'query',
      scope: 'offline_access openid email User.Read Files.ReadWrite',
      state,
    })
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
  }

  const clientId = process.env.DROPBOX_CLIENT_ID
  if (!clientId) return null

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    token_access_type: 'offline',
    state,
  })
  return `https://www.dropbox.com/oauth2/authorize?${params.toString()}`
}

export function decodeStorageState(state: string | null): { workspaceId: string; provider: StorageProvider } | null {
  if (!state) return null
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as {
      workspaceId?: unknown
      provider?: unknown
    }
    if (typeof parsed.workspaceId !== 'string') return null
    if (parsed.provider !== 'google_drive' && parsed.provider !== 'onedrive' && parsed.provider !== 'dropbox') return null
    return { workspaceId: parsed.workspaceId, provider: parsed.provider }
  } catch {
    return null
  }
}

export function buildStorageIntegrationState(input: {
  provider: StorageProvider
  accessToken?: string | null
  refreshToken?: string | null
  expiresIn?: number | null
  scope?: string | null
  accountEmail?: string | null
}): StorageIntegrationState | null {
  const accessTokenEncrypted = encryptSafe(input.accessToken)
  const refreshTokenEncrypted = encryptSafe(input.refreshToken)
  if (input.accessToken && !accessTokenEncrypted) return null
  if (input.refreshToken && !refreshTokenEncrypted) return null

  const expiresAt = input.expiresIn
    ? new Date(Date.now() + input.expiresIn * 1000).toISOString()
    : null

  return {
    provider: input.provider,
    connectedAt: new Date().toISOString(),
    accountEmail: input.accountEmail ?? null,
    accessTokenEncrypted,
    refreshTokenEncrypted,
    expiresAt,
    scope: input.scope ?? null,
  }
}

export function getStorageAccessToken(storage: StorageIntegrationState | null | undefined) {
  return decryptSafe(storage?.accessTokenEncrypted)
}

export function getAiProviderApiKey(aiProvider: AiProviderIntegrationState | null | undefined) {
  return decryptSafe(aiProvider?.apiKeyEncrypted)
}




