import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const bodySchema = z.object({
  targetUserId: z.string(),
  type: z.enum(['call_offer', 'call_answer', 'call_ice', 'call_hangup', 'call_reject']),
  payload: z.record(z.unknown()),
})

// POST /api/team/signal
// Delivers a WebRTC signaling event to another user via TeamEvent
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const me = await db.user.findUnique({ where: { clerkId }, select: { id: true, orgId: true, name: true } })
  if (!me) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { targetUserId, type, payload } = parsed.data

  // Verify target is in the same org
  const target = await db.user.findFirst({
    where: { id: targetUserId, orgId: me.orgId },
    select: { id: true },
  })
  if (!target) return NextResponse.json({ error: 'Target not found' }, { status: 404 })

  await db.teamEvent.create({
    data: {
      targetUserId,
      orgId: me.orgId,
      type,
      payload: { ...payload, fromUserId: me.id, fromUserName: me.name },
    },
  })

  return NextResponse.json({ ok: true })
}
