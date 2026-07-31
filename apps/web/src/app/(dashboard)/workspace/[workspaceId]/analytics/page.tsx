import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { db } from '@/lib/db'
import { formatCostEUR } from '@/lib/ai-cost'
import { getWorkspaceAnalytics } from '@/app/actions/analytics'
import { parseRange } from '@/lib/analytics-utils'
import type { WorkspaceAnalytics, HealthPoint } from '@/app/actions/analytics'
import { MetricCard } from './_components/MetricCard'
import { BarChart } from './_components/BarChart'
import { HorizontalBarList } from './_components/HorizontalBarList'
import { DonutChart } from './_components/DonutChart'
import { RangeSelector } from './_components/RangeSelector'
import { AnalyticsInsights } from './_components/AnalyticsInsights'

interface Props {
  params: Promise<{ workspaceId: string }>
  searchParams: Promise<{ range?: string }>
}

export default async function AnalyticsPage({ params, searchParams }: Props) {
  const [{ workspaceId }, sp, user] = await Promise.all([params, searchParams, requireUser()])

  if (!can(user, 'view_usage')) notFound()

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true, name: true },
  })
  if (!workspace) notFound()

  const range = parseRange(sp.range)
  const result = await getWorkspaceAnalytics(workspaceId, range)

  if ('error' in result) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <p className="text-sm text-destructive">{result.error}</p>
      </div>
    )
  }

  return <AnalyticsDashboard data={result} workspaceId={workspaceId} />
}

// ── Dashboard (keeps page RSC clean) ────────────────────────────

function AnalyticsDashboard({ data, workspaceId }: { data: WorkspaceAnalytics; workspaceId: string }) {
  const { summary, timeseries, providerBreakdown, modelBreakdown, topTools, topWorkflows, executionHealth, userActivity, insights } = data

  const hasAnyData = summary.totalToolExecutions > 0 || summary.totalWorkflowExecutions > 0

  const successPct = Math.round(summary.successRate * 100)
  const avgDurSec  = summary.avgDurationMs > 0 ? (summary.avgDurationMs / 1000).toFixed(1) + 's' : '—'

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Uso de IA, ejecuciones y costes del workspace
          </p>
        </div>
        <RangeSelector current={data.range} />
      </div>

      {/* Metric cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        <MetricCard
          title="Coste IA"
          value={formatCostEUR(summary.totalCostEUR)}
          icon="€"
          microcopy={`${summary.totalToolExecutions + summary.totalWorkflowExecutions} ejecuciones totales`}
        />
        <MetricCard
          title="Tokens usados"
          value={formatTokens(summary.totalTokens)}
          icon="⟨⟩"
          microcopy="Suma de input + output tokens"
        />
        <MetricCard
          title="Ejecuciones"
          value={String(summary.totalToolExecutions)}
          icon="▶"
          microcopy={`+ ${summary.totalWorkflowExecutions} workflows completos`}
        />
        <MetricCard
          title="Tasa de éxito"
          value={`${successPct}%`}
          icon={successPct >= 90 ? '✓' : '⚠'}
          microcopy="Completadas / finalizadas"
        />
        <MetricCard
          title="Tiempo medio"
          value={avgDurSec}
          icon="⏱"
          microcopy="Por ejecución de herramienta"
        />
        <MetricCard
          title="Coste medio"
          value={formatCostEUR(summary.avgCostPerExecution)}
          icon="≈"
          microcopy="Por ejecución"
        />
      </div>

      {!hasAnyData ? (
        <EmptyState />
      ) : (
        <>
          {/* Row: Cost timeseries + Health */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Section title={`Coste IA por ${data.range === 'all' ? 'mes' : 'día'}`}>
              <BarChart
                data={timeseries.map((d) => ({ label: d.day, value: d.cost }))}
                height={90}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Total: {formatCostEUR(timeseries.reduce((s, d) => s + d.cost, 0))}
              </p>
            </Section>

            <Section title="Estado de ejecuciones">
              <ExecutionHealthView points={executionHealth} />
            </Section>
          </div>

          {/* Row: Top tools + Provider breakdown */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Herramientas más usadas">
              <HorizontalBarList
                items={topTools.map((t) => ({
                  label: t.name,
                  value: t.count,
                  sublabel: formatCostEUR(t.costEUR),
                }))}
                formatter={(v) => `${v} ejec.`}
                emptyText="Sin herramientas ejecutadas"
              />
            </Section>

            <Section title="Distribución por proveedor">
              <DonutChart
                data={providerBreakdown.map((p) => ({
                  label: p.provider,
                  value: p.count,
                }))}
              />
            </Section>
          </div>

          {/* Row: Model breakdown + Top workflows */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Modelos IA">
              <HorizontalBarList
                items={modelBreakdown.map((m) => ({
                  label: shortModelName(m.model),
                  value: m.costEUR,
                  sublabel: `${formatTokens(m.tokens)} tokens · ${m.count} ejec.`,
                }))}
                formatter={formatCostEUR}
                barColorClass="bg-violet-500"
                emptyText="Sin datos de modelo"
              />
            </Section>

            <Section title="Flujos ejecutados">
              <HorizontalBarList
                items={topWorkflows.map((w) => ({
                  label: w.name,
                  value: w.count,
                  sublabel: `${formatCostEUR(w.costEUR)} · fallo ${Math.round(w.failRate * 100)}%`,
                }))}
                formatter={(v) => `${v} ejec.`}
                barColorClass="bg-emerald-500"
                emptyText="Sin workflows ejecutados"
              />
            </Section>
          </div>

          {/* Row: Executions timeseries + User activity */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Section title={`Ejecuciones por ${data.range === 'all' ? 'mes' : 'día'}`}>
              <BarChart
                data={timeseries.map((d) => ({ label: d.day, value: d.executions }))}
                height={90}
                colorClass="fill-emerald-500"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Total: {timeseries.reduce((s, d) => s + d.executions, 0)} ejecuciones
              </p>
            </Section>

            <Section title="Actividad por usuario">
              <HorizontalBarList
                items={userActivity.map((u) => ({
                  label: u.name,
                  value: u.count,
                  sublabel: formatCostEUR(u.costEUR),
                }))}
                formatter={(v) => `${v} ejec.`}
                barColorClass="bg-blue-500"
                emptyText="Sin actividad de usuario"
              />
            </Section>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <Section title="✦ Insights">
              <AnalyticsInsights insights={insights} />
            </Section>
          )}
        </>
      )}
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="text-sm font-semibold mb-4 text-foreground">{title}</h2>
      {children}
    </section>
  )
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed p-14 text-center">
      <p className="text-muted-foreground text-sm font-medium">Sin actividad en este periodo</p>
      <p className="text-muted-foreground text-xs mt-1">
        Ejecuta herramientas o workflows para ver métricas aquí.
      </p>
    </div>
  )
}

