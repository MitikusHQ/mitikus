'use client'

import { useState, useEffect, useTransition } from 'react'
import { addImputation, deleteImputation, getImputationOptions } from '@/app/actions/timelog'
import type { TimeEntryData, ImputationOption } from '@/app/actions/timelog'

interface Props {
  workspaceId: string
  entry: TimeEntryData
  onUpdated: (updated: TimeEntryData) => void
}

export function ImputationPanel({ workspaceId, entry, onUpdated }: Props) {
  const [options, setOptions] = useState<ImputationOption | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [objectiveId, setObjectiveId] = useState('')
  const [clientId, setClientId] = useState('')
  const [hours, setHours] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getImputationOptions(workspaceId).then(setOptions)
  }, [workspaceId])

  function handleAdd() {
    const h = parseFloat(hours)
    if (isNaN(h) || h <= 0 || h > 24) {
      setError('Introduce un número de horas válido (0.5 – 24)')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const imp = await addImputation({
          timeEntryId: entry.id,
          workspaceId,
          objectiveId: objectiveId || undefined,
          clientId: clientId || undefined,
          hours: h,
          description: description || undefined,
        })
        onUpdated({ ...entry, imputations: [...entry.imputations, imp] })
        setShowForm(false)
        setObjectiveId('')
        setClientId('')
        setHours('')
        setDescription('')
      } catch (e) {
        setError('No se pudo añadir la imputación. Inténtalo de nuevo.')
      }
    })
  }

  function handleDelete(impId: string) {
    startTransition(async () => {
      try {
        await deleteImputation(impId, workspaceId)
        onUpdated({ ...entry, imputations: entry.imputations.filter(i => i.id !== impId) })
      } catch (e) {
        setError('No se pudo eliminar la imputación. Inténtalo de nuevo.')
      }
    })
  }

  return (
    <div className="px-4 py-3 space-y-3">
      {entry.imputations.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground">Sin imputaciones para este día.</p>
      )}

      {entry.imputations.map((imp) => (
        <div key={imp.id} className="flex items-center gap-3 text-sm">
          <div className="flex-1 min-w-0">
            <span className="font-medium">{imp.hours}h</span>
            {imp.objectiveLabel && (
              <span className="text-muted-foreground"> · {imp.objectiveLabel}</span>
            )}
            {imp.clientName && (
              <span className="text-muted-foreground"> · {imp.clientName}</span>
            )}
            {imp.description && (
              <span className="text-muted-foreground"> — {imp.description}</span>
            )}
          </div>
          <button
            onClick={() => handleDelete(imp.id)}
            disabled={isPending}
            aria-label="Eliminar imputación"
            className="text-xs text-destructive hover:text-destructive/80 disabled:opacity-50 shrink-0"
          >
            🗑️
          </button>
        </div>
      ))}

      {showForm && (
        <div className="space-y-2 pt-1 border-t">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Misión (opcional)</label>
              <select
                value={objectiveId}
                onChange={e => setObjectiveId(e.target.value)}
                className="w-full rounded-lg border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Sin misión</option>
                {options?.objectives.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.label}{o.clientName ? ` (${o.clientName})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Cliente (opcional)</label>
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="w-full rounded-lg border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Sin cliente</option>
                {options?.clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Horas *</label>
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={hours}
                onChange={e => setHours(e.target.value)}
                placeholder="ej. 2.5"
                className="w-full rounded-lg border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Descripción</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="ej. Reunión de kick-off"
                className="w-full rounded-lg border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(false); setError(null) }}
              disabled={isPending}
              className="text-xs px-3 py-1.5 rounded border hover:bg-muted/30 disabled:opacity-60 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={isPending}
              className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {isPending ? 'Añadiendo...' : 'Añadir'}
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs text-primary hover:underline"
        >
          + Añadir imputación
        </button>
      )}
    </div>
  )
}
