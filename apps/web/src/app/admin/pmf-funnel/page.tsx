import { requireUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'PMF Funnel — MITIKUS Admin' }

const SUPERADMIN_EMAILS = (process.env.SUPERADMIN_EMAILS ?? 'borjaprietomark82@gmail.com')
  .split(',')
  .map((e) => e.trim())

const PMF_EVENTS = [
  'pmf.workspace.created',
  'pmf.fiscal.completed',
  'pmf.client.created',
  'pmf.invoice.created',
  'pmf.invoice.emitted',
  'pmf.invoice.sent',
  'pmf.invoice.pdf.downloaded',
] as const

const FRICTION_REASON_LABEL: Record<string, string> = {
  'no-entiendo': 'No entiende el siguiente paso',
  'sin-datos':   'No tiene los datos a mano',
  'sin-prisa':   'No quiere emitir facturas todavía',
  'explorando':  'Solo está explorando',
  'otro':        'Otro',
}

const EVENT_LABEL: Record<string, string> = {
  'pmf.workspace.created':        'Workspace creado',
  'pmf.fiscal.completed':         'Fiscal configurado',
  'pmf.client.created':           'Cliente creado',
  'pmf.invoice.created':          'Factura creada',
  'pmf.invoice.emitted':          'Factura emitida',
  'pmf.invoice.sent':             'Factura enviada',
  'pmf.invoice.pdf.downloaded':   'PDF descargado',
}

// Cada paso muestra: orgs que hicieron `from` → % que también hicieron `to`
const FUNNEL_STEPS: Array<{ from: string; to: string; label: string }> = [
  { from: 'pmf.workspace.created',  to: 'pmf.fiscal.completed',       label: 'Workspace → Fiscal' },
  { from: 'pmf.fiscal.completed',   to: 'pmf.client.created',         label: 'Fiscal → Cliente' },
  { from: 'pmf.client.created',     to: 'pmf.invoice.created',        label: 'Cliente → Factura' },
  { from: 'pmf.invoice.created',    to: 'pmf.invoice.emitted',        label: 'Factura → Emitida' },
  { from: 'pmf.invoice.emitted',    to: 'pmf.invoice.sent',           label: 'Emitida → Enviada' },
  { from: 'pmf.invoice.emitted',    to: 'pmf.invoice.pdf.downloaded', label: 'Emitida → PDF' },
]

type Period = '7d' | '30d' | 'all'

function sinceDate(period: Period): Date | null {
  if (period === 'all') return null
  const d = new Date()
  d.setDate(d.getDate() - (period === '7d' ? 7 : 30))
  return d
}

type RawCount = { action: string; orgs: bigint; events: bigint }