const STATUS_CONFIG: Record<string, { label: string; colorClass: string }> = {
  COMPLETED: { label: 'Completadas', colorClass: 'bg-green-500' },
  FAILED:    { label: 'Fallidas',    colorClass: 'bg-red-500'   },
  CANCELLED: { label: 'Canceladas',  colorClass: 'bg-amber-500' },
  RUNNING:   { label: 'En curso',    colorClass: 'bg-blue-500'  },
  PENDING:   { label: 'Pendientes',  colorClass: 'bg-muted-foreground' },
}

function ExecutionHealthView({ points }: { points: HealthPoint[] }) {
  if (points.length === 0) {
    return <p className="text-xs text-muted-foreground py-4 text-center">Sin ejecuciones</p>
  }

  const total = points.reduce((s, p) => s + p.count, 0)
  const sorted = [...points].sort((a, b) => b.count - a.count)

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden flex gap-0.5">
        {sorted.map((p, i) => {
          const cfg = STATUS_CONFIG[p.status]
          return (
            <div
              key={i}
              className={`h-full ${cfg?.colorClass ?? 'bg-muted'} transition-all`}
              style={{ width: `${(p.count / total) * 100}%` }}
              title={`${cfg?.label ?? p.status}: ${p.count}`}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {sorted.map((p, i) => {
          const cfg = STATUS_CONFIG[p.status]
          return (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-sm ${cfg?.colorClass ?? 'bg-muted'}`} />
                <span className="text-muted-foreground">{cfg?.label ?? p.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">{p.count}</span>
                <span className="text-muted-foreground w-9 text-right">
                  {Math.round((p.count / total) * 100)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Formatters ───────────────────────────────────────────────────

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function shortModelName(model: string): string {
  // "claude-sonnet-4-6" → "Sonnet 4.6"
  const m = model.replace('claude-', '').replace(/-(\d+)-(\d+)$/, ' $1.$2')
  return m.charAt(0).toUpperCase() + m.slice(1)
}
