import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/guest/room?token=xxx — public endpoint: returns room info for the guest page
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const room = await db.guestRoom.findUnique({
    where: { token },
    select: {
      token: true,
      label: true,
      expiresAt: true,
      hostUserId: true,
    },
  })

  if (!room || room.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Room expired or not found' }, { status: 404 })
  }

  return NextResponse.json({ room })
}
