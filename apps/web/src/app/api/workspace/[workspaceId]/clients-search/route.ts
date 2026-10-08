import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  const user = await requireUser()
  const { workspaceId } = await params
  const q = req.nextUrl.searchParams.get('q') ?? ''

  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId }, select: { id: true } })
  if (!workspace) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const clients = await db.client.findMany({
    where: {
      workspaceId,
      isArchived: false,
      email: { not: null },
      ...(q ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { contactName: { contains: q, mode: 'insensitive' } },
        ],
      } : {}),
    },
    select: { id: true, name: true, email: true, contactName: true },
    orderBy: { name: 'asc' },
    take: 10,
  })

  return NextResponse.json({ clients })
}
