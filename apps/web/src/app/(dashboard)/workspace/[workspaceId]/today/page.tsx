import Link from 'next/link'
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
import { FiscalWidget } from './_components/FiscalWidget'
import { InvoicesWidget } from './_components/InvoicesWidget'
import { OnboardingChecklist } from './_components/OnboardingChecklist'
import { db } from '@/lib/db'
import { getFiscalEvents, type LegalForm } from '@/lib/fiscal-calendar'
import { getInvoices } from '@/app/actions/invoices'

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
    year: 'numeric',
  })
}

const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING:   { label: 'En cola',    className: 'bg-muted text-muted-foreground' },
  RUNNING:   { label: 'Ejecutando', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  COMPLETED: { label: 'Completado', className: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  FAILED:    { label: 'Fallido',    className: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  CANCELLED: { label: 'Cancelado',  className: 'bg-muted text-muted-foreground' },
}

export default async function TodayPage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])
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

  const [clientCount, missionCount, taskCount, invoiceCount] = onboardingCounts
  const base = `/workspace/${workspaceId}`
  const onboardingSteps = [
    {
      id: 'arkos',
      label: 'Describe tu negocio a Arkos',
      description: 'Cuéntale qué hace tu empresa para que pueda ayudarte a planificar.',
      href: `${base}/copilot`,
      done: missionCount > 0,
    },
    {
      id: 'client',
      label: 'Añade tu primer cliente',
      description: 'Registra la empresa o persona a quien prestas servicio.',
      href: `${base}/clients`,
      done: clientCount > 0,
    },
    {
      id: 'task',
      label: 'Crea tu primera tarea',
      description: 'Organiza el trabajo pendiente con etiquetas y prioridades.',
      href: `${base}/tasks`,
      done: taskCount > 0,
    },
    {
      id: 'invoice',
      label: 'Emite tu primera factura',
      description: 'Genera un PDF listo para enviar a tu cliente.',
      href: `${base}/invoices`,
      done: invoiceCount > 0,
    },
    {
      id: 'fiscal',
      label: 'Activa el calendario fiscal',
      description: 'Configura tu forma jurídica para ver tus obligaciones tributarias.',
      href: `${base}/fiscal`,
      done: !!fiscalProfile?.legalForm,
    },
  ]

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

      <div>
        <h1 className="text-2xl font-semibold">{greeting()}, {user.name?.split(' ')[0] ?? 'equipo'}</h1>
        <p className="text-sm text-muted-foreground mt-0.5 capitalize">{todayLabel()}</p>
      </div>

      <OnboardingChecklist workspaceId={workspaceId} steps={onboardingSteps} />

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Control horario</h2>
          <Link href={`/workspace/${workspaceId}/timelog`} className="text-xs text-primary hover:underline">
            Ver historial →
          </Link>
        </div>
        <ClockWidget workspaceId={workspaceId} initialEntry={todayEntry} />
      </div>

      {myTasks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Mis tareas</h2>
            <Link href={`/workspace/${workspaceId}/tasks?mine=true`} className="text-xs text-primary hover:underline">
              Ver todas →
            </Link>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            {myTasks.map((task: TaskData) => {
              const isDue = task.dueDate && new Date(task.dueDate) < new Date()
              return (
                <div key={task.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${task.priority === 'CRITICAL' ? 'bg-red-500' : task.priority === 'HIGH' ? 'bg-amber-400' : 'bg-blue-500'}`} />
                  <span className="flex-1 text-sm truncate">{task.title}</span>
                  {task.dueDate && (
                    <span className={`text-xs ${isDue ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                  <Link
                    href={`/workspace/${workspaceId}/tasks`}
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    →
                  </Link>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {isEmpty && (
        <div className="rounded-2xl border border-dashed p-10 flex flex-col items-center text-center gap-3">
          <span className="text-3xl">✅</span>
          <p className="font-medium">Todo al día. Buen trabajo.</p>
          <p className="text-sm text-muted-foreground">No tienes pasos ni workflows pendientes.</p>
          <Link
            href={`/workspace/${workspaceId}/copilot`}
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-4 py-2 text-xs font-medium hover:bg-primary/20 transition-colors"
          >
            Pedir a Arkos una nueva misión →
          </Link>
        </div>
      )}

      {data.pendingSteps.length > 0 && (
        <PendingStepsBlock steps={data.pendingSteps} workspaceId={workspaceId} />
      )}

      {data.pendingWorkflows.length > 0 && (
        <WorkflowsBlock workflows={data.pendingWorkflows} workspaceId={workspaceId} />
      )}

      <FiscalWidget workspaceId={workspaceId} events={fiscalEvents} hasProfile={!!fiscalProfile} />
      <InvoicesWidget workspaceId={workspaceId} invoices={invoices} />
      <ContractsWidget workspaceId={workspaceId} contracts={contracts} />
      <NotebooksWidget workspaceId={workspaceId} notebooks={notebooks} />

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
              aria-label={`Ir al paso: ${step.stepTitle}`}
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
        Flujos ({workflows.length})
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
                  <span className="shrink-0 text-[10px] text-muted-foreground">Pendiente</span>
                )}
              </div>
              <Link
                href={`/workspace/${workspaceId}/workflows/${wf.workflowId}`}
                className="shrink-0 text-xs font-medium text-primary hover:underline"
                aria-label={`Abrir flujo: ${wf.workflowName}`}
              >
                Abrir flujo →
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
        {events.slice(0, 20).map((event) => (
          <div key={`${event.actorName}-${event.createdAt}`} className="flex items-start gap-3 px-4 py-3">
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
