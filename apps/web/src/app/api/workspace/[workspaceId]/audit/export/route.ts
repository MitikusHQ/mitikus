import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { db } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params
  const user = await requireUser().catch(() => null)
  if (!user || !can(user, 'view_usage')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const logs = await db.auditLog.findMany({
    where: { orgId: user.orgId, workspaceId },
    orderBy: { createdAt: 'desc' },
    take: 10_000,
    include: { actorUser: { select: { name: true, email: true } } },
  })

  const header = ['fecha', 'usuario', 'email', 'accion', 'entidad', 'entidadId', 'resultado', 'metadata']
  const rows = logs.map((l) => [
    l.createdAt.toISOString(),
    l.actorUser?.name ?? '',
    l.actorUser?.email ?? '',
    l.action,
    l.entityType,
    l.entityId ?? '',
    l.result,
    l.metadata ? JSON.stringify(l.metadata) : '',
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))

  const csv = [header.join(','), ...rows].join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="auditoria-${workspaceId}.csv"`,
    },
  })
}
