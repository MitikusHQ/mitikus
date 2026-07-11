import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

interface SearchResult {
  id:       string
  type:     'tool' | 'client' | 'mission' | 'execution'
  label:    string
  sub?:     string
  href:     string
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId } = await params
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) return NextResponse.json({ results: [] })

  // Verify workspace belongs to user's org
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { orgId: true },
  })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })

  const base = `/workspace/${workspaceId}`

  const [tools, clients, missions, executions] = await Promise.all([
    db.toolInstance.findMany({
      where: {
        workspaceId,
        status: 'ACTIVE',
        name: { contains: q, mode: 'insensitive' },
      },
      select: { id: true, name: true, toolDefinition: { select: { name: true } } },
      take: 5,
    }),

    db.client.findMany({
      where: {
        workspaceId,
        isArchived: false,
        name: { contains: q, mode: 'insensitive' },
      },
      select: { id: true, name: true, sector: true },
      take: 5,
    }),

    db.companyObjective.findMany({
      where: {
        workspaceId,
        status: { in: ['active', 'in_progress'] },
        label: { contains: q, mode: 'insensitive' },
      },
      select: { id: true, label: true, priority: true },
      take: 4,
    }),

    db.toolExecution.findMany({
      where: {
        workspaceId,
        status: 'COMPLETED',
        toolInstance: { name: { contains: q, mode: 'insensitive' } },
      },
      select: {
        id: true,
        createdAt: true,
        toolInstance: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
  ])

  const results: SearchResult[] = [
    ...tools.map((t) => ({
      id:    t.id,
      type:  'tool' as const,
      label: t.name,
      sub:   t.toolDefinition.name,
      href:  `${base}/tools/${t.id}/run`,
    })),
    ...clients.map((c) => ({
      id:    c.id,
      type:  'client' as const,
      label: c.name,
      sub:   c.sector ?? undefined,
      href:  `${base}/clients/${c.id}`,
    })),
    ...missions.map((m) => ({
      id:    m.id,
      type:  'mission' as const,
      label: m.label,
      sub:   m.priority,
      href:  `${base}/missions/${m.id}`,
    })),
    ...executions.map((e) => ({
      id:    e.id,
      type:  'execution' as const,
      label: e.toolInstance.name,
      sub:   new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(e.createdAt),
      href:  `${base}/tools/${e.toolInstance.id}/history/${e.id}`,
    })),
  ]

  return NextResponse.json({ results })
}
