'use client'

import { useState, useEffect, useCallback } from 'react'
import type { InvoiceData, InvoiceItem, InvoiceInput } from '@/app/actions/invoices'
import { createInvoice, updateInvoice, getNextInvoiceNumber } from '@/app/actions/invoices'

interface Client { id: string; name: string }

interface Props {
  workspaceId: string
  clients: Client[]
  invoice?: InvoiceData | null
  onClose: () => void
  onSaved: (inv: InvoiceData) => void
}

const EMPTY_ITEM: InvoiceItem = { description: '', qty: 1, unitPrice: 0, total: 0 }

export function InvoiceModal({ workspaceId, clients, invoice, onClose, onSaved }: Props) {
  const [number, setNumber]   = useState(invoice?.number ?? '')
  const [clientId, setClientId] = useState(invoice?.clientId ?? '')
  const [date, setDate]       = useState(invoice?.date ? invoice.date.slice(0, 10) : new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState(invoice?.dueDate ? invoice.dueDate.slice(0, 10) : '')
  const [status, setStatus]   = useState(invoice?.status ?? 'borrador')
  const [items, setItems]     = useState<InvoiceItem[]>(invoice?.items?.length ? invoice.items : [{ ...EMPTY_ITEM }])
  const [taxRate, setTaxRate] = useState(invoice?.taxRate ?? 21)
  const [currency, setCurrency] = useState(invoice?.currency ?? 'EUR')
  const [notes, setNotes]     = useState(invoice?.notes ?? '')
  const [saving, setSaving]   = useState(false)

  const subtotal = items.reduce((s, i) => s + i.total, 0)
  const tax      = Math.round(subtotal * taxRate) / 100
  const total    = subtotal + tax

  useEffect(() => {
    if (!invoice) {
      getNextInvoiceNumber(workspaceId).then(setNumber)
    }
  }, [workspaceId, invoice])

  const updateItem = useCallback((idx: number, field: keyof InvoiceItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [field]: value }
      if (field === 'qty' || field === 'unitPrice') {
        updated.total = Math.round(Number(updated.qty) * Number(updated.unitPrice) * 100) / 100
      }
      return updated
    }))
  }, [])

  const addItem    = () => setItems(prev => [...prev, { ...EMPTY_ITEM }])
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))

  async function handleSave() {
    if (!number.trim()) return
    setSaving(true)
    try {
      const payload: InvoiceInput = {
        number,
        clientId: clientId || null,
        date,
        dueDate: dueDate || null,
        status,
        items,
        subtotal,
        taxRate,
        tax,
        total,
        currency,
        notes: notes || null,
      }
      const saved = invoice
        ? await updateInvoice(workspaceId, invoice.id, payload)
        : await createInvoice(workspaceId, payload)
      onSaved(saved)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">
            {invoice ? `Editar factura ${invoice.number}` : 'Nueva factura'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Número *</label>
              <input
                value={number}
                onChange={e => setNumber(e.target.value)}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Cliente</label>
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">— Sin cliente —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Fecha</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Vencimiento</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Estado</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="borrador">Borrador</option>
                <option value="enviada">Enviada</option>
                <option value="pagada">Pagada</option>
                <option value="vencida">Vencida</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">Líneas</label>
              <button onClick={addItem} className="text-xs text-primary hover:underline">+ Añadir línea</button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground text-xs">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Descripción</th>
                    <th className="text-right px-3 py-2 font-medium w-16">Cant.</th>
                    <th className="text-right px-3 py-2 font-medium w-24">P. unit.</th>
                    <th className="text-right px-3 py-2 font-medium w-24">Total</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-t border-border">
                      <td className="px-3 py-1">
                        <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                          placeholder="Descripción del servicio"
                          className="w-full bg-transparent text-foreground focus:outline-none" />
                      </td>
                      <td className="px-3 py-1">
                        <input type="number" min="0" step="0.01" value={item.qty}
                          onChange={e => updateItem(idx, 'qty', parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent text-right text-foreground focus:outline-none" />
                      </td>
                      <td className="px-3 py-1">
                        <input type="number" min="0" step="0.01" value={item.unitPrice}
                          onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent text-right text-foreground focus:outline-none" />
                      </td>
                      <td className="px-3 py-1 text-right font-mono text-foreground">
                        {item.total.toFixed(2)}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-red-500 text-xs">×</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totales */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">{subtotal.toFixed(2)} {currency}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>IVA</span>
                <div className="flex items-center gap-2">
                  <select value={taxRate} onChange={e => setTaxRate(Number(e.target.value))}
                    className="text-xs border border-border rounded px-1 py-0.5 bg-background text-foreground">
                    <option value={0}>0%</option>
                    <option value={4}>4%</option>
                    <option value={10}>10%</option>
                    <option value={21}>21%</option>
                  </select>
                  <span className="font-mono">{tax.toFixed(2)} {currency}</span>
                </div>
              </div>
              <div className="flex justify-between font-semibold text-foreground border-t border-border pt-1">
                <span>Total</span>
                <span className="font-mono">{total.toFixed(2)} {currency}</span>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Notas</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Condiciones de pago, IBAN, etc."
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || !number.trim()}
            className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
            {saving ? 'Guardando…' : (invoice ? 'Guardar cambios' : 'Crear factura')}
          </button>
        </div>
      </div>
    </div>
  )
}
