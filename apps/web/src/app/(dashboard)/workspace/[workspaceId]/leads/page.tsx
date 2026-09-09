import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import type { LeadStatus } from '@prisma/client'
import { LeadStatusSelect } from './_components/LeadStatusSelect'
import { DeleteLeadButton } from './_components/DeleteLeadButton'

export const metadata: Metadata = { title: 'Leads - MITIKUS' }

const STATUS_LABELS: Record<string, string> = {
  NUEVO: 'Nuevo',
  CONTACTADO: 'Contactado',
  CUALIFICADO: 'Cualificado',
  PERDIDO: 'Perdido',
}

const ALL_STATUSES = ['NUEVO', 'CONTACTADO', 'CUALIFICADO', 'PERDIDO'] as const

interface Props {
  params: Promise<{ workspaceId: string }>
  searchParams: Promise<{ status?: string }>
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function LeadsPage({ params, searchParams }: Props) {
  const [{ workspaceId }, { status: statusFilter }, user] = await Promise.all([
    params,
    searchParams,
    requireUser(),
  ])

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) notFound()

  const validStatus = ALL_STATUSES.includes(statusFilter as LeadStatus) ? statusFilter as LeadStatus : undefined

  const leads = await db.workspaceLead.findMany({
    where: { workspaceId, ...(validStatus ? { status: validStatus } : {}) },
    orderBy: { createdAt: 'desc' },
  })

  const counts = await db.workspaceLead.groupBy({
    by: ['status'],
    where: { workspaceId },
    _count: true,
  })
  const countMap = Object.fromEntries(counts.map(c => [c.status, c._count]))
  const total = counts.reduce((acc, c) => acc + c._count, 0)

  const base = `/workspace/${workspaceId}/leads`

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Contactos captados a través del webhook de formularios.
        </p>
      </div>

      {/* Filtros por estado */}
      <div className="flex flex-wrap gap-2 mb-6">
        <FilterChip href={base} active={!validStatus} label="Todos" count={total} />
        {ALL_STATUSES.map(s => (
          <FilterChip
            key={s}
            href={`${base}?status=${s}`}
            active={validStatus === s}
            label={STATUS_LABELS[s]!}
            count={countMap[s] ?? 0}
          />
        ))}
      </div>

      {leads.length === 0 ? (
        <EmptyState filtered={!!validStatus} />
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contacto</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Empresa</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Mensaje</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium leading-tight">{lead.name}</div>
                    <div className="text-xs text-muted-foreground">{lead.email}</div>
                    {lead.phone && (
                      <div className="text-xs text-muted-foreground">{lead.phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {lead.company ?? '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {lead.message ? (
                      <span className="text-muted-foreground line-clamp-2 max-w-xs text-xs">{lead.message}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <LeadStatusSelect leadId={lead.id} workspaceId={workspaceId} status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell whitespace-nowrap">
                    {fmtDate(lead.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteLeadButton leadId={lead.id} workspaceId={workspaceId} leadName={lead.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FilterChip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
      }`}
    >
      {label}
      <span className={`text-xs ${active ? 'opacity-70' : 'opacity-60'}`}>{count}</span>
    </a>
  )
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="border rounded-xl p-12 text-center">
      <div className="text-3xl mb-3">📬</div>
      <h3 className="font-semibold mb-1">
        {filtered ? 'Sin leads con este estado' : 'Sin leads todavía'}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        {filtered
          ? 'Prueba con otro filtro o vuelve a la vista completa.'
          : 'Activa el webhook de formularios en Integraciones para empezar a captar leads desde Typeform, Tally o Jotform.'}
      </p>
    </div>
  )
}