async function getMetrics(period: Period) {
  const since = sinceDate(period)

  // COUNT(DISTINCT "orgId") por evento — cohort real
  const countRows: RawCount[] = since
    ? await db.$queryRaw`
        SELECT action,
               COUNT(DISTINCT "orgId") AS orgs,
               COUNT(*) AS events
        FROM   "AuditLog"
        WHERE  action = ANY(${PMF_EVENTS as unknown as string[]})
          AND  "createdAt" >= ${since}
        GROUP  BY action
      `
    : await db.$queryRaw`
        SELECT action,
               COUNT(DISTINCT "orgId") AS orgs,
               COUNT(*) AS events
        FROM   "AuditLog"
        WHERE  action = ANY(${PMF_EVENTS as unknown as string[]})
        GROUP  BY action
      `

  const orgMap: Record<string, number> = {}
  const evMap: Record<string, number> = {}
  for (const row of countRows) {
    orgMap[row.action] = Number(row.orgs)
    evMap[row.action]  = Number(row.events)
  }

  // Pasos de cohort: orgs que hicieron AMBOS eventos (intersección por orgId)
  const stepCounts: Record<string, { fromOrgs: number; toOrgs: number }> = {}
  await Promise.all(
    FUNNEL_STEPS.map(async ({ from, to }) => {
      const key = `${from}→${to}`
      const rows: Array<{ cnt: bigint }> = since
        ? await db.$queryRaw`
            SELECT COUNT(DISTINCT a."orgId") AS cnt
            FROM   "AuditLog" a
            WHERE  a.action = ${from}
              AND  a."createdAt" >= ${since}
              AND  EXISTS (
                SELECT 1 FROM "AuditLog" b
                WHERE b."orgId" = a."orgId"
                  AND b.action = ${to}
                  AND b."createdAt" >= ${since}
              )
          `
        : await db.$queryRaw`
            SELECT COUNT(DISTINCT a."orgId") AS cnt
            FROM   "AuditLog" a
            WHERE  a.action = ${from}
              AND  EXISTS (
                SELECT 1 FROM "AuditLog" b
                WHERE b."orgId" = a."orgId"
                  AND b.action = ${to}
              )
          `
      stepCounts[key] = {
        fromOrgs: orgMap[from] ?? 0,
        toOrgs:   Number(rows[0]?.cnt ?? 0),
      }
    }),
  )

  // Fricciones: conteo por reason + últimos eventos
  type FrictionCount = { reason: string; cnt: bigint }
  const frictionCounts: FrictionCount[] = since
    ? await db.$queryRaw`
        SELECT metadata->>'reason' AS reason, COUNT(*) AS cnt
        FROM "AuditLog"
        WHERE action = 'pmf.onboarding.blocked'
          AND "createdAt" >= ${since}
          AND metadata->>'reason' IS NOT NULL
        GROUP BY metadata->>'reason'
        ORDER BY cnt DESC
      `
    : await db.$queryRaw`
        SELECT metadata->>'reason' AS reason, COUNT(*) AS cnt
        FROM "AuditLog"
        WHERE action = 'pmf.onboarding.blocked'
          AND metadata->>'reason' IS NOT NULL
        GROUP BY metadata->>'reason'
        ORDER BY cnt DESC
      `

  const recentFrictions = await db.auditLog.findMany({
    where: {
      action: 'pmf.onboarding.blocked',
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, orgId: true, metadata: true, createdAt: true },
  })

  // Eventos recientes
  const recent = await db.auditLog.findMany({
    where: {
      action: { in: PMF_EVENTS as unknown as string[] },
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      action: true,
      workspaceId: true,
      orgId: true,
      metadata: true,
      createdAt: true,
    },
  })

  return { orgMap, evMap, stepCounts, frictionCounts, recentFrictions, recent }
}

