import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

const PAGE_SIZE = 40

async function getActor() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null
  return db.user.findUnique({
    where:  { clerkId },
    select: { id: true, orgId: true, name: true },
  })
}

// GET /api/org/feed?cursor=<cuid>  — latest messages, paginated
export async function GET(req: NextRequest) {
  const actor = await getActor()
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cursor = req.nextUrl.searchParams.get('cursor') ?? undefined

  const messages = await db.orgMessage.findMany({
    where:   { orgId: actor.orgId },
    orderBy: { createdAt: 'desc' },
    take:    PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id:        true,
      content:   true,
      createdAt: true,
      editedAt:  true,
      sender: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  })

  const hasMore = messages.length > PAGE_SIZE
  if (hasMore) messages.pop()

  return NextResponse.json({
    messages: messages.reverse(), // chronological for the client
    nextCursor: hasMore ? messages[0]?.id : null,
  })
}

// POST /api/org/feed  — send a message
export async function POST(req: NextRequest) {
  const actor = await getActor()
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await req.json() as { content?: string }
  if (!content?.trim()) {
    return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 })
  }

  const message = await db.orgMessage.create({
    data: { orgId: actor.orgId, senderId: actor.id, content: content.trim() },
    select: {
      id:        true,
      content:   true,
      createdAt: true,
      editedAt:  true,
      sender: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  })

  return NextResponse.json({ message }, { status: 201 })
}
