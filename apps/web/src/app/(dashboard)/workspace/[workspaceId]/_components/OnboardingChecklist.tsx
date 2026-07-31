import Link from 'next/link'
import { db } from '@/lib/db'
import { getBusinessContext } from '@/lib/business-memory'

interface Props {
  workspaceId: string
  userId: string
}

interface Step {
  id:          string
  label:       string
  description: string
  href:        string
  cta:         string
  done:        boolean
}

export async function OnboardingChecklist({ workspaceId, userId }: Props) {
  const [context, toolCount, executionCount, clientCount, objectiveCount] = await Promise.all([
    getBusinessContext(workspaceId),
    db.toolInstance.count({ where: { workspaceId, status: 'ACTIVE' } }),
    db.toolExecution.count({ where: { workspaceId, status: 'COMPLETED' } }),
    db.client.count({ where: { workspaceId, isArchived: false } }),
    db.companyObjective.count({ where: { workspaceId } }),
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
      id:          'company',
      label:       'Describe tu empresa',
      description: 'Arkos aprende de tu negocio para personalizar todo el trabajo.',
      href:        `/workspace/${workspaceId}/copilot`,
      cta:         'Abrir Arkos →',
      done:        !context.isEmpty,
    },
    {
      id:          'tool',
      label:       'Instala tu primera herramienta',
      description: 'Elige una herramienta del catálogo adaptada a tu sector.',
      href:        `/workspace/${workspaceId}/tools`,
      cta:         'Ver catálogo →',
      done:        toolCount > 0,
    },
    {
      id:          'execution',
      label:       'Ejecuta tu primera herramienta',
      description: 'Rellena las variables y genera tu primer output.',
      href:        firstTool ? `/workspace/${workspaceId}/tools/${firstTool.id}/run` : `/workspace/${workspaceId}/tools`,
      cta:         'Ejecutar ahora →',
      done:        executionCount > 0,
    },
    {
      id:          'mission',
      label:       'Crea tu primera misión',
      description: 'Convierte un objetivo de tu empresa en pasos concretos. Puedes usar una plantilla o pedírselo a Arkos.',
      href:        `/workspace/${workspaceId}/copilot`,
      cta:         'Crear misión →',
      done:        objectiveCount > 0,
    },
    {
      id:          'client',
      label:       'Añade tu primer cliente',
      description: 'Vincula el trabajo generado a las empresas a las que sirves.',
      href:        `/workspace/${workspaceId}/clients/new`,
      cta:         'Añadir cliente →',
      done:        clientCount > 0,
    },
  ]

  const doneCount = steps.filter((s) => s.done).length

  // Ocultar cuando todo está completado
  if (doneCount === steps.length) return null

  const nextStep = steps.find((s) => !s.done)
  const pct = Math.round((doneCount / steps.length) * 100)

  return (
    <section className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold">Primeros pasos</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {doneCount === 0
              ? 'Completa estos pasos para sacar partido a MITIKUS desde el primer día.'
              : `${doneCount} de ${steps.length} completados · ¡Vas bien!`}
          </p>
        </div>
        {/* Barra de progreso */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-medium tabular-nums text-muted-foreground">{pct}%</span>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
              step.done
                ? 'bg-muted/30 opacity-60'
                : step.id === nextStep?.id
                  ? 'bg-primary/8 border border-primary/20'
                  : 'bg-muted/20'
            }`}
          >
            {/* Step indicator */}
            <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold border-2 transition-colors ${
              step.done
                ? 'bg-green-500 border-green-500 text-white'
                : step.id === nextStep?.id
                  ? 'border-primary text-primary'
                  : 'border-muted-foreground/30 text-muted-foreground/50'
            }`}>
              {step.done ? '✓' : i + 1}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${step.done ? 'line-through text-muted-foreground' : ''}`}>
                {step.label}
              </p>
              {!step.done && (
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              )}
            </div>

            {/* CTA */}
            {!step.done && (
              <Link
                href={step.href}
                className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  step.id === nextStep?.id
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border hover:bg-muted text-muted-foreground'
                }`}
              >
                {step.cta}
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