export default async function PmfFunnelPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const user = await requireUser()
  if (!SUPERADMIN_EMAILS.includes(user.email)) notFound()

  const { period: rawPeriod } = await searchParams
  const period: Period = rawPeriod === '7d' || rawPeriod === '30d' ? rawPeriod : 'all'

  const { orgMap, evMap, stepCounts, frictionCounts, recentFrictions, recent } = await getMetrics(period)
  const totalOrgs = orgMap['pmf.workspace.created'] ?? 0
  const totalEvents = Object.values(evMap).reduce((s, n) => s + n, 0)

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
      {/* Cabecera */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold">PMF Funnel</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Solo visible para superadmins · Cohort por <code className="text-xs bg-muted px-1 rounded">orgId</code>
          </p>
        </div>
        <PeriodFilter current={period} />
      </div>

      {/* Estado vacío */}
      {totalEvents === 0 && (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground text-sm">
          No hay eventos PMF en el periodo seleccionado.
          <br />
          Los eventos se registran cuando los usuarios completan acciones clave.
        </div>
      )}

      {totalEvents > 0 && (
        <>
          {/* Resumen cohort */}
          <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-card p-6 flex flex-wrap gap-8 items-center">
            <div className="text-center">
              <p className="text-4xl font-black text-primary tabular-nums">{totalOrgs}</p>
              <p className="text-xs text-muted-foreground mt-1">Orgs en el funnel</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black tabular-nums">{orgMap['pmf.invoice.created'] ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Orgs con factura</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black tabular-nums">{orgMap['pmf.invoice.emitted'] ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Orgs con factura emitida</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black tabular-nums">{totalEvents}</p>
              <p className="text-xs text-muted-foreground mt-1">Eventos totales</p>
            </div>
          </div>

          {/* KPIs por evento: orgs únicas */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Orgs únicas por paso
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PMF_EVENTS.map((ev) => (
                <KpiCard
                  key={ev}
                  label={EVENT_LABEL[ev] ?? ev}
                  value={orgMap[ev] ?? 0}
                  sub={`${evMap[ev] ?? 0} eventos`}
                />
              ))}
            </div>
          </section>

          {/* Conversión por cohort */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Conversión por cohort (orgs únicas que completaron ambos pasos)
            </h2>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Paso</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Orgs inicio</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Orgs que avanzaron</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Conversión</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {FUNNEL_STEPS.map(({ from, to, label }) => {
                    const { fromOrgs, toOrgs } = stepCounts[`${from}→${to}`] ?? { fromOrgs: 0, toOrgs: 0 }
                    const pct = fromOrgs > 0 ? Math.round((toOrgs / fromOrgs) * 100) : null
                    return (
                      <tr key={`${from}-${to}`} className="bg-card">
                        <td className="px-4 py-2.5 font-medium">{label}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fromOrgs}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{toOrgs}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {pct === null ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span className={
                              pct >= 50 ? 'text-green-600 dark:text-green-400 font-semibold'
                              : pct >= 20 ? 'text-yellow-600 dark:text-yellow-400 font-semibold'
                              : 'text-red-600 dark:text-red-400 font-semibold'
                            }>
                              {pct}%
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              «Orgs que avanzaron» = orgs que hicieron el paso origen <em>y también</em> el paso destino, en el mismo periodo.
            </p>
          </section>

          {/* Fricciones */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Fricciones del onboarding — ¿Estoy bloqueado?
            </h2>
            {frictionCounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin fricciones registradas en este periodo.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {frictionCounts.map((f) => (
                    <KpiCard
                      key={f.reason}
                      label={FRICTION_REASON_LABEL[f.reason] ?? f.reason}
                      value={Number(f.cnt)}
                    />
                  ))}
                </div>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Fecha</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Org</th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">Razón</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recentFrictions.map((f) => {
                        const reason = typeof f.metadata === 'object' && f.metadata
                          ? (f.metadata as Record<string, unknown>)['reason']
                          : null
                        return (
                          <tr key={f.id} className="bg-card">
                            <td className="px-4 py-2 tabular-nums text-muted-foreground whitespace-nowrap">
                              {f.createdAt.toLocaleString('es-ES', {
                                day: '2-digit', month: '2-digit', year: '2-digit',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </td>
                            <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                              {f.orgId.slice(0, 12)}…
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {typeof reason === 'string'
                                ? (FRICTION_REASON_LABEL[reason] ?? reason)
                                : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          {/* Eventos recientes */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Eventos recientes (últimos 50)
            </h2>
            <div className="rounded-lg border overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Evento</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Org</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Info</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recent.map((row) => (
                    <tr key={row.id} className="bg-card">
                      <td className="px-4 py-2 tabular-nums text-muted-foreground whitespace-nowrap">
                        {row.createdAt.toLocaleString('es-ES', {
                          day: '2-digit', month: '2-digit', year: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-2 font-medium whitespace-nowrap">
                        {EVENT_LABEL[row.action] ?? row.action}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                        {row.orgId.slice(0, 12)}…
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {safeMetadata(row.metadata)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function KpiCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-1 leading-tight">{label}</p>
      <p className="text-2xl font-black tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

function PeriodFilter({ current }: { current: Period }) {
  const options: Array<{ value: Period; label: string }> = [
    { value: '7d',  label: '7 días' },
    { value: '30d', label: '30 días' },
    { value: 'all', label: 'Todo' },
  ]
  return (
    <div className="flex gap-1 rounded-lg border bg-muted p-1">
      {options.map(({ value, label }) => (
        <a
          key={value}
          href={`/admin/pmf-funnel?period=${value}`}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            current === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {label}
        </a>
      ))}
    </div>
  )
}

function safeMetadata(raw: unknown): string {
  if (!raw || typeof raw !== 'object') return '—'
  const allowed = ['sector', 'clientType', 'total', 'currency']
  const entries: string[] = []
  for (const key of allowed) {
    const val = (raw as Record<string, unknown>)[key]
    if (val !== undefined && val !== null) entries.push(`${key}: ${val}`)
  }
  return entries.length ? entries.join(' · ') : '—'
}
