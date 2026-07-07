import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VERSION = '0.5.5'

interface HealthCheck {
  ok: boolean
  latencyMs?: number
  error?: string
}

export async function GET() {
  const start = Date.now()
  const checks: Record<string, HealthCheck> = {}

  // ── DB check ──────────────────────────────────────────────────────────────
  try {
    await db.$queryRaw`SELECT 1`
    checks.database = { ok: true, latencyMs: Date.now() - start }
  } catch (err) {
    checks.database = {
      ok: false,
      error: err instanceof Error ? err.message : 'DB unreachable',
    }
  }

  // ── AI config check ───────────────────────────────────────────────────────
  checks.ai = {
    ok: Boolean(process.env.ANTHROPIC_API_KEY),
    ...(process.env.ANTHROPIC_API_KEY ? {} : { error: 'ANTHROPIC_API_KEY not set' }),
  }

  // ── Auth config check ─────────────────────────────────────────────────────
  checks.auth = {
    ok: Boolean(process.env.CLERK_SECRET_KEY) && Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
    ...((!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
      ? { error: 'Clerk keys not configured' }
      : {}),
  }

  const allOk = Object.values(checks).every((c) => c.ok)
  const status = allOk ? 'ok' : 'degraded'

  return NextResponse.json(
    { status, version: VERSION, checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 },
  )
}
