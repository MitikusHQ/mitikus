import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

function buildRatelimit(): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  try {
    return new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      }),
      limiter: Ratelimit.slidingWindow(60, '60 s'),
      analytics: false,
      prefix: 'mitikus_rl',
    })
  } catch {
    return null
  }
}

export const ratelimit = buildRatelimit()
