import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

// GET /api/team/members
// Returns all members of the current user's org with their presence
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const me = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, orgId: true },
  })
  if (!me) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const members = await db.user.findMany({
    where: { orgId: me.orgId },
    select: {
      id: true,
      name: true,
      email: true,
      presence: { select: { status: true, updatedAt: true } },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      isMe: m.id === me.id,
      status: m.presence?.status ?? 'OFFLINE',
      presenceUpdatedAt: m.presence?.updatedAt ?? null,
    })),
  })
}
