import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { db } from '@/lib/db'
import { listAuditLogs, getAuditFilterOptions } from '@/app/actions/audit'
import type { AuditAction, AuditEntityType, AuditResult } from '@/lib/audit'
import { AuditTimeline } from './_components/AuditTimeline'
import { AuditFilters } from './_components/AuditFilters'

interface Props {
  params: Promise<{ workspaceId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function sp(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export default async function AuditPage({ params, searchParams }: Props) {
  const [{ workspaceId }, rawFilters, user] = await Promise.all([
    params,
    searchParams,
    requireUser(),
  ])

  if (!can(user, 'view_usage')) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-3">
        <p className="text-lg font-semibold">Acceso restringido</p>
        <p className="text-sm text-muted-foreground">Solo los administradores del workspace pueden ver el registro de auditoría.</p>
      </div>
    )
  }

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) notFound()

  const limit = 50
  const offset = parseInt(sp(rawFilters.offset) ?? '0', 10) || 0

  const filters = {
    action: sp(rawFilters.action) as AuditAction | undefined,
    entityType: sp(rawFilters.entityType) as AuditEntityType | undefined,
    actorUserId: sp(rawFilters.actorUserId),
    result: sp(rawFilters.result) as AuditResult | undefined,
    from: sp(rawFilters.from),
    to: sp(rawFilters.to),
  }

  const [logsResult, filterOpts] = await Promise.all([
    listAuditLogs(workspaceId, filters, limit, offset),
    getAuditFilterOptions(workspaceId),
  ])

  const logs = 'error' in logsResult ? [] : logsResult.logs
  const total = 'error' in logsResult ? 0 : logsResult.total
  const totalFailures = 'error' in logsResult ? 0 : logsResult.totalFailures
  const totalDenied = 'error' in logsResult ? 0 : logsResult.totalDenied
  const actorOptions = 'error' in filterOpts ? { actors: [] } : filterOpts

  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Auditoría</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Rastro de auditoría · {total.toLocaleString('es-ES')} eventos
          </p>
        </div>
        <a
          href={`/api/workspace/${workspaceId}/audit/export`}
          download="auditoria.csv"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar CSV
        </a>
      </div>

        {/* Filtros */}
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Filtros</h2>
          <Suspense fallback={<div className="h-9 bg-muted rounded animate-pulse w-full" />}>
            <AuditFilters options={actorOptions} />
          </Suspense>
        </section>

        {/* Stats rápidas */}
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Total eventos" value={total.toLocaleString('es-ES')} />
          <StatCard
            label="Errores"
            value={totalFailures.toLocaleString('es-ES')}
            danger
          />
          <StatCard
            label="Denegados"
            value={totalDenied.toLocaleString('es-ES')}
            warning
          />
        </div>

        {/* Timeline */}
        <section className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold">Eventos</h2>
            {total > limit && (
              <span className="text-xs text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
            )}
          </div>

          <AuditTimeline logs={logs} />

          {/* Paginación */}
          {total > limit && (
            <div className="flex justify-between pt-4 border-t border-border mt-4">
              <PaginationLink
                href={offset > 0 ? `?offset=${Math.max(0, offset - limit)}` : undefined}
                label="← Anterior"
              />
              <PaginationLink
                href={offset + limit < total ? `?offset=${offset + limit}` : undefined}
                label="Siguiente →"
              />
            </div>
          )}
        </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  danger,
  warning,
}: {
  label: string
  value: string
  danger?: boolean
  warning?: boolean
}) {
  return (
    <div className={`rounded-lg border p-4 ${danger ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : warning ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/20' : 'bg-card'}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-1 font-mono ${danger ? 'text-red-600' : warning ? 'text-amber-600' : ''}`}>{value}</p>
    </div>
  )
}

function PaginationLink({ href, label }: { href?: string; label: string }) {
  if (!href) {
    return <span className="text-sm text-muted-foreground opacity-50">{label}</span>
  }
  return (
    <Link href={href} className="text-sm text-foreground hover:underline">
      {label}
    </Link>
  )
}
