'use client'

import { useState, useTransition } from 'react'
import { getWeekEntries, deleteEntry } from '@/app/actions/timelog'
import type { TimeEntryData } from '@/app/actions/timelog'
import { EditEntryModal } from './EditEntryModal'
import { ImputationPanel } from './ImputationPanel'

interface Props {
  workspaceId: string
  initialEntries: TimeEntryData[]
  weekStart: string
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(entry: TimeEntryData): string {
  if (!entry.clockOut) return '—'
  const ms = new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function WeekTable({ workspaceId, initialEntries, weekStart }: Props) {
  const [monday, setMonday] = useState<Date>(() => {
    const d = new Date(weekStart)
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [entries, setEntries] = useState<TimeEntryData[]>(initialEntries)
  const [editingEntry, setEditingEntry] = useState<TimeEntryData | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const sunday = addDays(monday, 6)

  function navigateWeek(delta: number) {
    startTransition(async () => {
      const newMonday = addDays(monday, delta * 7)
      setMonday(newMonday)
      const data = await getWeekEntries(workspaceId, newMonday)
      setEntries(data)
    })
  }

  function handleDelete(entryId: string) {
    startTransition(async () => {
      await deleteEntry(entryId, workspaceId)
      setEntries(prev => prev.filter(e => e.id !== entryId))
    })
  }

  function handleSaved(updated: TimeEntryData) {
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
    setEditingEntry(null)
  }

  const totalMs = entries.reduce((acc, e) => {
    if (!e.clockOut) return acc
    return acc + (new Date(e.clockOut).getTime() - new Date(e.clockIn).getTime())
  }, 0)
  const totalH = Math.floor(totalMs / 3600000)
  const totalM = Math.floor((totalMs % 3600000) / 60000)

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i)
    const dateStr = date.toISOString().slice(0, 10)
    const entry = entries.find(e => e.date === dateStr) ?? null
    return { date, dateStr, entry, dayName: DAY_NAMES[i] }
  })

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {monday.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} — {sunday.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={() => navigateWeek(-1)} disabled={isPending}
            className="text-xs px-2 py-1 rounded border hover:bg-muted/30 disabled:opacity-50">
            ← Anterior
          </button>
          <button onClick={() => navigateWeek(1)} disabled={isPending}
            className="text-xs px-2 py-1 rounded border hover:bg-muted/30 disabled:opacity-50">
            Siguiente →
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-card divide-y overflow-hidden">
        {days.map(({ date, dateStr, entry, dayName }) => {
          const isWeekend = date.getDay() === 0 || date.getDay() === 6
          const isExpanded = expandedId === entry?.id
          return (
            <div key={dateStr}>
              <div className={`flex items-center gap-4 px-4 py-3 ${isWeekend ? 'opacity-50' : ''}`}>
                <div className="w-10 shrink-0">
                  <p className="text-xs font-medium">{dayName}</p>
                  <p className="text-xs text-muted-foreground">{date.getDate()}</p>
                </div>
                <div className="flex-1 min-w-0">
                  {entry ? (
                    <div className="flex items-center gap-3 text-sm flex-wrap">
                      <span>{formatTime(entry.clockIn)}</span>
                      <span className="text-muted-foreground">→</span>
                      <span>{entry.clockOut
                        ? formatTime(entry.clockOut)
                        : <span className="text-green-600 dark:text-green-400">En curso</span>
                      }</span>
                      <span className="text-muted-foreground">{formatDuration(entry)}</span>
                      {entry.imputations.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          {entry.imputations.length} imput.
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">{isWeekend ? '—' : 'Sin fichar'}</span>
                  )}
                </div>
                {entry && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="text-xs text-primary hover:underline"
                      aria-label="Ver imputaciones"
                    >
                      {isExpanded ? 'Cerrar' : 'Imputaciones'}
                    </button>
                    <button
                      onClick={() => setEditingEntry(entry)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                      aria-label={`Editar fichaje del ${dayName}`}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={isPending}
                      className="text-xs text-destructive hover:text-destructive/80 disabled:opacity-50"
                      aria-label={`Eliminar fichaje del ${dayName}`}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
              {isExpanded && entry && (
                <div className="border-t bg-muted/10">
                  <ImputationPanel
                    workspaceId={workspaceId}
                    entry={entry}
                    onUpdated={(updated) => setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))}
                  />
                </div>
              )}
            </div>
          )
        })}

        <div className="flex items-center gap-4 px-4 py-3 bg-muted/20 font-semibold">
          <div className="w-10 shrink-0">
            <p className="text-xs">Total</p>
          </div>
          <p className="text-sm">{totalH}h {totalM.toString().padStart(2, '0')}m</p>
        </div>
      </div>

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          workspaceId={workspaceId}
          onClose={() => setEditingEntry(null)}
          onSaved={handleSaved}
        />
      )}
    </section>
  )
}
