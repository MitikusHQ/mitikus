import Link from 'next/link'
import { currentUser } from '@clerk/nextjs/server'
import { requireUser } from '@/lib/auth'
import { getTodayData } from '@/app/actions/today'
import type { PendingStep, PendingWorkflow, TeamActivityEvent } from '@/app/actions/today'
import { ClockWidget } from './_components/ClockWidget'
import { getTodayEntry } from '@/app/actions/timelog'
import { getMyTasks } from '@/app/actions/tasks'
import type { TaskData } from '@/app/actions/tasks'
import { getPendingContracts } from '@/app/actions/contracts'
import { getNotebooks } from '@/app/actions/notebooks'
import { ContractsWidget } from './_components/ContractsWidget'
import { NotebooksWidget } from './_components/NotebooksWidget'
import { DailyBriefBlock } from './_components/DailyBriefBlock'
import { FiscalWidget } from './_components/FiscalWidget'
import { InvoicesWidget } from './_components/InvoicesWidget'
import { OnboardingChecklist } from './_components/OnboardingChecklist'
import { db } from '@/lib/db'
import { getFiscalEvents, type LegalForm } from '@/lib/fiscal-calendar'
import { getInvoices } from '@/app/actions/invoices'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations, type DashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'

interface Props {
  params: Promise<{ workspaceId: string }>
}

function greeting(t: DashboardTranslations): string {
  const h = new Date().getHours()
  if (h < 12) return t.todayGreetingMorning
  if (h < 19) return t.todayGreetingAfternoon
  return t.todayGreetingEvening
}

function todayLabel(locale: Locale): string {
  return new Date().toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function statusLabels(t: DashboardTranslations): Record<string, { label: string; className: string }> {
  return {
    PENDING:   { label: t.todayStatusQueued,    className: 'bg-muted text-muted-foreground' },
    RUNNING:   { label: t.todayStatusRunning,   className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    COMPLETED: { label: t.todayStatusCompleted, className: 'bg-green-500/10 text-green-600 dark:text-green-400' },
    FAILED:    { label: t.todayStatusFailed,    className: 'bg-red-500/10 text-red-600 dark:text-red-400' },
    CANCELLED: { label: t.todayStatusCancelled, className: 'bg-muted text-muted-foreground' },
  }
}

function cleanDisplayName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.includes('@')) return null
  return trimmed
}

