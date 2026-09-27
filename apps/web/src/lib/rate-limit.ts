import { NextResponse } from 'next/server'

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, '')
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return { url, token }
}

function getIp(req: Request): string {
  const xff = (req as { headers: Headers }).headers.get('x-forwarded-for')
  return xff?.split(',')[0]?.trim() ?? '127.0.0.1'
}

function sanitizeKeyPart(value: string) {
  return value.replace(/[^a-zA-Z0-9:_@.-]/g, '_').slice(0, 160)
}

async function incrementFixedWindow(key: string, windowSeconds: number) {
  const config = getUpstashConfig()
  if (!config) return null

  const response = await fetch(`${config.url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, windowSeconds],
    ]),
    cache: 'no-store',
  })

  if (!response.ok) return null

  const data = await response.json() as Array<{ result?: unknown }>
  const count = Number(data[0]?.result ?? 0)
  return Number.isFinite(count) ? count : null
}

/**
 * Aplica rate limiting. Devuelve NextResponse 429 si se supera el límite,
 * o null si la petición puede continuar.
 *
 * Si Upstash no está configurado, deja pasar (fail-open).
 */
export async function rateLimit(
  req: Request,
  context: string,
  requests: number,
  windowSeconds: number,
  identifier?: string,
): Promise<NextResponse | null> {
  const id = identifier ?? getIp(req)
  const windowId = Math.floor(Date.now() / (windowSeconds * 1000))
  const reset = (windowId + 1) * windowSeconds * 1000
  const key = `mitikus:rl:${sanitizeKeyPart(context)}:${sanitizeKeyPart(id)}:${windowId}`
  const count = await incrementFixedWindow(key, windowSeconds)

  if (count === null) return null // sin Redis o error temporal -> fail-open

  if (count > requests) {
    return NextResponse.json(
      { error: 'Demasiadas peticiones. Inténtalo de nuevo más tarde.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit':     String(requests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset':     String(reset),
          'Retry-After':           String(Math.ceil((reset - Date.now()) / 1000)),
        },
      },
    )
  }

  return null
}
