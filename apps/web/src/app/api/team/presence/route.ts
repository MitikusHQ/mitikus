import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const bodySchema = z.object({
  status: z.enum(['OFFLINE', 'AVAILABLE', 'BUSY', 'IN_MEETING']),
})

// PATCH /api/team/presence
// Upserts the current user's presence status
export async function PATCH(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, orgId: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const presence = await db.userPresence.upsert({
    where: { userId: user.id },
    create: { userId: user.id, orgId: user.orgId, status: parsed.data.status },
    update: { status: parsed.data.status },
  })

  return NextResponse.json({ status: presence.status })
}
