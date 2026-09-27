import Link from 'next/link'
import type { CalendarItem } from '@/app/actions/calendar'
import type { Locale } from '@/i18n/config'

interface Props {
  workspaceId: string
  items: CalendarItem[]
  locale: Locale
}

const TYPE_LABELS: Record<string, string> = {
  event: 'Evento',
  meeting: 'Reunión',
  call: 'Llamada',
  reminder: 'Recordatorio',
  task: 'Tarea',
  invoice: 'Factura',
}

const SOURCE_DOT: Record<string, string> = {
  event: 'bg-blue-500',
  task: 'bg-emerald-500',
  invoice: 'bg-amber-500',
}

function formatTime(item: CalendarItem, locale: Locale) {
  if (item.allDay) return 'Todo el día'
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(item.startsAt))
}

export function CalendarWidget({ workspaceId, items, locale }: Props) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Agenda de hoy</h2>
        <Link href={`/workspace/${workspaceId}/calendar`} className="text-xs text-primary hover:underline">
          Ver calendario →
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {items.length === 0 ? (
          <div className="px-4 py-5">
            <p className="text-sm font-medium">No tienes eventos para hoy.</p>
            <p className="mt-1 text-xs text-muted-foreground">Crea reuniones, llamadas y recordatorios desde el calendario.</p>
            <Link
              href={`/workspace/${workspaceId}/calendar`}
              className="mt-3 inline-flex rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
            >
              Abrir calendario
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.slice(0, 5).map((item) => (
              <div key={`${item.source}-${item.id}`} className="flex items-start gap-3 px-4 py-3">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SOURCE_DOT[item.source] ?? SOURCE_DOT.event}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {TYPE_LABELS[item.type] ?? TYPE_LABELS[item.source] ?? item.type}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatTime(item, locale)}
                    {item.clientName ? ` · ${item.clientName}` : ''}
                  </p>
                </div>
                {item.href ? (
                  <Link href={item.href} className="shrink-0 text-xs font-medium text-primary hover:underline">
                    Abrir
                  </Link>
                ) : null}
              </div>
            ))}
            {items.length > 5 && (
              <div className="px-4 py-2.5">
                <Link href={`/workspace/${workspaceId}/calendar`} className="text-xs text-primary hover:underline">
                  Ver {items.length - 5} más →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
