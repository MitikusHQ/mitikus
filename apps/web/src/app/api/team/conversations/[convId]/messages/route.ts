import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { z } from 'zod'

async function getAuthorizedUser(clerkId: string, convId: string) {
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true, orgId: true } })
  if (!user) return null
  const member = await db.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: convId, userId: user.id } },
  })
  if (!member) return null
  return user
}

// GET /api/team/conversations/[convId]/messages?before=<cursor>&limit=50
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ convId: string }> },
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { convId } = await params
  const user = await getAuthorizedUser(clerkId, convId)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const before = req.nextUrl.searchParams.get('before')
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? '50'), 100)

  const messages = await db.directMessage.findMany({
    where: {
      conversationId: convId,
      deletedAt: null,
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { sender: { select: { id: true, name: true, email: true } } },
  })

  // Update lastReadAt
  void db.conversationMember.update({
    where: { conversationId_userId: { conversationId: convId, userId: user.id } },
    data: { lastReadAt: new Date() },
  })

  return NextResponse.json({ messages: messages.reverse() })
}

const sendSchema = z.object({ content: z.string().min(1).max(4000) })

// POST /api/team/conversations/[convId]/messages
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ convId: string }> },
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { convId } = await params
  const user = await getAuthorizedUser(clerkId, convId)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = sendSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const message = await db.directMessage.create({
    data: { conversationId: convId, senderId: user.id, content: parsed.data.content },
    include: { sender: { select: { id: true, name: true, email: true } } },
  })

  // Update conversation updatedAt
  await db.directConversation.update({
    where: { id: convId },
    data: { updatedAt: new Date() },
  })

  // Get the other member to deliver a new_message event
  const members = await db.conversationMember.findMany({ where: { conversationId: convId } })
  const otherMember = members.find((m) => m.userId !== user.id)
  if (otherMember) {
    const conv = await db.directConversation.findUnique({ where: { id: convId }, select: { orgId: true } })
    if (conv) {
      await db.teamEvent.create({
        data: {
          targetUserId: otherMember.userId,
          orgId: conv.orgId,
          type: 'new_message',
          payload: {
            conversationId: convId,
            messageId: message.id,
            senderId: user.id,
            senderName: message.sender.name,
            content: parsed.data.content.slice(0, 100),
          },
        },
      })
    }
  }

  return NextResponse.json({ message })
}