export default async function TodayPage({ params }: Props) {
  const [{ workspaceId }, user, locale, clerkUser] = await Promise.all([params, requireUser(), getLocale(), currentUser()])
  const t = getDashboardTranslations(locale)
  const [data, todayEntry, myTasks, contracts, notebooks, fiscalProfile, invoices, onboardingCounts] = await Promise.all([
    getTodayData(workspaceId, user.id),
    getTodayEntry(workspaceId, user.id),
    getMyTasks(workspaceId, user.id),
    getPendingContracts(workspaceId),
    getNotebooks(workspaceId),
    db.companyProfile.findUnique({ where: { workspaceId }, select: { legalForm: true, country: true } }),
    getInvoices(workspaceId).catch(() => []),
    Promise.all([
      db.client.count({ where: { workspaceId } }),
      db.companyObjective.count({ where: { workspaceId } }),
      db.task.count({ where: { workspaceId } }),
      db.invoice.count({ where: { workspaceId } }),
    ]),
  ])

  const fiscalEvents = (fiscalProfile?.legalForm || fiscalProfile?.country)
    ? getFiscalEvents(fiscalProfile.country ?? 'ES', fiscalProfile.legalForm)
    : []

  const isEmpty = data.pendingSteps.length === 0 && data.pendingWorkflows.length === 0
  const metadataName =
    cleanDisplayName(clerkUser?.publicMetadata?.name) ??
    cleanDisplayName(clerkUser?.publicMetadata?.displayName)
  const rawName = cleanDisplayName(user.name)
  const displayName =
    cleanDisplayName(clerkUser?.fullName) ??
    cleanDisplayName([clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ')) ??
    cleanDisplayName(clerkUser?.username) ??
    metadataName ??
    rawName ??
    user.email?.split('@')[0] ??
    t.todayFallbackName

  const firstName = cleanDisplayName(clerkUser?.firstName) ?? displayName.split(' ')[0] ?? displayName

  const [clientCount, missionCount, taskCount, invoiceCount] = onboardingCounts
  const base = `/workspace/${workspaceId}`
  const onboardingSteps = [
    {
      id: 'arkos',
      label: t.todayArkosStepTitle,
      description: t.todayArkosStepDescription,
      href: `${base}/copilot`,
      done: missionCount > 0,
    },
    {
      id: 'client',
      label: t.todayClientStepTitle,
      description: t.todayClientStepDescription,
      href: `${base}/clients`,
      done: clientCount > 0,
    },
    {
      id: 'task',
      label: t.todayTaskStepTitle,
      description: t.todayTaskStepDescription,
      href: `${base}/tasks`,
      done: taskCount > 0,
    },
    {
      id: 'invoice',
      label: t.todayInvoiceStepTitle,
      description: t.todayInvoiceStepDescription,
      href: `${base}/invoices`,
      done: invoiceCount > 0,
    },
    {
      id: 'fiscal',
      label: t.todayFiscalStepTitle,
      description: t.todayFiscalStepDescription,
      href: `${base}/fiscal`,
      done: !!fiscalProfile?.legalForm,
    },
  ]

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide capitalize">{todayLabel(locale)}</p>
        <h1 className="text-3xl font-bold tracking-tight">{greeting(t)}, {firstName}</h1>
      </div>

      <DailyBriefBlock workspaceId={workspaceId} />

      <OnboardingChecklist workspaceId={workspaceId} steps={onboardingSteps} locale={locale} />

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t.todayTimeTracking}</h2>
          <Link href={`/workspace/${workspaceId}/timelog`} className="text-xs text-primary hover:underline">
            {t.todayViewHistory} →
          </Link>
        </div>
        <ClockWidget workspaceId={workspaceId} initialEntry={todayEntry} locale={locale} />
      </div>

      {myTasks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t.todayMyTasks}</h2>
            <Link href={`/workspace/${workspaceId}/tasks?mine=true`} className="text-xs text-primary hover:underline">
              {t.todayViewAll} →
            </Link>
          </div>
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {myTasks.map((task: TaskData) => {
              const isDue = task.dueDate && new Date(task.dueDate) < new Date()
              const priorityClass = task.priority === 'CRITICAL'
                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                : task.priority === 'HIGH'
                ? 'bg-amber-400/10 text-amber-600 dark:text-amber-400'
                : task.priority === 'LOW'
                ? 'bg-slate-400/10 text-slate-500 dark:text-slate-400'
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              const priorityDot = task.priority === 'CRITICAL'
                ? 'bg-red-500'
                : task.priority === 'HIGH'
                ? 'bg-amber-400'
                : task.priority === 'LOW'
                ? 'bg-slate-400'
                : 'bg-blue-400'
              return (
                <div key={task.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/25 transition-colors group">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDot}`} />
                  <span className="flex-1 text-sm truncate">{task.title}</span>
                  {task.dueDate && (
                    <span className={`text-[11px] font-medium shrink-0 ${isDue ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {new Date(task.dueDate).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                  <Link
                    href={`/workspace/${workspaceId}/tasks`}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                    aria-label="Ver tareas"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {isEmpty && (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-base">{t.todayAllCaughtUpTitle}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{t.todayAllCaughtUpDescription}</p>
          </div>
          <Link
            href={`/workspace/${workspaceId}/copilot`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-4 py-2 text-xs font-medium hover:bg-primary/20 transition-colors"
          >
            {t.todayAskArkosMission} →
          </Link>
        </div>
      )}

      {data.pendingSteps.length > 0 && (
        <PendingStepsBlock steps={data.pendingSteps} workspaceId={workspaceId} t={t} />
      )}

      {data.pendingWorkflows.length > 0 && (
        <WorkflowsBlock workflows={data.pendingWorkflows} workspaceId={workspaceId} t={t} />
      )}

      <FiscalWidget workspaceId={workspaceId} events={fiscalEvents} hasProfile={!!fiscalProfile} locale={locale} />
      <InvoicesWidget workspaceId={workspaceId} invoices={invoices} locale={locale} />
      <ContractsWidget workspaceId={workspaceId} contracts={contracts} locale={locale} />
      <NotebooksWidget workspaceId={workspaceId} notebooks={notebooks} locale={locale} />

      {data.teamActivity.length > 0 && (
        <TeamActivityBlock events={data.teamActivity} t={t} />
      )}

    </div>
  )
}

function PendingStepsBlock({ steps, workspaceId, t }: { steps: PendingStep[]; workspaceId: string; t: DashboardTranslations }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t.todayPendingSteps} <span className="font-normal opacity-60">({steps.length})</span>
      </h2>
      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        {steps.slice(0, 10).map((step) => (
          <div key={step.stepId} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors group">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground/70">{step.objectiveLabel}</span>
                <span className="text-muted-foreground/30 text-xs">›</span>
                <span className="text-sm font-medium truncate">{step.stepTitle}</span>
              </div>
              {step.clientName && (
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-md bg-primary/8 text-primary font-medium">
                  {step.clientName}
                </span>
              )}
            </div>
            <Link
              href={`/workspace/${workspaceId}/missions/${step.objectiveId}`}
              className="shrink-0 text-xs font-medium text-primary opacity-70 hover:opacity-100 transition-opacity"
              aria-label={`${t.todayGoToStep}: ${step.stepTitle}`}
            >
              {t.todayGoToStep} →
            </Link>
          </div>
        ))}
        {steps.length > 10 && (
          <div className="px-4 py-2.5 bg-muted/30">
            <Link
              href={`/workspace/${workspaceId}/missions`}
              className="text-xs text-primary hover:underline"
            >
              {t.todayViewAll} ({steps.length}) →
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

function WorkflowsBlock({ workflows, workspaceId, t }: { workflows: PendingWorkflow[]; workspaceId: string; t: DashboardTranslations }) {
  const labels = statusLabels(t)
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t.todayWorkflows} <span className="font-normal opacity-60">({workflows.length})</span>
      </h2>
      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        {workflows.slice(0, 10).map((wf) => {
          const badge = wf.lastExecutionStatus ? labels[wf.lastExecutionStatus] : null
          return (
            <div key={wf.workflowId} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span className="text-sm font-medium truncate">{wf.workflowName}</span>
                {badge && (
                  <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${badge.className}`}>
                    {badge.label}
                  </span>
                )}
                {!badge && (
                  <span className="shrink-0 text-[10px] text-muted-foreground/70">{t.todayPending}</span>
                )}
              </div>
              <Link
                href={`/workspace/${workspaceId}/workflows/${wf.workflowId}`}
                className="shrink-0 text-xs font-medium text-primary opacity-70 hover:opacity-100 transition-opacity"
                aria-label={`${t.todayOpenWorkflow}: ${wf.workflowName}`}
              >
                {t.todayOpenWorkflow} →
              </Link>
            </div>
          )
        })}
        {workflows.length > 10 && (
          <div className="px-4 py-2.5 bg-muted/30">
            <Link
              href={`/workspace/${workspaceId}/workflows`}
              className="text-xs text-primary hover:underline"
            >
              {t.todayViewAll} ({workflows.length}) →
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

function TeamActivityBlock({ events, t }: { events: TeamActivityEvent[]; t: DashboardTranslations }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t.todayTeamActivity} <span className="font-normal opacity-60">({events.length})</span>
      </h2>
      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        {events.slice(0, 20).map((event) => (
          <div key={`${event.actorName}-${event.createdAt}`} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
            <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              {event.actorName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-sm">
              <span className="font-medium">{event.actorName}</span>
              <span className="text-muted-foreground"> {event.action}</span>
              {event.entityLabel && (
                <span className="text-foreground/70 italic"> &ldquo;{event.entityLabel}&rdquo;</span>
              )}
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground/70 mt-0.5">{event.timeAgo}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
