'use client'

import { useState, useEffect, useTransition } from 'react'
import { clockIn, clockOut } from '@/app/actions/timelog'
import type { TimeEntryData } from '@/app/actions/timelog'

interface Props {
  workspaceId: string
  initialEntry: TimeEntryData | null
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export function ClockWidget({ workspaceId, initialEntry }: Props) {
  const [entry, setEntry] = useState<TimeEntryData | null>(initialEntry)
  const [elapsed, setElapsed] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!entry || entry.clockOut) { setElapsed(''); return }
    const update = () => {
      const ms = Date.now() - new Date(entry.clockIn).getTime()
      setElapsed(formatDuration(ms))
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [entry])

  function handleClockIn() {
    setError(null)
    startTransition(async () => {
      try {
        const result = await clockIn(workspaceId)
        setEntry(result)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al fichar')
      }
    })
  }

  function handleClockOut() {
    setError(null)
    startTransition(async () => {
      try {
        const result = await clockOut(workspaceId)
        setEntry(result)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al fichar salida')
      }
    })
  }

  const isOpen = entry !== null && entry.clockOut === null

  return (
    <div className="rounded-xl border bg-card px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
        <div>
          {!entry && <p className="text-sm font-medium">Sin fichar</p>}
          {isOpen && (
            <>
              <p className="text-sm font-medium">Llevas <span className="text-muted-foreground">{elapsed}</span></p>
              <p className="text-xs text-muted-foreground">Entrada: {formatTime(entry.clockIn)}</p>
            </>
          )}
          {entry && entry.clockOut && (
            <>
              <p className="text-sm font-medium">
                {formatTime(entry.clockIn)} → {formatTime(entry.clockOut)}
                {' · '}
                {formatDuration(new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime())}
              </p>
              <p className="text-xs text-muted-foreground">Jornada completada</p>
            </>
          )}
          {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!entry && (
          <button
            onClick={handleClockIn}
            disabled={isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {isPending ? 'Fichando...' : 'Fichar entrada'}
          </button>
        )}
        {isOpen && (
          <button
            onClick={handleClockOut}
            disabled={isPending}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted/30 disabled:opacity-60 transition-colors"
          >
            {isPending ? 'Fichando...' : 'Fichar salida'}
          </button>
        )}
        {entry && entry.clockOut && (
          <a href={`/workspace/${workspaceId}/timelog`} className="text-xs text-primary hover:underline">
            Ver historial →
          </a>
        )}
      </div>
    </div>
  )
}
