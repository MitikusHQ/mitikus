import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { can } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

function MetricCard({
  label,
  value,
  sub,
  alert,
}: {
  label: string
  value: string
  sub?: string
  alert?: 'yellow' | 'red'
}) {
  return (
    <div
      className={`rounded-lg border bg-card p-4 ${
        alert === 'red'
          ? 'border-destructive/40'
          : alert === 'yellow'
            ? 'border-amber-400/40'
            : ''
      }`}
    >
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

export default async function BetaDashboardPage() {
  const user = await requireUser()

  if (!can(user, 'view_admin_panel')) {
    redirect('/org')
  }

  const now = new Date()
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalOrgs,
    activeOrgIds,
    monthlyUsage,
    errorCount,
    totalTools,
    recentTools,
    recentGenerations,
    generationErrors,
  ] = await Promise.all([
    db.organization.count(),

    db.aIUsage.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { orgId: true },
      distinct: ['orgId'],
    }),

    db.aIUsage.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { estimatedCostEUR: true, totalTokens: true },
      _count: { id: true },
    }),

    db.aIUsage.count({
      where: { createdAt: { gte: startOfMonth }, status: 'error' },
    }),

    db.toolDefinition.count(),

    db.toolDefinition.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),

    db.generationRequest.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),

    db.generationRequest.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        errorMessage: { not: null },
      },
    }),
  ])

  const activeCount = activeOrgIds.length
  const monthCost = Number(monthlyUsage._sum.estimatedCostEUR ?? 0)
  const monthTokens = monthlyUsage._sum.totalTokens ?? 0
  const monthCalls = monthlyUsage._count.id
  const errorRate = monthCalls > 0 ? (errorCount / monthCalls) * 100 : 0
  const avgCostPerActiveOrg = activeCount > 0 ? monthCost / activeCount : 0

  const genErrorRate = recentGenerations > 0
    ? ((generationErrors / recentGenerations) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Beta Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Métricas del Founding Cohort · Actualizado ahora
          </p>
        </div>
        <span className="text-xs text-muted-foreground border rounded-full px-3 py-1">
          {now.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Health de la cohorte */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Health de la cohorte
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <MetricCard label="Organizaciones totales" value={String(totalOrgs)} />
          <MetricCard
            label="Activas (últimos 7 días)"
            value={String(activeCount)}
            sub={totalOrgs > 0 ? `${((activeCount / totalOrgs) * 100).toFixed(0)}% del total` : undefined}
            alert={activeCount === 0 ? 'red' : activeCount < 3 ? 'yellow' : undefined}
          />
          <MetricCard
            label="Herramientas creadas (7 días)"
            value={String(recentTools)}
            alert={recentTools === 0 ? 'yellow' : undefined}
          />
        </div>
      </section>

      {/* IA Costs este mes */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          IA — Mes actual
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard
            label="Coste total"
            value={`€${monthCost.toFixed(2)}`}
            alert={monthCost > 50 ? 'yellow' : undefined}
          />
          <MetricCard label="Llamadas" value={String(monthCalls)} />
          <MetricCard
            label="Tasa de error"
            value={`${errorRate.toFixed(1)}%`}
            alert={errorRate > 15 ? 'red' : errorRate > 8 ? 'yellow' : undefined}
          />
          <MetricCard
            label="Coste medio / org activa"
            value={activeCount > 0 ? `€${avgCostPerActiveOrg.toFixed(2)}` : '—'}
            alert={avgCostPerActiveOrg > 8 ? 'red' : avgCostPerActiveOrg > 5 ? 'yellow' : undefined}
          />
        </div>
      </section>

      {/* Producto */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Producto
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard label="Herramientas totales" value={String(totalTools)} />
          <MetricCard label="Tokens mes actual" value={monthTokens.toLocaleString('es')} />
          <MetricCard label="Generaciones (30 días)" value={String(recentGenerations)} />
          <MetricCard
            label="Tasa error generación"
            value={`${genErrorRate}%`}
            alert={Number(genErrorRate) > 15 ? 'red' : Number(genErrorRate) > 8 ? 'yellow' : undefined}
          />
        </div>
      </section>

      {/* Leyenda */}
      <div className="rounded-lg border bg-card p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground text-sm mb-2">Umbrales de alerta (OPS-001)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          <span>⚠️ Alerta amarilla — revisar esta semana</span>
          <span>🔴 Alerta roja — actuar en 24-48h</span>
          <span>Activas 7d: &lt;3 = amarilla · 0 = roja</span>
          <span>Tasa error IA: &gt;8% = amarilla · &gt;15% = roja</span>
          <span>Coste/org/mes: &gt;€5 = amarilla · &gt;€8 = roja</span>
          <span>Tasa error generación: &gt;8% = amarilla · &gt;15% = roja</span>
        </div>
      </div>
    </div>
  )
}
