import Link from 'next/link'
import type { FiscalEventWithStatus } from '@/lib/fiscal-calendar'

interface Props {
  workspaceId: string
  events: FiscalEventWithStatus[]
  hasProfile: boolean
}

export function FiscalWidget({ workspaceId, events, hasProfile }: Props) {
  const next = events.filter((e) => e.status === 'proximo' || e.status === 'pendiente')
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
    .slice(0, 3)

  if (!hasProfile) {
    return (
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Fiscal
        </h2>
        <div className="rounded-xl border border-dashed p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Configura tu perfil fiscal</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Activa el calendario de obligaciones tributarias para tu forma jurídica.
            </p>
          </div>
          <Link
            href={`/workspace/${workspaceId}/fiscal`}
            className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Configurar →
          </Link>
        </div>
      </section>
    )
  }

  if (next.length === 0) return null

  const CALCULABLE = ['303', '130', '111', '115']

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Próximas obligaciones fiscales
        </h2>
        <Link href={`/workspace/${workspaceId}/fiscal`} className="text-xs text-primary hover:underline">
          Ver calendario →
        </Link>
      </div>
      <div className="rounded-xl border bg-card divide-y overflow-hidden">
        {next.map((e) => {
          const isUrgent = e.status === 'proximo'
          const daysLabel = e.daysLeft !== null
            ? e.daysLeft === 0 ? 'Hoy' : `${e.daysLeft}d`
            : null

          return (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3">
              <div className={`shrink-0 text-sm font-bold w-10 text-center ${isUrgent ? 'text-amber-500' : 'text-primary'}`}>
                {e.modelo}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{e.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {e.deadline.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} · {e.periodo}
                </p>
              </div>
              {daysLabel && (
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${
                  isUrgent
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {daysLabel}
                </span>
              )}
              {CALCULABLE.includes(e.modelo) && (
                <Link
                  href={`/workspace/${workspaceId}/fiscal/${e.modelo}`}
                  className="shrink-0 text-xs text-primary hover:underline font-medium"
                >
                  Calcular →
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
