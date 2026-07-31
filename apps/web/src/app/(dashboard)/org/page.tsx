import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { PlanTier } from '@prisma/client'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { getOrgOverview, getOrgWorkspaces } from '@/app/actions/org'
import { OrgMetricCard } from './_components/OrgMetricCard'
import { OrgRecentActivity } from './_components/OrgRecentActivity'
import { OrgWorkspaceList } from './_components/OrgWorkspaceList'
import { PlanUpgradeSection } from './_components/PlanUpgradeSection'
import { PlanUsageSection } from './_components/PlanUsageSection'
import { getOrgPlanUsage } from '@/app/actions/org'

const PLAN_LABELS: Record<string, string> = {
  FREE: 'Free', PRO: 'Pro',
  STARTER: 'Starter', PROFESSIONAL: 'Professional', BUSINESS: 'Business', ENTERPRISE: 'Enterprise',
}
const PLAN_BADGE: Record<string, string> = {
  FREE: 'bg-muted text-muted-foreground border-border',
  PRO:  'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800',
  STARTER: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  PROFESSIONAL: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800',
  BUSINESS: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  ENTERPRISE: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
}

function formatCost(eur: number): string {
  if (eur === 0) return '€0.00'
  if (eur < 0.01) return '<€0.01'
  return `€${eur.toFixed(2)}`
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(iso))
}

export default async function OrgPage() {
  const user = await requireUser()

  const [overviewResult, workspacesResult, subscription, planUsageResult] = await Promise.all([
    getOrgOverview(),
    getOrgWorkspaces(),
    db.subscription.findUnique({
      where: { orgId: user.orgId },
      select: { status: true, trialEndsAt: true },
    }),
    getOrgPlanUsage(),
  ])

  if ('error' in overviewResult) notFound()

  const overview = overviewResult
  const workspaces = 'error' in workspacesResult ? [] : workspacesResult

  const plan = overview.org.plan as PlanTier
  const planLabel = PLAN_LABELS[plan] ?? plan
  const planBadgeClass = PLAN_BADGE[plan] ?? PLAN_BADGE.FREE

  const trialDaysLeft =
    subscription?.status === 'TRIALING' && subscription.trialEndsAt
      ? Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - Date.now()) / 86_400_000))
      : null

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{overview.org.name}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${planBadgeClass}`}>
              {planLabel}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {overview.org.sector
              ? `${overview.org.sector} · `
              : ''}
            Organización creada el {formatDate(overview.org.createdAt)}
          </p>
        </div>
        <Link
          href="/org/team"
          className="rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Ver equipo →
        </Link>
      </div>

      {/* Metric grid */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Resumen ejecutivo</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <OrgMetricCard label="Miembros" value={overview.memberCount} icon="👥" />
          <OrgMetricCard label="Workspaces" value={overview.workspaceCount} icon="📁" />
          <OrgMetricCard label="Herramientas" value={overview.toolCount} icon="🔧" />
          <OrgMetricCard label="Workflows" value={overview.workflowCount} icon="🔗" />
          <OrgMetricCard
            label="Coste IA total"
            value={formatCost(overview.usage.totalCostEUR)}
            icon="💶"
            description="Estimado"
          />
          <OrgMetricCard
            label="Ejecuciones"
            value={overview.usage.totalExecutions}
            icon="⚡"
            description="Herramientas"
          />
          <OrgMetricCard
            label="Tokens consumidos"
            value={formatTokens(overview.usage.totalTokens)}
            icon="🧠"
          />
          <OrgMetricCard
            label="Ejecuciones workflow"
            value={overview.usage.totalWorkflowExecutions}
            icon="▶"
          />
        </div>
      </div>

      {/* Workspaces */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Workspaces</h2>
          <span className="text-xs text-muted-foreground">{workspaces.length} en total</span>
        </div>
        <OrgWorkspaceList workspaces={workspaces} />
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Actividad reciente</h2>
        <OrgRecentActivity items={overview.recentActivity} />
      </div>

      {/* Plan / billing */}
      <div id="plan-billing" className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Plan y facturación</h2>
        {!('error' in planUsageResult) && (
          <PlanUsageSection items={planUsageResult} />
        )}
        <PlanUpgradeSection
          currentTier={plan}
          trialDaysLeft={trialDaysLeft}
          trialEndsAt={subscription?.trialEndsAt?.toISOString() ?? null}
          hasActiveSubscription={subscription?.status === 'ACTIVE'}
        />
      </div>
    </div>
  )
}
