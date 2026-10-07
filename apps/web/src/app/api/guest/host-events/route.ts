import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

// GET /api/guest/host-events?since=ISO — host polls all guest events targeting them
export async function GET(req: NextRequest) {
  const user = await requireUser()
  const since = req.nextUrl.searchParams.get('since')

  const sinceDate = since ? new Date(since) : new Date(0)
  const serverTime = new Date().toISOString()

  const events = await db.guestEvent.findMany({
    where: {
      targetUserId: user.id,
      createdAt: { gt: sinceDate },
    },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })

  return NextResponse.json({ events, serverTime })
}
