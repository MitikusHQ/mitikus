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
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ results: [] })

  const base = `/workspace/${workspaceId}`

  const [docs, pdfs, contracts, notebooks] = await Promise.all([
    db.document.findMany({
      where: {
        workspaceId,
        OR: [
          { title:   { contains: q, mode: 'insensitive' } },
          { rawText: { contains: q, mode: 'insensitive' } },
        ],
      },
      take:   5,
      select: { id: true, title: true },
    }),

    db.pdf.findMany({
      where: {
        workspaceId,
        OR: [
          { title:   { contains: q, mode: 'insensitive' } },
          { rawText: { contains: q, mode: 'insensitive' } },
        ],
      },
      take:   5,
      select: { id: true, title: true },
    }),

    db.contract.findMany({
      where: {
        workspaceId,
        OR: [
          { title:      { contains: q, mode: 'insensitive' } },
          { clientName: { contains: q, mode: 'insensitive' } },
        ],
      },
      take:   5,
      select: { id: true, title: true, clientName: true, status: true },
    }),

    db.notebook.findMany({
      where: {
        workspaceId,
        title: { contains: q, mode: 'insensitive' },
      },
      take:   5,
      select: { id: true, title: true, _count: { select: { sources: true } } },
    }),
  ])

  const results = [
    ...docs.map((d) => ({
      id:    `doc-${d.id}`,
      type:  'doc' as const,
      label: d.title,
      href:  `${base}/docs/${d.id}`,
    })),
    ...pdfs.map((p) => ({
      id:    `pdf-${p.id}`,
      type:  'pdf' as const,
      label: p.title,
      href:  `${base}/pdfs/${p.id}`,
    })),
    ...contracts.map((c) => ({
      id:    `contract-${c.id}`,
      type:  'contract' as const,
      label: c.title,
      sub:   c.clientName ?? undefined,
      href:  `${base}/contracts/${c.id}`,
    })),
    ...notebooks.map((n) => ({
      id:    `notebook-${n.id}`,
      type:  'notebook' as const,
      label: n.title,
      sub:   `${n._count.sources} ${n._count.sources === 1 ? 'fuente' : 'fuentes'}`,
      href:  `${base}/notebooks/${n.id}`,
    })),
  ]

  return NextResponse.json({ results })
}
