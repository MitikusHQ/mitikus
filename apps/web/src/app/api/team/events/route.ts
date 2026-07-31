import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

// GET /api/team/events?since=<isoTimestamp>
// Returns events targeted at the current user created after `since`
export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const since = req.nextUrl.searchParams.get('since')
  const sinceDate = since ? new Date(since) : new Date(Date.now() - 5000)

  const events = await db.teamEvent.findMany({
    where: { targetUserId: user.id, createdAt: { gt: sinceDate } },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })

  // Prune old events (> 5 min) to keep the table small
  void db.teamEvent.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } },
  })

  return NextResponse.json({ events, serverTime: new Date().toISOString() })
}
