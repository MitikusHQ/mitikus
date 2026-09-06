import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { listWorkflows, type WorkflowSummary } from '@/app/actions/workflows'
import { formatCostEUR } from '@/lib/ai-cost'
import { STATUS_LABELS, STATUS_BADGE_CLASSES, type ResourceStatusString } from '@/lib/marketplace-config'
import { WORKFLOW_TEMPLATES } from '@/lib/workflow-templates'
import { TemplateCard } from './_components/TemplateCard'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import type { DashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  params: Promise<{ workspaceId: string }>
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.round(ms / 60_000)}m`
}

function ResourceStatusBadge({ status, version }: { status: string; version: number }) {
  const key = (status ?? 'PUBLISHED') as ResourceStatusString
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border leading-none ${STATUS_BADGE_CLASSES[key]}`}>
      {STATUS_LABELS[key]} · v{version}
    </span>
  )
}

function StatusDot({ isActive, t }: { isActive: boolean; t: DashboardTranslations }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
      title={isActive ? t.workflowsActiveTitle : t.workflowsInactiveTitle}
    />
  )
}

function WorkflowCard({ workflow, workspaceId, t, locale }: { workflow: WorkflowSummary; workspaceId: string; t: DashboardTranslations; locale: string }) {
  return (
    <Link
      href={`/workspace/${workspaceId}/workflows/${workflow.id}`}
      className="group flex flex-col gap-3 rounded-xl border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg shrink-0">
          🔗
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusDot isActive={workflow.isActive} t={t} />
            <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
              {workflow.name}
            </h3>
            <ResourceStatusBadge status={workflow.status} version={workflow.version} />
          </div>
          {workflow.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{workflow.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center">
          <div className="font-semibold text-foreground">{workflow.nodeCount}</div>
          <div className="text-muted-foreground mt-0.5">{t.workflowsSteps}</div>
        </div>
        <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center">
          <div className="font-semibold text-foreground">{workflow.executionCount}</div>
          <div className="text-muted-foreground mt-0.5">{t.workflowsExecutions}</div>
        </div>
        <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center">
          <div className="font-semibold text-foreground text-[11px]">
            {workflow.lastExecutionAt
              ? new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(new Date(workflow.lastExecutionAt))
              : '—'}
          </div>
          <div className="text-muted-foreground mt-0.5">{t.workflowsLastRun}</div>
        </div>
      </div>
    </Link>
  )
}

export default async function WorkflowsPage({ params }: Props) {
  const [{ workspaceId }, user, locale] = await Promise.all([params, requireUser(), getLocale()])
  const t = getDashboardTranslations(locale)

  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!workspace) notFound()

  const workflows = await listWorkflows(workspaceId)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t.workflowsTitle}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t.workflowsSubtitle}</p>
        </div>
        <Link
          href={`/workspace/${workspaceId}/workflows/new`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          {t.workflowsNew}
        </Link>
      </div>
      {/* Cómo funciona */}
      <div className="rounded-xl border bg-muted/30 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-4">{t.workflowsHowItWorksTitle}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-base shrink-0">1</div>
            <div>
              <p className="text-sm font-medium">{t.workflowsStep1Title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.workflowsStep1Description}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-base shrink-0">2</div>
            <div>
              <p className="text-sm font-medium">{t.workflowsStep2Title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.workflowsStep2Description}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-base shrink-0">3</div>
            <div>
              <p className="text-sm font-medium">{t.workflowsStep3Title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.workflowsStep3Description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Templates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold">{t.workflowsTemplatesTitle}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t.workflowsTemplatesSubtitle}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WORKFLOW_TEMPLATES.map((t) => (
            <TemplateCard key={t.id} template={t} workspaceId={workspaceId} />
          ))}
        </div>
      </div>

      {/* Mis Flows */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">
            {t.workflowsMyWorkflows}
            {workflows.length > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {workflows.length}
              </span>
            )}
          </h2>
        </div>
        {workflows.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center bg-card">
            <p className="text-sm text-muted-foreground">
              {t.workflowsEmptyPrefix}
              <Link href={`/workspace/${workspaceId}/workflows/new`} className="text-primary hover:underline">
                {t.workflowsCreateFromScratch}
              </Link>
              {t.workflowsEmptySuffix}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workflows.map((w) => (
              <WorkflowCard key={w.id} workflow={w} workspaceId={workspaceId} t={t} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
