/**
 * License token para la app de escritorio MITIKUS.
 *
 * Formato: JWT manual con HMAC-SHA256 (sin dependencias externas).
 * Secret: MITIKUS_LICENSE_SECRET (mínimo 32 bytes, cualquier string).
 *
 * El token expira en 30 días. Al incrementar tokenVersion en Subscription,
 * todos los tokens emitidos anteriormente para esa org quedan inválidos.
 */

import { createHmac } from 'node:crypto'

const ALGO = 'HS256'
const TTL_SECONDS = 30 * 24 * 60 * 60 // 30 días

export interface LicensePayload {
  orgId:        string
  tier:         string  // PlanTier
  status:       string  // SubscriptionStatus efectivo
  tokenVersion: number
  iat:          number
  exp:          number
}

function getSecret(): string {
  const s = process.env.MITIKUS_LICENSE_SECRET
  if (!s || s.length < 16) {
    throw new Error('MITIKUS_LICENSE_SECRET no está configurada o es demasiado corta (mínimo 16 caracteres).')
  }
  return s
}

function b64url(value: string | Buffer): string {
  const buf = typeof value === 'string' ? Buffer.from(value, 'utf8') : value
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function b64urlDecode(value: string): Buffer {
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

function sign(header: string, payload: string, secret: string): string {
  return b64url(
    createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest()
  )
}

export function issueLicenseToken(params: {
  orgId:        string
  tier:         string
  status:       string
  tokenVersion: number
}): string {
  const secret = getSecret()
  const now = Math.floor(Date.now() / 1000)
  const header  = b64url(JSON.stringify({ alg: ALGO, typ: 'JWT' }))
  const payload = b64url(JSON.stringify({
    orgId:        params.orgId,
    tier:         params.tier,
    status:       params.status,
    tokenVersion: params.tokenVersion,
    iat: now,
    exp: now + TTL_SECONDS,
  } satisfies LicensePayload))
  const sig = sign(header, payload, secret)
  return `${header}.${payload}.${sig}`
}

export type VerifyResult =
  | { ok: true;  payload: LicensePayload }
  | { ok: false; reason: 'malformed' | 'invalid_signature' | 'expired' | 'version_mismatch' }

export function verifyLicenseToken(token: string, expectedTokenVersion: number): VerifyResult {
  const parts = token.split('.')
  if (parts.length !== 3) return { ok: false, reason: 'malformed' }

  const [header, payload, sig] = parts as [string, string, string]

  let secret: string
  try { secret = getSecret() } catch { return { ok: false, reason: 'malformed' } }

  const expectedSig = sign(header, payload, secret)
  if (sig !== expectedSig) return { ok: false, reason: 'invalid_signature' }

  let parsed: LicensePayload
  try {
    parsed = JSON.parse(b64urlDecode(payload).toString('utf8')) as LicensePayload
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  const now = Math.floor(Date.now() / 1000)
  if (parsed.exp < now) return { ok: false, reason: 'expired' }
  if (parsed.tokenVersion !== expectedTokenVersion) return { ok: false, reason: 'version_mismatch' }

  return { ok: true, payload: parsed }
}

/** Segundos que faltan para que expire el token. Negativo si ya expiró. */
export function tokenSecondsRemaining(token: string): number {
  const parts = token.split('.')
  if (parts.length !== 3) return -1
  try {
    const parsed = JSON.parse(b64urlDecode(parts[1]!).toString('utf8')) as { exp?: number }
    return (parsed.exp ?? 0) - Math.floor(Date.now() / 1000)
  } catch {
    return -1
  }
}
