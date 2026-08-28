import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()

  try {
    await db.$queryRaw`SELECT 1`
  } catch {
    return NextResponse.json(
      { status: 'error', db: 'unreachable', ts: new Date().toISOString() },
      { status: 503 },
    )
  }

  return NextResponse.json({
    status: 'ok',
    db: 'reachable',
    latencyMs: Date.now() - start,
    ts: new Date().toISOString(),
  })
}
