import { db } from '@/lib/db'
import Link from 'next/link'
import { ToolCategory } from '@prisma/client'

// Días de periodicidad recomendada por categoría
const PERIODICITY_DAYS: Record<ToolCategory, number> = {
  AUDIT:      365,
  EVALUATION: 180,
  CHECKLIST:   30,
  CRM:          7,
  REPORT:      90,
  HR:          90,
  OPERATIONS:  30,
  FINANCE:     30,
  CUSTOM:      90,
}

const CATEGORY_LABEL: Record<ToolCategory, string> = {
  AUDIT:      'Auditoría',
  EVALUATION: 'Evaluación',
  CHECKLIST:  'Checklist',
  CRM:        'CRM',
  REPORT:     'Informe',
  HR:         'RRHH',
  OPERATIONS: 'Operaciones',
  FINANCE:    'Finanzas',
  CUSTOM:     'Personalizado',
}

function daysAgo(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

function urgencyLabel(days: number, periodicity: number): { text: string; className: string } {
  const ratio = days / periodicity
  if (ratio >= 1.5) return { text: 'Muy atrasada', className: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40' }
  if (ratio >= 1)   return { text: 'Atrasada',      className: 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/40' }
  return               { text: 'Próxima',       className: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40' }
}

interface Props {
  workspaceId: string
}

export async function PendingReviews({ workspaceId }: Props) {
  // Herramientas activas con su última ejecución completada
  const instances = await db.toolInstance.findMany({
    where: { workspaceId, status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      clientId: true,
      toolDefinition: { select: { category: true } },
      client: { select: { name: true } },
      toolExecutions: {
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true },
      },
    },
  })

  const now = Date.now()
  const pending = instances
    .map((inst) => {
      const cat = inst.toolDefinition.category
      const periodicity = PERIODICITY_DAYS[cat]
      const lastExec = inst.toolExecutions[0]?.createdAt ?? null
      const days = lastExec ? daysAgo(lastExec) : null

      // Mostrar si: nunca ejecutada, o lleva >80% de la periodicidad sin ejecutarse
      const overdue = days === null || days >= periodicity * 0.8
      return { inst, cat, periodicity, lastExec, days, overdue }
    })
    .filter((x) => x.overdue)
    .sort((a, b) => {
      // Primero las nunca ejecutadas, luego por ratio de retraso descendente
      const ratioA = a.days === null ? Infinity : a.days / a.periodicity
      const ratioB = b.days === null ? Infinity : b.days / b.periodicity
      return ratioB - ratioA
    })
    .slice(0, 5) // máximo 5 para no saturar

  if (pending.length === 0) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Revisiones pendientes</h2>
        <Link
          href={`/workspace/${workspaceId}/history`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Ver historial →
        </Link>
      </div>
      <div className="space-y-2">
        {pending.map(({ inst, cat, periodicity, days }) => {
          const urgency = urgencyLabel(days ?? periodicity * 2, periodicity)
          return (
            <div
              key={inst.id}
              className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 ${urgency.className}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium truncate">{inst.name}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    {CATEGORY_LABEL[cat]}
                  </span>
                  {inst.client && (
                    <span className="text-[10px] opacity-60">· {inst.client.name}</span>
                  )}
                </div>
                <p className="text-xs mt-0.5 opacity-80">
                  {days === null
                    ? 'Sin ejecutar todavía'
                    : `Última ejecución hace ${days} día${days !== 1 ? 's' : ''} · recomendada cada ${periodicity}d`}
                </p>
              </div>
              <Link
                href={`/workspace/${workspaceId}/tools/${inst.id}/run`}
                className="shrink-0 rounded-md bg-background/70 border border-current/20 px-3 py-1.5 text-xs font-semibold hover:bg-background transition-colors whitespace-nowrap"
              >
                Ejecutar →
              </Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}
