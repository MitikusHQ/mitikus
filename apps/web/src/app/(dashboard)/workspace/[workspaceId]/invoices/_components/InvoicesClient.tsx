'use client'

import { useState } from 'react'
import type { InvoiceData } from '@/app/actions/invoices'
import { updateInvoice, deleteInvoice } from '@/app/actions/invoices'
import { InvoiceModal } from './InvoiceModal'

interface Client { id: string; name: string; email?: string }

interface Props {
  workspaceId: string
  initialInvoices: InvoiceData[]
  clients: Client[]
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  borrador:  { label: 'Borrador',  color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  enviada:   { label: 'Enviada',   color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  pagada:    { label: 'Pagada',    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  vencida:   { label: 'Vencida',   color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500' },
}

function fmt(n: number, currency = 'EUR') {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + currency
}

export function InvoicesClient({ workspaceId, initialInvoices, clients }: Props) {
  const [invoices, setInvoices]   = useState<InvoiceData[]>(initialInvoices)
  const [selected, setSelected]   = useState<InvoiceData | null>(null)
  const [showModal, setShowModal]         = useState(false)
  const [editing, setEditing]             = useState<InvoiceData | null>(null)
  const [deleting, setDeleting]           = useState<string | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailTo, setEmailTo]             = useState('')
  const [emailSending, setEmailSending]   = useState(false)
  const [emailSent, setEmailSent]         = useState(false)

  // Stats
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const totalMes       = invoices.filter(i => new Date(i.createdAt) >= startOfMonth).reduce((s, i) => s + i.total, 0)
  const totalPendiente = invoices.filter(i => i.status === 'enviada').reduce((s, i) => s + i.total, 0)
  const totalPagado    = invoices.filter(i => i.status === 'pagada').reduce((s, i) => s + i.total, 0)

  function onSaved(inv: InvoiceData) {
    setInvoices(prev => {
      const idx = prev.findIndex(i => i.id === inv.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = inv; return next }
      return [inv, ...prev]
    })
    setShowModal(false)
    setEditing(null)
    setSelected(inv)
  }

  async function handleStatusChange(inv: InvoiceData, status: string) {
    const updated = await updateInvoice(workspaceId, inv.id, { status })
    setInvoices(prev => prev.map(i => i.id === updated.id ? updated : i))
    if (selected?.id === inv.id) setSelected(updated)
  }

  function openEmailModal(inv: InvoiceData) {
    const clientEmail = clients.find((c) => c.id === inv.clientId)?.email ?? ''
    setEmailTo(clientEmail)
    setEmailSent(false)
    setShowEmailModal(true)
  }

  async function handleSendEmail() {
    if (!selected || !emailTo) return
    setEmailSending(true)
    try {
      await updateInvoice(workspaceId, selected.id, { status: 'enviada' })
      setInvoices(prev => prev.map(i => i.id === selected.id ? { ...i, status: 'enviada' } : i))
      setSelected(prev => prev ? { ...prev, status: 'enviada' } : prev)
      setEmailSent(true)
    } finally {
      setEmailSending(false)
    }
  }

  async function handleDelete(inv: InvoiceData) {
    if (!confirm(`¿Eliminar factura ${inv.number}?`)) return
    setDeleting(inv.id)
    await deleteInvoice(workspaceId, inv.id)
    setInvoices(prev => prev.filter(i => i.id !== inv.id))
    if (selected?.id === inv.id) setSelected(null)
    setDeleting(null)
  }

  const st = selected ? (STATUS_LABELS[selected.status] ?? STATUS_LABELS['borrador']!) : null

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Emitido este mes',  value: fmt(totalMes),       accent: false },
          { label: 'Pendiente de cobro', value: fmt(totalPendiente), accent: true  },
          { label: 'Cobrado total',      value: fmt(totalPagado),    accent: false },
        ].map(s => (
          <div key={s.label} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">{s.label}</div>
            <div className={`text-lg font-semibold font-mono ${s.accent ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--color-text-primary)]'}`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* List */}
        <div className="lg:col-span-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {invoices.length} factura{invoices.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => { setEditing(null); setShowModal(true) }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <span>+</span> Nueva factura
            </button>
          </div>

          {invoices.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-[var(--color-text-secondary)]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-30"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              <p className="text-sm">No hay facturas todavía</p>
              <button onClick={() => { setEditing(null); setShowModal(true) }}
                className="mt-3 text-xs text-[var(--color-accent)] hover:underline">
                Crear primera factura
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border)]">
              {invoices.map(inv => {
                const s = STATUS_LABELS[inv.status] ?? STATUS_LABELS['borrador']!
                const isActive = selected?.id === inv.id
                return (
                  <button
                    key={inv.id}
                    onClick={() => setSelected(inv)}
                    className={`w-full text-left px-4 py-3 hover:bg-[var(--color-surface-raised)] transition-colors ${isActive ? 'bg-[var(--color-surface-raised)]' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{inv.number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {inv.clientName ?? 'Sin cliente'} · {new Date(inv.date).toLocaleDateString('es-ES')}
                      </span>
                      <span className="text-sm font-mono font-semibold text-[var(--color-text-primary)]">
                        {fmt(inv.total, inv.currency)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full py-24 text-[var(--color-text-secondary)]">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-30"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <p className="text-sm">Selecciona una factura para ver el detalle</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Detail header */}
              <div className="flex items-start justify-between px-5 py-4 border-b border-[var(--color-border)]">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-[var(--color-text-primary)]">{selected.number}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st?.color}`}>{st?.label}</span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {selected.clientName ?? 'Sin cliente'} · {new Date(selected.date).toLocaleDateString('es-ES')}
                    {selected.dueDate && ` · Vence ${new Date(selected.dueDate).toLocaleDateString('es-ES')}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/workspace/${workspaceId}/invoices/${selected.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    PDF
                  </a>
                  <button
                    onClick={() => openEmailModal(selected)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Enviar
                  </button>
                  <button
                    onClick={() => { setEditing(selected); setShowModal(true) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(selected)}
                    disabled={deleting === selected.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 dark:border-red-900 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Items table */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="border border-[var(--color-border)] rounded-lg overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] text-xs">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Descripción</th>
                        <th className="text-right px-3 py-2 font-medium">Cant.</th>
                        <th className="text-right px-3 py-2 font-medium">P. unit.</th>
                        <th className="text-right px-3 py-2 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items.map((item, idx) => (
                        <tr key={idx} className="border-t border-[var(--color-border)]">
                          <td className="px-3 py-2 text-[var(--color-text-primary)]">{item.description}</td>
                          <td className="px-3 py-2 text-right text-[var(--color-text-secondary)] font-mono">{item.qty}</td>
                          <td className="px-3 py-2 text-right text-[var(--color-text-secondary)] font-mono">{item.unitPrice.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right text-[var(--color-text-primary)] font-mono">{item.total.toFixed(2)} {selected.currency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-4">
                  <div className="w-56 space-y-1 text-sm">
                    <div className="flex justify-between text-[var(--color-text-secondary)]">
                      <span>Subtotal</span><span className="font-mono">{fmt(selected.subtotal, selected.currency)}</span>
                    </div>
                    <div className="flex justify-between text-[var(--color-text-secondary)]">
                      <span>IVA ({selected.taxRate}%)</span><span className="font-mono">{fmt(selected.tax, selected.currency)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-[var(--color-text-primary)] border-t border-[var(--color-border)] pt-1">
                      <span>Total</span><span className="font-mono">{fmt(selected.total, selected.currency)}</span>
                    </div>
                  </div>
                </div>

                {/* Estado rápido */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--color-text-secondary)]">Cambiar estado:</span>
                  {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => (
                    <button
                      key={key}
                      onClick={() => handleStatusChange(selected, key)}
                      disabled={selected.status === key}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-opacity ${color} ${selected.status === key ? 'opacity-100 ring-2 ring-offset-1 ring-[var(--color-accent)]' : 'opacity-60 hover:opacity-100'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {selected.notes && (
                  <div className="mt-4 p-3 bg-[var(--color-surface-raised)] rounded-lg text-sm text-[var(--color-text-secondary)]">
                    {selected.notes}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEmailModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-[var(--color-text-primary)]">Enviar factura al cliente</h3>
            {emailSent ? (
              <div className="text-sm text-emerald-600 dark:text-emerald-400 py-4 text-center">
                ✓ Estado actualizado a &ldquo;Enviada&rdquo;.<br/>
                <span className="text-xs text-[var(--color-text-secondary)]">Configura Resend para envío real de emails.</span>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-secondary)] block mb-1">Email del cliente</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="cliente@empresa.com"
                    className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                </div>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Se adjuntará el PDF de la factura <strong>{selected.number}</strong> y el estado cambiará a &ldquo;Enviada&rdquo;.
                  El envío real de email requiere configurar Resend.
                </p>
              </>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 text-xs font-medium border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                {emailSent ? 'Cerrar' : 'Cancelar'}
              </button>
              {!emailSent && (
                <button
                  onClick={handleSendEmail}
                  disabled={emailSending || !emailTo}
                  className="px-4 py-2 text-xs font-medium bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {emailSending ? 'Guardando...' : 'Marcar como enviada'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <InvoiceModal
          workspaceId={workspaceId}
          clients={clients}
          invoice={editing}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}
