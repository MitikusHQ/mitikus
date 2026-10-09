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

// In-memory fallback — per-instance only (adequate for serverless cold-start isolation)
const memStore = new Map<string, { count: number; resetAt: number }>()

function incrementInMemory(key: string, windowSeconds: number): number {
  const now = Date.now()
  const entry = memStore.get(key)
  if (!entry || now >= entry.resetAt) {
    const resetAt = now + windowSeconds * 1000
    memStore.set(key, { count: 1, resetAt })
    // Evict expired keys to avoid unbounded growth
    if (memStore.size > 5000) {
      for (const [k, v] of memStore) {
        if (now >= v.resetAt) memStore.delete(k)
      }
    }
    return 1
  }
  entry.count += 1
  return entry.count
}

async function incrementFixedWindow(key: string, windowSeconds: number): Promise<number | null> {
  const config = getUpstashConfig()
  if (!config) return null

  try {
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
  } catch {
    return null
  }
}

/**
 * Aplica rate limiting. Devuelve NextResponse 429 si se supera el límite, null si puede continuar.
 *
 * Intenta Upstash Redis; si no está disponible cae a un contador en memoria (fail-closed).
 * El fallback en memoria es per-instancia — suficiente para serverless, no distribuido.
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

  let count = await incrementFixedWindow(key, windowSeconds)

  if (count === null) {
    // Upstash not configured or temporarily down — use in-memory fallback (fail-closed)
    if (process.env.NODE_ENV === 'production' && getUpstashConfig()) {
      // Upstash is configured but errored — log and fall back to memory
      console.warn(`[rate-limit] Upstash error on key=${key}, falling back to in-memory counter`)
    }
    count = incrementInMemory(key, windowSeconds)
  }

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
