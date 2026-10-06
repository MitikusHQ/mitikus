import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

// GET /api/guest/host-events?token=xxx&since=ISO — host polls events from guest
export async function GET(req: NextRequest) {
  const user = await requireUser()
  const token = req.nextUrl.searchParams.get('token')
  const since = req.nextUrl.searchParams.get('since')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const room = await db.guestRoom.findUnique({ where: { token } })
  if (!room || room.hostUserId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const sinceDate = since ? new Date(since) : new Date(0)
  const serverTime = new Date().toISOString()

  const events = await db.guestEvent.findMany({
    where: {
      token,
      targetUserId: user.id,
      createdAt: { gt: sinceDate },
    },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })

  return NextResponse.json({ events, serverTime })
}
