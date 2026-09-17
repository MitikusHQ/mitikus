import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { put } from '@vercel/blob'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ convId: string }> },
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { convId } = await params

  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true, orgId: true } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const member = await db.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: convId, userId: user.id } },
  })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 413 })

  const blob = await put(`chat/${convId}/${Date.now()}-${file.name}`, file, {
    access: 'public',
    contentType: file.type || 'application/octet-stream',
  })

  // Create message with file attachment encoded in content
  const content = JSON.stringify({
    _type: 'file',
    url: blob.url,
    name: file.name,
    size: file.size,
    mime: file.type,
  })

  const message = await db.directMessage.create({
    data: { conversationId: convId, senderId: user.id, content },
    include: { sender: { select: { id: true, name: true, email: true } } },
  })

  await db.directConversation.update({ where: { id: convId }, data: { updatedAt: new Date() } })

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
            content: `📎 ${file.name}`,
          },
        },
      })
    }
  }

  return NextResponse.json({ message, url: blob.url })
}
