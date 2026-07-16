import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { getTodayData } from '@/app/actions/today'
import type { PendingStep, PendingWorkflow, TeamActivityEvent } from '@/app/actions/today'

interface Props {
  params: Promise<{ workspaceId: string }>
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function todayLabel(): string {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING:   { label: 'En cola',    className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
  RUNNING:   { label: 'Ejecutando', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  COMPLETED: { label: 'Completado', className: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  FAILED:    { label: 'Fallido',    className: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  CANCELLED: { label: 'Cancelado',  className: 'bg-muted text-muted-foreground' },
}

export default async function TodayPage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])
  const data = await getTodayData(workspaceId, user.id)

  const isEmpty = data.pendingSteps.length === 0 && data.pendingWorkflows.length === 0

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

      <div>
        <h1 className="text-2xl font-semibold">{greeting()}, {user.name?.split(' ')[0] ?? 'equipo'}</h1>
        <p className="text-sm text-muted-foreground mt-0.5 capitalize">{todayLabel()}</p>
      </div>

      {isEmpty && (
        <div className="rounded-2xl border border-dashed p-12 flex flex-col items-center text-center gap-3">
          <span className="text-3xl">✅</span>
          <p className="font-medium">Todo al día. Buen trabajo.</p>
          <p className="text-sm text-muted-foreground">No tienes pasos ni workflows pendientes.</p>
        </div>
      )}

      {data.pendingSteps.length > 0 && (
        <PendingStepsBlock steps={data.pendingSteps} workspaceId={workspaceId} />
      )}

      {data.pendingWorkflows.length > 0 && (
        <WorkflowsBlock workflows={data.pendingWorkflows} workspaceId={workspaceId} />
      )}

      {data.teamActivity.length > 0 && (
        <TeamActivityBlock events={data.teamActivity} />
      )}

    </div>
  )
}

function PendingStepsBlock({ steps, workspaceId }: { steps: PendingStep[]; workspaceId: string }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Mis pasos pendientes ({steps.length})
      </h2>
      <div className="rounded-xl border bg-card divide-y overflow-hidden">
        {steps.slice(0, 10).map((step) => (
          <div key={step.stepId} className="flex items-center gap-4 px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">{step.objectiveLabel}</span>
                <span className="text-muted-foreground/40">›</span>
                <span className="text-sm font-medium truncate">{step.stepTitle}</span>
              </div>
              {step.clientName && (
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  {step.clientName}
                </span>
              )}
            </div>
            <Link
              href={`/workspace/${workspaceId}/missions/${step.objectiveId}`}
              className="shrink-0 text-xs font-medium text-primary hover:underline"
            >
              Ir al paso →
            </Link>
          </div>
        ))}
        {steps.length > 10 && (
          <div className="px-4 py-2 border-t">
            <Link
              href={`/workspace/${workspaceId}/missions`}
              className="text-xs text-primary hover:underline"
            >
              Ver todos ({steps.length}) →
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

function WorkflowsBlock({ workflows, workspaceId }: { workflows: PendingWorkflow[]; workspaceId: string }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Workflows ({workflows.length})
      </h2>
      <div className="rounded-xl border bg-card divide-y overflow-hidden">
        {workflows.slice(0, 10).map((wf) => {
          const badge = wf.lastExecutionStatus ? statusLabels[wf.lastExecutionStatus] : null
          return (
            <div key={wf.workflowId} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span className="text-sm font-medium truncate">{wf.workflowName}</span>
                {badge && (
                  <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded ${badge.className}`}>
                    {badge.label}
                  </span>
                )}
                {!badge && (
                  <span className="shrink-0 text-[10px] text-muted-foreground">Sin ejecutar</span>
                )}
              </div>
              <Link
                href={`/workspace/${workspaceId}/workflows/${wf.workflowId}`}
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                Ejecutar →
              </Link>
            </div>
          )
        })}
        {workflows.length > 10 && (
          <div className="px-4 py-2 border-t">
            <Link
              href={`/workspace/${workspaceId}/workflows`}
              className="text-xs text-primary hover:underline"
            >
              Ver todos ({workflows.length}) →
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

function TeamActivityBlock({ events }: { events: TeamActivityEvent[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Actividad del equipo hoy
      </h2>
      <div className="rounded-xl border bg-card divide-y overflow-hidden">
        {events.slice(0, 20).map((event, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3">
            <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              {event.actorName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-sm">
              <span className="font-medium">{event.actorName}</span>
              {' '}{event.action}
              {event.entityLabel && (
                <span className="italic"> &ldquo;{event.entityLabel}&rdquo;</span>
              )}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{event.timeAgo}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
