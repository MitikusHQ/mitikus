import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

interface RouteContext {
  params: Promise<{ workspaceId: string }>
}

// GET /api/workspace/[workspaceId]/guest-rooms — list active rooms
export async function GET(_req: NextRequest, context: RouteContext) {
  const { workspaceId } = await context.params
  const user = await requireUser()

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const rooms = await db.guestRoom.findMany({
    where: { workspaceId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ rooms })
}

// POST /api/workspace/[workspaceId]/guest-rooms — create room
export async function POST(req: NextRequest, context: RouteContext) {
  const { workspaceId } = await context.params
  const user = await requireUser()

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json() as { label?: string; expiresInHours?: number }
  const expiresInHours = body.expiresInHours ?? 24
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)

  const room = await db.guestRoom.create({
    data: {
      workspaceId,
      hostUserId: user.id,
      label: body.label?.trim() || null,
      expiresAt,
    },
  })

  return NextResponse.json({ room })
}

// DELETE /api/workspace/[workspaceId]/guest-rooms?token=xxx — revoke room
export async function DELETE(req: NextRequest, context: RouteContext) {
  const { workspaceId } = await context.params
  const user = await requireUser()
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.guestRoom.deleteMany({ where: { token, workspaceId } })
  return NextResponse.json({ ok: true })
}
