import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/guest/events?token=xxx&since=ISO — poll events sent by host to guest
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const since = req.nextUrl.searchParams.get('since')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const room = await db.guestRoom.findUnique({ where: { token } })
  if (!room || room.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Room expired or not found' }, { status: 404 })
  }

  const sinceDate = since ? new Date(since) : new Date(0)
  const serverTime = new Date().toISOString()

  // host → guest: stored in TeamEvent with targetUserId === '__guest__:' + token
  const events = await db.teamEvent.findMany({
    where: {
      targetUserId: `__guest__:${token}`,
      createdAt: { gt: sinceDate },
    },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })

  return NextResponse.json({ events, serverTime })
}
