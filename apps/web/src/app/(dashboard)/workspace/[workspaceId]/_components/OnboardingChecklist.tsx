import { db } from '@/lib/db'
import { getBusinessContext } from '@/lib/business-memory'
import { FrictionButton } from './FrictionButton'
import { ChecklistTracker } from './ChecklistTracker'
import { TrackedStepLink } from './TrackedStepLink'
import { recordOnboardingCompleted } from '@/app/actions/pmf-onboarding'

interface Props {
  workspaceId: string
  userId: string
}

interface Step {
  id:          string
  label:       string
  description: string
  hint:        string   // una línea concreta para el callout de próximo paso
  href:        string
  cta:         string
  done:        boolean
}

export async function OnboardingChecklist({ workspaceId, userId }: Props) {
  const [context, toolCount, executionCount, clientCount, objectiveCount, invoiceCount, fiscalProfile] = await Promise.all([
    getBusinessContext(workspaceId),
    db.toolInstance.count({ where: { workspaceId, status: 'ACTIVE' } }),
    db.toolExecution.count({ where: { workspaceId, status: 'COMPLETED' } }),
    db.client.count({ where: { workspaceId, isArchived: false } }),
    db.companyObjective.count({ where: { workspaceId } }),
    db.invoice.count({ where: { workspaceId } }),
    db.companyProfile.findUnique({
      where: { workspaceId },
      select: { fiscalName: true, nif: true },
    }),
  ])

  const firstTool = toolCount > 0
    ? await db.toolInstance.findFirst({
        where: { workspaceId, status: 'ACTIVE' },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      })
    : null

  const steps: Step[] = [
    {
      id:          'fiscal',
      label:       'Añade tu nombre y NIF',
      description: 'Necesitamos tu nombre o razón social y NIF. Sin esto, las facturas salen incompletas.',
      hint:        'Tu nombre o razón social + NIF. Solo tarda un minuto.',
      href:        `/workspace/${workspaceId}/fiscal/configurar`,
      cta:         'Configurar datos fiscales →',
      done:        !!(fiscalProfile?.fiscalName && fiscalProfile?.nif),
    },
    {
      id:          'client',
      label:       'Añade tu primer cliente',
      description: 'Solo necesitas el nombre. Si tienes su email, podrás enviarle el PDF directamente.',
      hint:        'Solo nombre obligatorio. Email opcional para enviar facturas.',
      href:        `/workspace/${workspaceId}/clients/new`,
      cta:         'Añadir cliente →',
      done:        clientCount > 0,
    },
    {
      id:          'invoice',
      label:       'Crea tu primera factura',
      description: 'Elige el cliente, añade los conceptos y MITIKUS calcula el IVA y genera el PDF.',
      hint:        'Conceptos + cliente + IVA automático. PDF listo en segundos.',
      href:        `/workspace/${workspaceId}/invoices`,
      cta:         'Ir a facturas →',
      done:        invoiceCount > 0,
    },
    {
      id:          'company',
      label:       'Cuéntale a Arkos a qué te dedicas',
      description: 'Dos frases bastan. Arkos adapta todas las herramientas a tu sector desde el primer momento.',
      hint:        'Dos frases sobre tu negocio. Arkos hace el resto.',
      href:        `/workspace/${workspaceId}/copilot`,
      cta:         'Abrir Arkos →',
      done:        !context.isEmpty,
    },
    {
      id:          'tool',
      label:       'Instala tu primera herramienta',
      description: 'Auditorías, compliance, RRHH y más. Cada herramienta genera un informe en minutos con IA.',
      hint:        'Auditorías, RGPD, RRHH, ISO 27001... Elige la que más encaje.',
      href:        `/workspace/${workspaceId}/tools`,
      cta:         'Ver catálogo →',
      done:        toolCount > 0,
    },
    {
      id:          'execution',
      label:       'Genera tu primer informe',
      description: 'Responde las preguntas, pulsa ejecutar y MITIKUS redacta el informe completo.',
      hint:        'Responde las preguntas y el informe se genera solo. Tarda unos minutos.',
      href:        firstTool ? `/workspace/${workspaceId}/tools/${firstTool.id}/run` : `/workspace/${workspaceId}/tools`,
      cta:         'Ejecutar ahora →',
      done:        executionCount > 0,
    },
  ]

  const doneCount = steps.filter((s) => s.done).length

  // Ocultar cuando todo está completado; disparar completed una sola vez
  if (doneCount === steps.length) {
    void recordOnboardingCompleted(workspaceId)
    return null
  }

  const nextStep = steps.find((s) => !s.done)!
  const pct = Math.round((doneCount / steps.length) * 100)

  const headerText =
    doneCount === 0
      ? 'Empieza por aquí — te guiamos paso a paso.'
      : doneCount === steps.length - 1
        ? '¡Casi! Solo te queda un paso.'
        : `${doneCount} de ${steps.length} completados.`

  return (
    <section className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-card p-5 space-y-4">
      <ChecklistTracker workspaceId={workspaceId} />

      {/* Header + progreso */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold">Primeros pasos</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{headerText}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-medium tabular-nums text-muted-foreground">{pct}%</span>
        </div>
      </div>

      {/* Callout: próximo paso */}
      <div className="rounded-lg bg-primary/8 border border-primary/25 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-0.5">Siguiente paso</p>
          <p className="text-sm font-semibold">{nextStep.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{nextStep.hint}</p>
        </div>
        <TrackedStepLink
          href={nextStep.href}
          stepId={nextStep.id}
          stepLabel={nextStep.label}
          workspaceId={workspaceId}
          isNext
        >
          {nextStep.cta}
        </TrackedStepLink>
      </div>

      {/* Lista completa de pasos */}
      <div className="space-y-1.5">
        {steps.map((step, i) => {
          const isNext = step.id === nextStep.id
          const isFuture = !step.done && !isNext
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                step.done  ? 'opacity-40'
                : isNext   ? 'bg-primary/5'
                : isFuture ? 'opacity-50'
                : ''
              }`}
            >
              {/* Indicator */}
              <div className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold border-2 transition-colors ${
                step.done
                  ? 'bg-green-500 border-green-500 text-white'
                  : isNext
                    ? 'border-primary text-primary'
                    : 'border-muted-foreground/25 text-muted-foreground/40'
              }`}>
                {step.done ? '✓' : i + 1}
              </div>

              {/* Label */}
              <p className={`flex-1 text-xs font-medium min-w-0 ${step.done ? 'line-through text-muted-foreground' : ''}`}>
                {step.label}
              </p>

              {/* CTA solo para el paso siguiente (el callout ya lo tiene para el primero, aquí lo repetimos por si scrollean) */}
              {isNext && (
                <TrackedStepLink
                  href={step.href}
                  stepId={step.id}
                  stepLabel={step.label}
                  workspaceId={workspaceId}
                  isNext
                >
                  {step.cta}
                </TrackedStepLink>
              )}
            </div>
          )
        })}
      </div>

      <FrictionButton
        workspaceId={workspaceId}
        nextStepId={nextStep.id}
        nextStepLabel={nextStep.label}
      />
    </section>
  )
}
