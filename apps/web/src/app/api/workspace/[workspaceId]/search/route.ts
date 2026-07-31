import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId } = await params
  const sp = req.nextUrl.searchParams

  const q            = sp.get('q')?.trim() ?? ''
  const from         = sp.get('from')         // createdAt >=
  const to           = sp.get('to')           // createdAt <=
  const modifiedFrom = sp.get('modifiedFrom') // updatedAt >=
  const modifiedTo   = sp.get('modifiedTo')   // updatedAt <=
  const types        = sp.get('types')?.split(',').filter(Boolean) // subset filter

  if (q.length < 2) return NextResponse.json({ results: [] })

  // Multi-word similarity: any word hit counts
  const words = q.split(/\s+/).filter(Boolean)

  function textOR(fields: string[]) {
    return words.flatMap((w) =>
      fields.map((f) => ({ [f]: { contains: w, mode: 'insensitive' as const } }))
    )
  }

  function dateFilter(createdField = true) {
    const filter: Record<string, unknown> = {}
    const field = createdField ? 'createdAt' : 'updatedAt'
    if (createdField) {
      if (from) filter['createdAt'] = { ...((filter['createdAt'] as object) ?? {}), gte: new Date(from) }
      if (to)   filter['createdAt'] = { ...((filter['createdAt'] as object) ?? {}), lte: new Date(`${to}T23:59:59Z`) }
    } else {
      if (modifiedFrom) filter['updatedAt'] = { ...((filter['updatedAt'] as object) ?? {}), gte: new Date(modifiedFrom) }
      if (modifiedTo)   filter['updatedAt'] = { ...((filter['updatedAt'] as object) ?? {}), lte: new Date(`${modifiedTo}T23:59:59Z`) }
    }
    return filter
  }

  // Combined date where clause
  function dateWhere() {
    const w: Record<string, unknown> = {}
    if (from || to) {
      w.createdAt = {}
      if (from) (w.createdAt as Record<string, unknown>).gte = new Date(from)
      if (to)   (w.createdAt as Record<string, unknown>).lte = new Date(`${to}T23:59:59Z`)
    }
    if (modifiedFrom || modifiedTo) {
      w.updatedAt = {}
      if (modifiedFrom) (w.updatedAt as Record<string, unknown>).gte = new Date(modifiedFrom)
      if (modifiedTo)   (w.updatedAt as Record<string, unknown>).lte = new Date(`${modifiedTo}T23:59:59Z`)
    }
    return w
  }

  const dw = dateWhere()
  const base = `/workspace/${workspaceId}`

  const shouldFetch = (type: string) => !types || types.length === 0 || types.includes(type)

  const [docs, pdfs, contracts, notebooks, sheets, presentations, tasks, missions, clients, tools, invoices] =
    await Promise.all([
      shouldFetch('doc') ? db.document.findMany({
        where: { workspaceId, OR: textOR(['title', 'rawText']), ...dw },
        take: 6, select: { id: true, title: true, createdAt: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }) : Promise.resolve([]),

      shouldFetch('pdf') ? db.pdf.findMany({
        where: { workspaceId, OR: textOR(['title', 'rawText']), ...dw },
        take: 6, select: { id: true, title: true, createdAt: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }) : Promise.resolve([]),

      shouldFetch('contract') ? db.contract.findMany({
        where: { workspaceId, OR: textOR(['title', 'clientName']), ...dw },
        take: 6, select: { id: true, title: true, clientName: true, status: true, createdAt: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }) : Promise.resolve([]),

      shouldFetch('notebook') ? db.notebook.findMany({
        where: { workspaceId, OR: textOR(['title']), ...dw },
        take: 6, select: { id: true, title: true, createdAt: true, updatedAt: true, _count: { select: { sources: true } } },
        orderBy: { updatedAt: 'desc' },
      }) : Promise.resolve([]),

      shouldFetch('sheet') ? db.spreadsheet.findMany({
        where: { workspaceId, OR: textOR(['title', 'rawText']), ...dw },
        take: 6, select: { id: true, title: true, createdAt: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }) : Promise.resolve([]),

      shouldFetch('presentation') ? db.presentation.findMany({
        where: { workspaceId, OR: textOR(['title']), ...dw },
        take: 6, select: { id: true, title: true, createdAt: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }) : Promise.resolve([]),

      shouldFetch('task') ? db.task.findMany({
        where: { workspaceId, OR: textOR(['title', 'description']), ...dw },
        take: 6, select: { id: true, title: true, status: true, createdAt: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }) : Promise.resolve([]),

      shouldFetch('mission') ? db.companyObjective.findMany({
        where: {
          workspace: { id: workspaceId },
          OR: textOR(['label', 'description']),
          ...(dw.createdAt ? { createdAt: dw.createdAt as { gte?: Date; lte?: Date } } : {}),
        },
        take: 6, select: { id: true, label: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }) : Promise.resolve([]),

      shouldFetch('client') ? db.client.findMany({
        where: { workspaceId, isArchived: false, OR: textOR(['name', 'email', 'sector']), ...dw },
        take: 6, select: { id: true, name: true, sector: true, createdAt: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }) : Promise.resolve([]),

      shouldFetch('tool') ? db.toolInstance.findMany({
        where: {
          workspaceId, status: 'ACTIVE',
          OR: textOR(['name']),
          ...(dw.createdAt ? { createdAt: dw.createdAt as { gte?: Date; lte?: Date } } : {}),
        },
        take: 6, select: { id: true, name: true, createdAt: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }) : Promise.resolve([]),

      shouldFetch('invoice') ? db.invoice.findMany({
        where: { workspaceId, OR: textOR(['number', 'notes']), ...dw },
        take: 6, select: { id: true, number: true, status: true, total: true, currency: true, createdAt: true, updatedAt: true, client: { select: { name: true } } },
        orderBy: { updatedAt: 'desc' },
      }).catch(() => []) : Promise.resolve([]),
    ])

  function fmt(d: Date) {
    return d.toISOString()
  }

  const results = [
    ...docs.map((d) => ({
      id: `doc-${d.id}`, type: 'doc' as const,
      label: d.title, href: `${base}/docs/${d.id}`,
      createdAt: fmt(d.createdAt), updatedAt: fmt(d.updatedAt),
    })),
    ...pdfs.map((p) => ({
      id: `pdf-${p.id}`, type: 'pdf' as const,
      label: p.title, href: `${base}/pdfs/${p.id}`,
      createdAt: fmt(p.createdAt), updatedAt: fmt(p.updatedAt),
    })),
    ...contracts.map((c) => ({
      id: `contract-${c.id}`, type: 'contract' as const,
      label: c.title, sub: c.clientName ?? undefined, href: `${base}/contracts/${c.id}`,
      createdAt: fmt(c.createdAt), updatedAt: fmt(c.updatedAt),
    })),
    ...notebooks.map((n) => ({
      id: `notebook-${n.id}`, type: 'notebook' as const,
      label: n.title,
      sub: `${n._count.sources} ${n._count.sources === 1 ? 'fuente' : 'fuentes'}`,
      href: `${base}/notebooks/${n.id}`,
      createdAt: fmt(n.createdAt), updatedAt: fmt(n.updatedAt),
    })),
    ...sheets.map((s) => ({
      id: `sheet-${s.id}`, type: 'sheet' as const,
      label: s.title, href: `${base}/sheets/${s.id}`,
      createdAt: fmt(s.createdAt), updatedAt: fmt(s.updatedAt),
    })),
    ...presentations.map((p) => ({
      id: `pres-${p.id}`, type: 'presentation' as const,
      label: p.title, href: `${base}/presentations/${p.id}`,
      createdAt: fmt(p.createdAt), updatedAt: fmt(p.updatedAt),
    })),
    ...tasks.map((t) => ({
      id: `task-${t.id}`, type: 'task' as const,
      label: t.title, sub: t.status, href: `${base}/tasks`,
      createdAt: fmt(t.createdAt), updatedAt: fmt(t.updatedAt),
    })),
    ...missions.map((m) => ({
      id: `mission-${m.id}`, type: 'mission' as const,
      label: m.label, sub: m.status, href: `${base}/missions/${m.id}`,
      createdAt: fmt(m.createdAt), updatedAt: fmt(m.createdAt),
    })),
    ...clients.map((c) => ({
      id: `client-${c.id}`, type: 'client' as const,
      label: c.name, sub: c.sector ?? undefined, href: `${base}/clients/${c.id}`,
      createdAt: fmt(c.createdAt), updatedAt: fmt(c.updatedAt),
    })),
    ...tools.map((t) => ({
      id: `tool-${t.id}`, type: 'tool' as const,
      label: t.name, href: `${base}/tools/${t.id}`,
      createdAt: fmt(t.createdAt), updatedAt: fmt(t.updatedAt),
    })),
    ...(invoices as Array<{ id: string; number: string; status: string; total: number; currency: string; createdAt: Date; updatedAt: Date; client: { name: string } | null }>).map((i) => ({
      id: `invoice-${i.id}`, type: 'invoice' as const,
      label: i.number,
      sub: i.client?.name ?? undefined,
      href: `${base}/invoices`,
      createdAt: fmt(i.createdAt), updatedAt: fmt(i.updatedAt),
    })),
  ]

  return NextResponse.json({ results })
}
