'use client'

import { useState } from 'react'
import type { InvoiceData } from '@/app/actions/invoices'
import { updateInvoice, deleteInvoice, sendInvoiceToClient, syncInvoiceRepliesForWorkspace, createRectificativeInvoice } from '@/app/actions/invoices'
import { InvoiceModal } from './InvoiceModal'

interface Client { id: string; name: string; contactName?: string | null; email?: string; taxId?: string | null }

interface Props {
  workspaceId: string
  initialInvoices: InvoiceData[]
  clients: Client[]
  defaultPaymentNotes?: string
}

const IMMUTABLE_STATUSES = ['enviada', 'pagada', 'vencida', 'cancelada']

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

export function InvoicesClient({ workspaceId, initialInvoices, clients, defaultPaymentNotes = '' }: Props) {
  const [invoices, setInvoices]   = useState<InvoiceData[]>(initialInvoices)
  const [selected, setSelected]   = useState<InvoiceData | null>(null)
  const [showModal, setShowModal]         = useState(false)
  const [editing, setEditing]             = useState<InvoiceData | null>(null)
  const [deleting, setDeleting]           = useState<string | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailTo, setEmailTo]             = useState('')
  const [emailRecipientName, setEmailRecipientName] = useState('')
  const [emailSending, setEmailSending]   = useState(false)
  const [emailSent, setEmailSent]         = useState(false)
  const [emailError, setEmailError]       = useState<string | null>(null)
  const [syncingReplies, setSyncingReplies] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [showRectModal, setShowRectModal] = useState(false)
  const [rectMotivo, setRectMotivo]       = useState('')
  const [creatingRect, setCreatingRect]   = useState(false)
  const [rectError, setRectError]         = useState<string | null>(null)

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
    const client = clients.find((c) => c.id === inv.clientId)
    setEmailTo(client?.email ?? '')
    setEmailRecipientName(client?.contactName?.trim() || client?.name || inv.clientName || '')
    setEmailSent(false)
    setEmailError(null)
    setShowEmailModal(true)
  }

  async function handleSendEmail() {
    if (!selected || !emailTo || emailSending) return
    setEmailSending(true)
    setEmailError(null)
    try {
      const result = await sendInvoiceToClient(workspaceId, selected.id, emailTo, emailRecipientName)
      if ('error' in result) {
        setEmailError(result.error)
        return
      }
      setInvoices(prev => prev.map(i => i.id === result.invoice.id ? result.invoice : i))
      setSelected(result.invoice)
      setEmailSent(true)
    } catch {
      setEmailError('No se pudo enviar la factura. Comprueba que tienes correo configurado en Ajustes → Correo y envíos.')
    } finally {
      setEmailSending(false)
    }
  }

  async function handleSyncReplies() {
    if (syncingReplies) return
    setSyncingReplies(true)
    setSyncMessage(null)
    try {
      const result = await syncInvoiceRepliesForWorkspace(workspaceId)
      if (result.imported > 0) {
        window.location.reload()
        return
      }
      setSyncMessage('Sin respuestas nuevas por ahora.')
    } catch {
      setSyncMessage('No se han podido revisar las respuestas del buzón.')
    } finally {
      setSyncingReplies(false)
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

  async function handleCreateRectificative() {
    if (!selected || creatingRect) return
    const motivo = rectMotivo.trim()
    if (!motivo) { setRectError('Indica el motivo de la rectificación'); return }
    setCreatingRect(true)
    setRectError(null)
    try {
      const rect = await createRectificativeInvoice(workspaceId, selected.id, motivo)
      setInvoices(prev => [rect, ...prev])
      setSelected(rect)
      setShowRectModal(false)
      setRectMotivo('')
    } catch (e) {
      setRectError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setCreatingRect(false)
    }
  }

  const st = selected ? (STATUS_LABELS[selected.status] ?? STATUS_LABELS['borrador']!) : null

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Emitido este mes',  value: fmt(totalMes),       accent: false },
          { label: 'Pendiente de cobro', value: fmt(totalPendiente), accent: true  },
          { label: 'Cobrado total',      value: fmt(totalPagado),    accent: false },
        ].map(s => (
          <div key={s.label} className="min-w-0 bg-background border border-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
            <div className={`truncate text-lg font-semibold font-mono ${s.accent ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-5">
        {/* List */}
        <div className="min-w-0 lg:col-span-2 bg-background border border-border rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-medium text-foreground">
              {invoices.length} factura{invoices.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => { setEditing(null); setShowModal(true) }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <span>+</span> Nueva factura
            </button>
          </div>

          {invoices.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-muted-foreground">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-30"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              <p className="text-sm">No hay facturas todavía</p>
              <button onClick={() => { setEditing(null); setShowModal(true) }}
                className="mt-3 text-xs text-primary hover:underline">
                Crear primera factura
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {invoices.map(inv => {
                const s = STATUS_LABELS[inv.status] ?? STATUS_LABELS['borrador']!
                const isActive = selected?.id === inv.id
                return (
                  <button
                    key={inv.id}
                    onClick={() => setSelected(inv)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${isActive ? 'bg-muted/50' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{inv.number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-xs text-muted-foreground">
                        {inv.clientName ?? 'Sin cliente'} · {new Date(inv.date).toLocaleDateString('es-ES')}
                      </span>
                      <span className="whitespace-nowrap text-sm font-mono font-semibold text-foreground">
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
        <div className="min-w-0 lg:col-span-3 bg-background border border-border rounded-xl overflow-hidden">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full py-24 text-muted-foreground">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-30"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <p className="text-sm">Selecciona una factura para ver el detalle</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Detail header */}
              <div className="flex flex-col gap-3 px-5 py-4 border-b border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="whitespace-nowrap font-semibold text-foreground">{selected.number}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st?.color}`}>{st?.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selected.clientName ?? 'Sin cliente'} · {new Date(selected.date).toLocaleDateString('es-ES')}
                    {selected.dueDate && ` · Vence ${new Date(selected.dueDate).toLocaleDateString('es-ES')}`}
                  </p>
                  </div>
                </div>
                <div className="flex max-w-full flex-wrap items-center gap-2">
                  <a
                    href={`/api/workspace/${workspaceId}/invoices/${selected.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    PDF
                  </a>
                  <button
                    onClick={() => openEmailModal(selected)}
                    className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Enviar
                  </button>
                  <button
                    onClick={handleSyncReplies}
                    disabled={syncingReplies}
                    className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {syncingReplies ? 'Revisando...' : 'Revisar respuestas'}
                  </button>
                  <button
                    onClick={() => { setEditing(selected); setShowModal(true) }}
                    className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {IMMUTABLE_STATUSES.includes(selected.status) ? 'Ver detalle' : 'Editar'}
                  </button>
                  {IMMUTABLE_STATUSES.includes(selected.status) && (
                  <button
                    onClick={() => { setRectMotivo(''); setRectError(null); setShowRectModal(true) }}
                    className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    Crear rectificativa
                  </button>
                  )}
                  {!IMMUTABLE_STATUSES.includes(selected.status) && (
                  <button
                    onClick={() => handleDelete(selected)}
                    disabled={deleting === selected.id}
                    className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 dark:border-red-900 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                  )}
                </div>
              </div>

              {/* Items table */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4">
                <div className="border border-border rounded-lg overflow-hidden mb-4">
                  <table className="w-full table-fixed text-sm">
                    <thead className="bg-muted/50 text-muted-foreground text-xs">
                      <tr>
                        <th className="w-[36%] text-left px-3 py-2 font-medium">Descripción</th>
                        <th className="w-[16%] text-right px-2 py-2 font-medium">Cant.</th>
                        <th className="w-[22%] text-right px-2 py-2 font-medium">P. unit.</th>
                        <th className="w-[26%] text-right px-3 py-2 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items.map((item, idx) => (
                        <tr key={idx} className="border-t border-border">
                          <td className="break-words px-3 py-2 text-foreground">{item.description}</td>
                          <td className="px-2 py-2 text-right text-muted-foreground font-mono">{item.qty}</td>
                          <td className="px-2 py-2 text-right text-muted-foreground font-mono">{item.unitPrice.toFixed(2)}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-right text-xs text-foreground font-mono">{item.total.toFixed(2)} {selected.currency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-4">
                  <div className="w-full max-w-64 space-y-1 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span><span className="font-mono">{fmt(selected.subtotal, selected.currency)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>IVA ({selected.taxRate}%)</span><span className="font-mono">{fmt(selected.tax, selected.currency)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-foreground border-t border-border pt-1">
                      <span>Total</span><span className="font-mono">{fmt(selected.total, selected.currency)}</span>
                    </div>
                  </div>
                </div>

                {/* Estado rápido */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <span className="shrink-0 text-xs text-muted-foreground">Cambiar estado:</span>
                  <div className="flex min-w-0 flex-wrap gap-2">
                    {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => (
                      <button
                        key={key}
                        onClick={() => handleStatusChange(selected, key)}
                        disabled={selected.status === key}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-opacity ${color} ${selected.status === key ? 'opacity-100 ring-2 ring-offset-1 ring-primary' : 'opacity-60 hover:opacity-100'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {syncMessage && (
                  <div className="mb-4 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    {syncMessage}
                  </div>
                )}

                {selected.notes && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                    {selected.notes}
                  </div>
                )}
                {selected.mailMessages.length > 0 && (
                  <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold text-foreground">Correos</h4>
                      <span className="text-xs text-muted-foreground">{selected.mailMessages.length}</span>
                    </div>
                    <div className="space-y-2">
                      {selected.mailMessages.map((message) => (
                        <div key={message.id} className="rounded-md border border-border bg-background p-3 text-xs">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 font-medium ${message.direction === 'inbound' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                              {message.direction === 'inbound' ? 'Respuesta recibida' : 'Enviado'}
                            </span>
                            <span className="text-muted-foreground">
                              {new Date(message.sentAt ?? message.createdAt).toLocaleString('es-ES')}
                            </span>
                          </div>
                          <div className="font-medium text-foreground">{message.subject}</div>
                          <div className="mt-1 text-muted-foreground">
                            {message.direction === 'inbound'
                              ? `De: ${message.fromName}${message.fromEmail ? ` <${message.fromEmail}>` : ''}`
                              : `Para: ${message.toEmail}`}
                          </div>
                          {message.direction === 'inbound' && message.body && (
                            <p className="mt-2 whitespace-pre-wrap rounded bg-muted/40 p-2 text-muted-foreground">
                              {message.body}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showRectModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Crear factura rectificativa</h3>
            <p className="text-sm text-muted-foreground">
              Se creará una factura rectificativa (tipo R1) en borrador referenciando la factura{' '}
              <strong>{selected.number}</strong>. Los importes se copiarán en negativo para que los revises.
            </p>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Motivo de la rectificación</label>
              <textarea
                value={rectMotivo}
                onChange={(e) => setRectMotivo(e.target.value)}
                placeholder="Ej: Error en importe, devolución parcial de servicio..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
            {rectError && <p className="text-xs text-red-600 dark:text-red-400">{rectError}</p>}
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setShowRectModal(false)}
                className="px-4 py-2 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateRectificative}
                disabled={creatingRect}
                className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {creatingRect ? 'Creando...' : 'Crear rectificativa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmailModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Enviar factura al cliente</h3>
            {emailSent ? (
              <div className="text-sm text-emerald-600 dark:text-emerald-400 py-4 text-center">
                ✓ Factura enviada correctamente.
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Dirigido a</label>
                  <input
                    type="text"
                    value={emailRecipientName}
                    onChange={(e) => setEmailRecipientName(e.target.value)}
                    placeholder="Persona de contacto o cliente"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Email del cliente</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="cliente@empresa.com"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  MITIKUS enviará la factura <strong>{selected.number}</strong> usando la identidad de correo configurada. Si el envío falla, la factura no se marcará como enviada.
                </p>
                {emailError && (
                  <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300 space-y-1.5">
                    <p>{emailError}</p>
                    <p>
                      Revisa la configuración de correo en{' '}
                      <a
                        href={`/workspace/${workspaceId}/settings`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 font-medium hover:opacity-80"
                      >
                        Ajustes → Correo y envíos
                      </a>
                      .
                    </p>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 text-xs font-medium border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                {emailSent ? 'Cerrar' : 'Cancelar'}
              </button>
              {!emailSent && (
                <button
                  onClick={handleSendEmail}
                  disabled={emailSending || !emailTo}
                  className="px-4 py-2 text-xs font-medium bg-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {emailSending ? 'Enviando...' : 'Enviar factura'}
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
          defaultPaymentNotes={defaultPaymentNotes}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}
