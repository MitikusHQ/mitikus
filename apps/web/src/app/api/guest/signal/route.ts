import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const bodySchema = z.object({
  token: z.string(),
  targetUserId: z.string(),
  senderName: z.string().max(80).optional(),
  type: z.enum(['guest_offer', 'guest_answer', 'guest_ice', 'guest_hangup']),
  payload: z.record(z.unknown()),
})

// POST /api/guest/signal — unauthenticated WebRTC signaling via guest room token
export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const { token, targetUserId, senderName, type, payload } = parsed.data

  const room = await db.guestRoom.findUnique({ where: { token } })
  if (!room || room.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Room expired or not found' }, { status: 404 })
  }

  await db.guestEvent.create({
    data: {
      token,
      targetUserId,
      type,
      payload: { ...payload, fromUserName: senderName ?? 'Invitado', guestToken: token },
    },
  })

  return NextResponse.json({ ok: true })
}
