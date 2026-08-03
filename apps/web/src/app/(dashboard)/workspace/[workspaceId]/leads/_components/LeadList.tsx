'use client'

import { useState } from 'react'
import type { WorkspaceLead, LeadStatus } from '@prisma/client'
import { cn } from '@/lib/utils'
import { updateLeadStatus, convertLeadToClient, deleteLead, updateLeadNotes } from '@/lib/leads'

const STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'NUEVO',       label: 'Nuevo',       color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'CONTACTADO',  label: 'Contactado',  color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  { value: 'CUALIFICADO', label: 'Cualificado', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { value: 'PERDIDO',     label: 'Perdido',     color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
]

function statusStyle(s: LeadStatus) {
  return STATUSES.find(x => x.value === s)?.color ?? ''
}
function statusLabel(s: LeadStatus) {
  return STATUSES.find(x => x.value === s)?.label ?? s
}

interface Props {
  leads: WorkspaceLead[]
  byStatus: Record<LeadStatus, WorkspaceLead[]>
  workspaceId: string
}

export function LeadList({ leads, workspaceId }: Props) {
  const [selected, setSelected] = useState<WorkspaceLead | null>(null)
  const [notes, setNotes]       = useState('')
  const [saving, setSaving]     = useState(false)

  function openLead(lead: WorkspaceLead) {
    setSelected(lead)
    setNotes(lead.notes ?? '')
  }

  async function changeStatus(lead: WorkspaceLead, status: LeadStatus) {
    await updateLeadStatus(lead.id, status)
    if (selected?.id === lead.id) setSelected({ ...lead, status })
  }

  async function saveNotes() {
    if (!selected) return
    setSaving(true)
    await updateLeadNotes(selected.id, notes)
    setSaving(false)
  }

  async function handleConvert(lead: WorkspaceLead) {
    if (!confirm(`¿Convertir a ${lead.name} en cliente?`)) return
    await convertLeadToClient(lead.id)
    setSelected(null)
  }

  async function handleDelete(lead: WorkspaceLead) {
    if (!confirm(`¿Eliminar el lead de ${lead.name}?`)) return
    await deleteLead(lead.id)
    if (selected?.id === lead.id) setSelected(null)
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl mx-auto">🎯</div>
        <div className="space-y-1">
          <p className="font-semibold text-base">Aún no tienes leads</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Comparte el enlace del formulario y empieza a captar potenciales clientes.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-6 min-h-0">
      {/* Lista */}
      <div className="flex-1 min-w-0">
        {/* Cabecera de columnas */}
        <div className="grid grid-cols-[1fr_120px_100px_80px] gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 border-b">
          <span>Nombre</span>
          <span>Estado</span>
          <span>Empresa</span>
          <span>Fecha</span>
        </div>
        <div className="divide-y">
          {leads.map(lead => (
            <button
              key={lead.id}
              type="button"
              onClick={() => openLead(lead)}
              className={cn(
                'w-full grid grid-cols-[1fr_120px_100px_80px] gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors',
                selected?.id === lead.id && 'bg-muted/50',
              )}
            >
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{lead.name}</p>
                <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
              </div>
              <div>
                <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-medium', statusStyle(lead.status))}>
                  {statusLabel(lead.status)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate self-center">{lead.company ?? '—'}</p>
              <p className="text-xs text-muted-foreground self-center">
                {new Date(lead.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Panel detalle */}
      {selected && (
        <div className="w-80 shrink-0 rounded-xl border bg-card p-5 space-y-5 self-start sticky top-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-sm">{selected.name}</p>
              <p className="text-xs text-muted-foreground">{selected.email}</p>
            </div>
            <button type="button" onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
          </div>

          {(selected.company || selected.phone) && (
            <dl className="text-xs space-y-1">
              {selected.company && <div className="flex gap-2"><dt className="text-muted-foreground w-16 shrink-0">Empresa</dt><dd>{selected.company}</dd></div>}
              {selected.phone   && <div className="flex gap-2"><dt className="text-muted-foreground w-16 shrink-0">Teléfono</dt><dd>{selected.phone}</dd></div>}
            </dl>
          )}

          {selected.message && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Mensaje</p>
              <p className="text-xs text-muted-foreground">{selected.message}</p>
            </div>
          )}

          {/* Estado */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">Estado</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => changeStatus(selected, s.value)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[10px] font-medium border transition-colors',
                    selected.status === s.value ? s.color + ' border-transparent' : 'border-border text-muted-foreground hover:bg-muted',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Notas internas</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Añade notas sobre este lead..."
            />
            <button
              type="button"
              onClick={saveNotes}
              disabled={saving}
              className="mt-1.5 text-xs text-primary hover:underline disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar notas'}
            </button>
          </div>

          {/* Acciones */}
          <div className="flex flex-col gap-2 pt-1">
            {!selected.convertedToClientId && (
              <button
                type="button"
                onClick={() => handleConvert(selected)}
                className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Convertir a cliente
              </button>
            )}
            {selected.convertedToClientId && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 text-center">✓ Convertido en cliente</p>
            )}
            <button
              type="button"
              onClick={() => handleDelete(selected)}
              className="rounded-md border border-red-300 text-red-600 dark:text-red-400 px-3 py-2 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              Eliminar lead
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
