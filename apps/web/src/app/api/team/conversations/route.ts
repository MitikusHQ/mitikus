import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// GET /api/team/conversations
// Returns conversations the current user is a member of
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const me = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!me) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const memberships = await db.conversationMember.findMany({
    where: { userId: me.id },
    include: {
      conversation: {
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      },
    },
    orderBy: { conversation: { updatedAt: 'desc' } },
  })

  const conversations = memberships.map((m) => {
    const other = m.conversation.members.find((mb) => mb.userId !== me.id)
    const lastMsg = m.conversation.messages[0]
    return {
      id: m.conversation.id,
      peer: other ? { id: other.user.id, name: other.user.name, email: other.user.email } : null,
      lastMessage: lastMsg
        ? { content: lastMsg.content, createdAt: lastMsg.createdAt, senderId: lastMsg.senderId }
        : null,
      lastReadAt: m.lastReadAt,
      updatedAt: m.conversation.updatedAt,
    }
  })

  return NextResponse.json({ conversations })
}

const createSchema = z.object({ peerId: z.string() })

// POST /api/team/conversations
// Gets or creates a 1:1 conversation with peerId
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const me = await db.user.findUnique({ where: { clerkId }, select: { id: true, orgId: true } })
  if (!me) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { peerId } = parsed.data

  // Find existing conversation between the two users in the same org
  const existing = await db.directConversation.findFirst({
    where: {
      orgId: me.orgId,
      members: { every: { userId: { in: [me.id, peerId] } } },
    },
    include: { members: true },
  })

  if (existing && existing.members.length === 2) {
    return NextResponse.json({ conversationId: existing.id })
  }

  const conv = await db.directConversation.create({
    data: {
      orgId: me.orgId,
      members: {
        create: [{ userId: me.id }, { userId: peerId }],
      },
    },
  })

  return NextResponse.json({ conversationId: conv.id })
}
