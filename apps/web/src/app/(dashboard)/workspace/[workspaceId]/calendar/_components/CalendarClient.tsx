'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { createCalendarEvent, getCalendarItems, type CalendarClientOption, type CalendarItem } from '@/app/actions/calendar'

type ViewMode = 'day' | 'week' | 'month'

interface Props {
  workspaceId: string
  initialItems: CalendarItem[]
  clients: CalendarClientOption[]
  initialFrom: string
  initialTo: string
}

const TYPE_LABELS: Record<string, string> = {
  event: 'Evento',
  meeting: 'Reunión',
  call: 'Llamada',
  reminder: 'Recordatorio',
  deadline: 'Vencimiento',
  task: 'Tarea',
  invoice: 'Factura',
  google_event: 'Google Calendar',
  google: 'Google Calendar',
}

const SOURCE_STYLES: Record<string, string> = {
  event: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-200',
  task: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
  invoice: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200',
  google: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-200',
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

function toDateTimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

function startOfWeek(date: Date) {
  const next = startOfDay(date)
  const day = (next.getDay() + 6) % 7
  next.setDate(next.getDate() - day)
  return next
}

function endOfWeek(date: Date) {
  const next = startOfWeek(date)
  next.setDate(next.getDate() + 6)
  next.setHours(23, 59, 59, 999)
  return next
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

function getRange(date: Date, mode: ViewMode) {
  if (mode === 'day') return { from: startOfDay(date), to: endOfDay(date) }
  if (mode === 'week') return { from: startOfWeek(date), to: endOfWeek(date) }
  return { from: startOfMonth(date), to: endOfMonth(date) }
}

function formatRange(from: Date, to: Date, mode: ViewMode) {
  if (mode === 'day') {
    return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(from)
  }
  if (mode === 'week') {
    return `${new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(from)} - ${new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(to)}`
  }
  return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(from)
}

function groupByDay(items: CalendarItem[]) {
  return items.reduce<Record<string, CalendarItem[]>>((acc, item) => {
    const key = item.startsAt.slice(0, 10)
    acc[key] = acc[key] ?? []
    acc[key].push(item)
    return acc
  }, {})
}

async function fetchGoogleEvents(workspaceId: string, from: Date, to: Date): Promise<CalendarItem[]> {
  try {
    const params = new URLSearchParams({
      workspaceId,
      from: from.toISOString(),
      to: to.toISOString(),
    })
    const res = await fetch(`/api/integrations/calendar/google/events?${params.toString()}`)
    if (!res.ok) return []
    const data = await res.json() as { items?: CalendarItem[] }
    return data.items ?? []
  } catch {
    return []
  }
}

export function CalendarClient({ workspaceId, initialItems, clients, initialFrom }: Props) {
  const [items, setItems] = useState(initialItems)
  const [googleItems, setGoogleItems] = useState<CalendarItem[]>([])
  const [mode, setMode] = useState<ViewMode>('month')
  const [anchorDate, setAnchorDate] = useState(() => new Date(initialFrom))
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const range = useMemo(() => getRange(anchorDate, mode), [anchorDate, mode])
  const allItems = useMemo(() => [...items, ...googleItems].sort((a, b) => a.startsAt.localeCompare(b.startsAt)), [items, googleItems])
  const grouped = useMemo(() => groupByDay(allItems), [allItems])
  const days = useMemo(() => {
    const output: Date[] = []
    const cursor = new Date(range.from)
    while (cursor <= range.to) {
      output.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    return output
  }, [range.from, range.to])

  function refresh(date = anchorDate, nextMode = mode) {
    const nextRange = getRange(date, nextMode)
    startTransition(async () => {
      const [nextItems, nextGoogleItems] = await Promise.all([
        getCalendarItems(workspaceId, nextRange.from.toISOString(), nextRange.to.toISOString()),
        fetchGoogleEvents(workspaceId, nextRange.from, nextRange.to),
      ])
      setItems(nextItems)
      setGoogleItems(nextGoogleItems)
    })
  }

  // Cargar eventos de Google al montar
  useEffect(() => {
    fetchGoogleEvents(workspaceId, range.from, range.to).then(setGoogleItems).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function changeMode(nextMode: ViewMode) {
    setMode(nextMode)
    refresh(anchorDate, nextMode)
  }

  function move(delta: number) {
    const next = new Date(anchorDate)
    if (mode === 'day') next.setDate(next.getDate() + delta)
    if (mode === 'week') next.setDate(next.getDate() + delta * 7)
    if (mode === 'month') next.setMonth(next.getMonth() + delta)
    setAnchorDate(next)
    refresh(next, mode)
  }

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await createCalendarEvent(workspaceId, formData)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setShowForm(false)
    refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Calendario</h1>
          <p className="mt-1 text-sm text-muted-foreground">Reuniones, llamadas, recordatorios, tareas y vencimientos del workspace.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Nuevo evento
        </button>
      </div>

      {showForm && (
        <form action={handleSubmit} className="rounded-lg border border-border bg-card p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm font-medium">
              <span>Título</span>
              <input name="title" required className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Llamar a cliente" />
            </label>
            <label className="space-y-1 text-sm font-medium">
              <span>Tipo</span>
              <select name="type" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="event">Evento</option>
                <option value="meeting">Reunión</option>
                <option value="call">Llamada</option>
                <option value="reminder">Recordatorio</option>
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium">
              <span>Inicio</span>
              <input name="startsAt" type="datetime-local" required defaultValue={toDateTimeLocalValue(new Date())} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </label>
            <label className="space-y-1 text-sm font-medium">
              <span>Fin</span>
              <input name="endsAt" type="datetime-local" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </label>
            <label className="space-y-1 text-sm font-medium">
              <span>Cliente</span>
              <select name="clientId" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="">Sin cliente</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium">
              <span>Ubicación</span>
              <input name="location" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Oficina, teléfono, Meet..." />
            </label>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input name="allDay" type="checkbox" className="h-4 w-4" />
              Todo el día
            </label>
            <label className="space-y-1 text-sm font-medium md:col-span-2">
              <span>Notas</span>
              <textarea name="description" rows={3} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Detalles internos del evento" />
            </label>
          </div>
          {error && <p className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-border px-4 py-2 text-sm font-medium">Cancelar</button>
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Guardar evento</button>
          </div>
        </form>
      )}

      <section className="rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => move(-1)} className="rounded-md border border-border px-3 py-2 text-sm">Anterior</button>
            <button type="button" onClick={() => { const today = new Date(); setAnchorDate(today); refresh(today, mode) }} className="rounded-md border border-border px-3 py-2 text-sm">Hoy</button>
            <button type="button" onClick={() => move(1)} className="rounded-md border border-border px-3 py-2 text-sm">Siguiente</button>
          </div>
          <p className="text-sm font-semibold capitalize">{formatRange(range.from, range.to, mode)}</p>
          <div className="flex rounded-md border border-border p-1">
            {(['day', 'week', 'month'] as ViewMode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => changeMode(item)}
                className={`rounded px-3 py-1.5 text-sm ${mode === item ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {item === 'day' ? 'Día' : item === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border">
          {days.map((day) => {
            const key = toDateInputValue(day)
            const dayItems = grouped[key] ?? []
            return (
              <div key={key} className="grid gap-3 px-4 py-4 md:grid-cols-[160px_1fr]">
                <div>
                  <p className="text-sm font-semibold capitalize">{new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(day)}</p>
                  <p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(day)}</p>
                </div>
                <div className="space-y-2">
                  {dayItems.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">Sin eventos</p>
                  ) : dayItems.map((item) => (
                    <article key={`${item.source}-${item.id}`} className={`rounded-md border px-3 py-2 ${SOURCE_STYLES[item.source] ?? SOURCE_STYLES.event}`}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{item.title}</p>
                          <p className="text-xs opacity-80">
                            {item.allDay ? 'Todo el día' : new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.startsAt))}
                            {' · '}
                            {TYPE_LABELS[item.type] ?? TYPE_LABELS[item.source] ?? item.type}
                            {item.clientName ? ` · ${item.clientName}` : ''}
                          </p>
                          {item.description && <p className="mt-1 text-xs opacity-80">{item.description}</p>}
                        </div>
                        {item.href && <Link href={item.href} className="text-xs font-medium underline">Abrir</Link>}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {isPending && <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">Actualizando calendario...</p>}
      </section>
    </div>
  )
}
