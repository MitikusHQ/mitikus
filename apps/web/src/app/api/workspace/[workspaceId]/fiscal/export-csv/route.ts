import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { listFiscalDeclarations } from '@/app/actions/fiscal-declarations'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const declarations = await listFiscalDeclarations(workspaceId)

  const header = ['ID', 'Modelo', 'Periodo', 'Año', 'Resultado (€)', 'Estado', 'Creado'].join(',')
  const rows = declarations.map((d) =>
    [
      d.id,
      d.modelo,
      d.periodo,
      d.year,
      d.resultado.toFixed(2),
      d.status,
      d.createdAt.toISOString().slice(0, 10),
    ].join(','),
  )
  const csv = [header, ...rows].join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="fiscal-historial-${workspaceId}.csv"`,
    },
  })
}
