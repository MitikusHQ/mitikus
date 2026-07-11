import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { workspaceId } = await params

  const actor = await db.user.findUnique({
    where:  { clerkId: userId },
    select: { orgId: true },
  })
  if (!actor) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Verify workspace belongs to actor's org
  const ws = await db.workspace.findFirst({
    where:  { id: workspaceId, orgId: actor.orgId },
    select: { id: true },
  })
  if (!ws) return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })

  const members = await db.user.findMany({
    where:  { orgId: actor.orgId },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ members })
}
