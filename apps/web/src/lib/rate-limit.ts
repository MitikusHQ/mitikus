import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

function makeRedis() {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

const redis = makeRedis()

// Límites por contexto
const limiters: Record<string, Ratelimit | null> = {}

function getLimiter(key: string, requests: number, windowSeconds: number): Ratelimit | null {
  if (!redis) return null
  if (!limiters[key]) {
    limiters[key] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
      prefix: `mitikus:rl:${key}`,
    })
  }
  return limiters[key]
}

function getIp(req: Request): string {
  const xff = (req as { headers: Headers }).headers.get('x-forwarded-for')
  return xff?.split(',')[0]?.trim() ?? '127.0.0.1'
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
  const limiter = getLimiter(context, requests, windowSeconds)
  if (!limiter) return null  // sin Redis → fail-open

  const id = identifier ?? getIp(req)
  const { success, limit, remaining, reset } = await limiter.limit(id)

  if (!success) {
    return NextResponse.json(
      { error: 'Demasiadas peticiones. Inténtalo de nuevo más tarde.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit':     String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset':     String(reset),
          'Retry-After':           String(Math.ceil((reset - Date.now()) / 1000)),
        },
      },
    )
  }
  return null
}
