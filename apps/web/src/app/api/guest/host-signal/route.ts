import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { z } from 'zod'

const bodySchema = z.object({
  token: z.string(),
  type: z.enum(['host_offer', 'host_answer', 'host_ice', 'host_hangup']),
  payload: z.record(z.unknown()),
})

// POST /api/guest/host-signal — authenticated host sends signal to guest
export async function POST(req: NextRequest) {
  const user = await requireUser()
  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const { token, type, payload } = parsed.data

  const room = await db.guestRoom.findUnique({ where: { token } })
  if (!room || room.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Room expired or not found' }, { status: 404 })
  }
  if (room.hostUserId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Guest polls /api/guest/events which reads TeamEvent with targetUserId = '__guest__:token'
  await db.teamEvent.create({
    data: {
      targetUserId: `__guest__:${token}`,
      orgId: room.workspaceId,
      type,
      payload: { ...payload, fromUserId: user.id, fromUserName: user.name },
    },
  })

  return NextResponse.json({ ok: true })
}
