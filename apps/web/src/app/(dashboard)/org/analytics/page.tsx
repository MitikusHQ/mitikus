import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { can } from '@/lib/permissions'
import { formatCostEUR } from '@/lib/ai-cost'

export const dynamic = 'force-dynamic'

// ── Helpers ───────────────────────────────────────────────────────

function fmtMs(ms: number) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

function fmtTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

// ── Stat card ─────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

// ── Inline bar chart (SVG, no deps) ───────────────────────────────

function MiniBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const W = 540
  const H = 80
  const barW = Math.floor((W - (data.length - 1) * 3) / data.length)

  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} width="100%" className="overflow-visible">
      {data.map((d, i) => {
        const h = Math.max(2, Math.round((d.value / max) * H))
        const x = i * (barW + 3)
        const y = H - h
        return (
          <g key={d.label}>
            <rect
              x={x} y={y} width={barW} height={h}
              rx="2"
              className="fill-primary/70"
            />
            {data.length <= 14 && (
              <text
                x={x + barW / 2} y={H + 14}
                textAnchor="middle"
                fontSize="9"
                className="fill-muted-foreground"
              >
                {d.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const user = await requireUser()
  if (!can(user, 'view_usage')) redirect('/org')

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Todos los workspaces de la org
  const workspaces = await db.workspace.findMany({
    where: { orgId: user.orgId },
    select: { id: true, name: true },
  })
  const workspaceIds = workspaces.map((w) => w.id)

  if (workspaceIds.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 text-center text-muted-foreground text-sm">
        Sin workspaces aún.
      </div>
    )
  }

  // ── Queries en paralelo ───────────────────────────────────────────
  const [
    executions30d,
    topToolsRaw,
    topUsersRaw,
    workspaceStatsRaw,
    avgDuration,
  ] = await Promise.all([
    // Todas las ejecuciones de los últimos 30 días con fecha
    db.toolExecution.findMany({
      where: { workspaceId: { in: workspaceIds }, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, estimatedCostEUR: true, status: true },
      orderBy: { createdAt: 'asc' },
    }),

    // Top herramientas por ejecuciones
    db.toolExecution.groupBy({
      by: ['toolInstanceId'],
      where: { workspaceId: { in: workspaceIds }, createdAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
      _sum:   { estimatedCostEUR: true },
      orderBy: { _count: { id: 'desc' } },
      take: 8,
    }),

    // Top usuarios por ejecuciones
    db.toolExecution.groupBy({
      by: ['userId'],
      where: { workspaceId: { in: workspaceIds }, createdAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
      _sum:   { estimatedCostEUR: true },
      orderBy: { _count: { id: 'desc' } },
      take: 6,
    }),

    // Ejecuciones y coste por workspace
    db.toolExecution.groupBy({
      by: ['workspaceId'],
      where: { workspaceId: { in: workspaceIds }, createdAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
      _sum:   { estimatedCostEUR: true, inputTokens: true, outputTokens: true },
    }),

    // Duración media de ejecuciones completadas
    db.toolExecution.aggregate({
      where: {
        workspaceId: { in: workspaceIds },
        status: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo },
        durationMs: { gt: 0 },
      },
      _avg: { durationMs: true },
    }),
  ])

  // ── Enriquecer top tools con nombre ──────────────────────────────
  const instanceIds = topToolsRaw.map((t) => t.toolInstanceId)
  const instances = await db.toolInstance.findMany({
    where: { id: { in: instanceIds } },
    select: { id: true, name: true },
  })
  const instanceMap = new Map(instances.map((i) => [i.id, i.name]))

  const topTools = topToolsRaw.map((t) => ({
    name:  instanceMap.get(t.toolInstanceId) ?? t.toolInstanceId.slice(0, 8),
    count: t._count.id,
    cost:  Number(t._sum.estimatedCostEUR ?? 0),
  }))

  // ── Enriquecer top users con nombre ──────────────────────────────
  const userIds = topUsersRaw.map((u) => u.userId)
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  })
  const userMap = new Map(users.map((u) => [u.id, u.name ?? u.email]))

  const topUsers = topUsersRaw.map((u) => ({
    name:  userMap.get(u.userId) ?? u.userId.slice(0, 8),
    count: u._count.id,
    cost:  Number(u._sum.estimatedCostEUR ?? 0),
  }))

  // ── Workspaces stats ──────────────────────────────────────────────
  const wsMap = new Map(workspaces.map((w) => [w.id, w.name]))
  const workspaceStats = workspaceStatsRaw.map((ws) => ({
    name:   wsMap.get(ws.workspaceId) ?? ws.workspaceId.slice(0, 8),
    count:  ws._count.id,
    cost:   Number(ws._sum.estimatedCostEUR ?? 0),
    tokens: (ws._sum.inputTokens ?? 0) + (ws._sum.outputTokens ?? 0),
  })).sort((a, b) => b.count - a.count)

  // ── Trend diario (últimos 30 días) ────────────────────────────────
  const buckets: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = `${d.getDate()}/${d.getMonth() + 1}`
    buckets[key] = 0
  }
  for (const e of executions30d) {
    const key = `${e.createdAt.getDate()}/${e.createdAt.getMonth() + 1}`
    if (key in buckets) buckets[key] = (buckets[key] ?? 0) + 1
  }
  const trendData = Object.entries(buckets).map(([label, value]) => ({ label, value }))

  // ── Resumen global ────────────────────────────────────────────────
  const totalExec    = executions30d.length
  const completedExec = executions30d.filter((e) => e.status === 'COMPLETED').length
  const failedExec   = executions30d.filter((e) => e.status === 'FAILED').length
  const totalCost    = executions30d.reduce((s, e) => s + e.estimatedCostEUR, 0)
  const errorRate    = totalExec > 0 ? ((failedExec / totalExec) * 100).toFixed(1) : '0.0'
  const avgDurMs     = avgDuration._avg.durationMs ?? 0

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold">Analítica de uso</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Últimos 30 días · {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}</p>
        </div>
        <span className="text-xs text-muted-foreground border rounded-full px-3 py-1">
          {now.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Ejecuciones" value={String(totalExec)} sub="últimos 30 días" />
        <StatCard label="Completadas" value={String(completedExec)} sub={`${totalExec > 0 ? ((completedExec / totalExec) * 100).toFixed(0) : 0}% del total`} />
        <StatCard label="Coste IA" value={formatCostEUR(totalCost)} sub="30 días" />
        <StatCard label="Tasa de error" value={`${errorRate}%`} sub={`${failedExec} fallidas`} />
      </div>

      {avgDurMs > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Duración media" value={fmtMs(Math.round(avgDurMs))} sub="ejecuciones completadas" />
          <StatCard label="Coste medio/ejecución" value={totalExec > 0 ? formatCostEUR(totalCost / totalExec) : '—'} />
          <StatCard label="Usuarios activos" value={String(topUsersRaw.length)} sub="últimos 30 días" />
        </div>
      )}

      {/* Tendencia diaria */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Ejecuciones diarias — últimos 30 días
        </h2>
        <div className="rounded-xl border bg-card p-5">
          {totalExec === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sin ejecuciones en este período.</p>
          ) : (
            <MiniBarChart data={trendData} />
          )}
        </div>
      </section>

      {/* Herramientas más usadas */}
      {topTools.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Herramientas más usadas
          </h2>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">#</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Herramienta</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Ejecuciones</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Coste IA</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs pr-5">%</th>
                </tr>
              </thead>
              <tbody>
                {topTools.map((t, i) => {
                  const pct = totalExec > 0 ? ((t.count / totalExec) * 100).toFixed(0) : '0'
                  return (
                    <tr key={t.name} className="border-t hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{i + 1}</td>
                      <td className="px-4 py-3 font-medium">{t.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{t.count}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground text-xs">{formatCostEUR(t.cost)}</td>
                      <td className="px-4 py-3 text-right pr-5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums w-7 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Usuarios más activos */}
      {topUsers.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Usuarios más activos
          </h2>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">#</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Usuario</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Ejecuciones</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Coste generado</th>
                </tr>
              </thead>
              <tbody>
                {topUsers.map((u, i) => (
                  <tr key={u.name} className="border-t hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{u.count}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground text-xs">{formatCostEUR(u.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Por workspace */}
      {workspaceStats.length > 1 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Por workspace
          </h2>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Workspace</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Ejecuciones</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Tokens</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Coste IA</th>
                </tr>
              </thead>
              <tbody>
                {workspaceStats.map((ws) => (
                  <tr key={ws.name} className="border-t hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{ws.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{ws.count}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground text-xs">{fmtTokens(ws.tokens)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground text-xs">{formatCostEUR(ws.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
