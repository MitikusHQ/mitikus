'use client'

import { useState, useTransition } from 'react'
import { updateEntry } from '@/app/actions/timelog'
import type { TimeEntryData } from '@/app/actions/timelog'

interface Props {
  entry: TimeEntryData
  workspaceId: string
  onClose: () => void
  onSaved: (updated: TimeEntryData) => void
}

export function EditEntryModal({ entry, workspaceId, onClose, onSaved }: Props) {
  const toTimeInput = (iso: string) => {
    const d = new Date(iso)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  const baseDate = entry.clockIn.slice(0, 10)

  const [clockInTime, setClockInTime] = useState(toTimeInput(entry.clockIn))
  const [clockOutTime, setClockOutTime] = useState(entry.clockOut ? toTimeInput(entry.clockOut) : '')
  const [editReason, setEditReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    if (!editReason.trim()) { setError('El motivo de corrección es obligatorio'); return }
    if (!clockOutTime) { setError('Indica la hora de salida'); return }
    setError(null)
    startTransition(async () => {
      try {
        const updated = await updateEntry(entry.id, workspaceId, {
          clockIn: `${baseDate}T${clockInTime}:00`,
          clockOut: `${baseDate}T${clockOutTime}:00`,
          editReason,
        })
        onSaved(updated)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al guardar')
      }
    })
  }

  const dayLabel = new Date(entry.date + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-lg space-y-4">
        <h2 className="text-base font-semibold">Editar fichaje</h2>
        <p className="text-xs text-muted-foreground capitalize">{dayLabel}</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Entrada</label>
            <input type="time" value={clockInTime} onChange={e => setClockInTime(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Salida</label>
            <input type="time" value={clockOutTime} onChange={e => setClockOutTime(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Motivo de corrección *</label>
          <input type="text" value={editReason} onChange={e => setEditReason(e.target.value)}
            placeholder="ej. Olvidé fichar la salida"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            disabled={isPending}
            className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-muted/30 disabled:opacity-60 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={isPending}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
