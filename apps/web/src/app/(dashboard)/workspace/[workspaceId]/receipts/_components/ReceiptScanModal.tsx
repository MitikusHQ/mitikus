'use client'

import { useState, useRef, useCallback, useTransition } from 'react'
import { createReceipt, type ReceiptData, type ReceiptItem } from '@/app/actions/receipts'

const CATEGORIES = [
  'alimentación', 'transporte', 'restaurante', 'alojamiento',
  'material oficina', 'servicios', 'suministros', 'otro',
]

const STATUS_OPTS = [
  { value: 'pendiente',      label: 'Pendiente' },
  { value: 'revisado',       label: 'Revisado' },
  { value: 'contabilizado',  label: 'Contabilizado' },
]

interface Props {
  workspaceId: string
  onClose: () => void
  onSaved: (receipt: ReceiptData) => void
}

type ScanState = 'idle' | 'scanning' | 'review' | 'saving'

interface ScannedData {
  vendor:     string | null
  date:       string | null
  total:      number | null
  subtotal:   number | null
  tax:        number | null
  taxRate:    number | null
  currency:   string
  items:      ReceiptItem[]
  category:   string | null
  imageData:  string | null
}

export function ReceiptScanModal({ workspaceId, onClose, onSaved }: Props) {
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ScannedData | null>(null)
  const [status, setStatus] = useState('pendiente')
  const [notes, setNotes] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [, startTransition] = useTransition()

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    setScanState('scanning')
    try {
      const form = new FormData()
      form.append('image', file)
      const res = await fetch(`/api/workspace/${workspaceId}/receipts/scan`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(e.error ?? 'Error al escanear')
      }
      const json: ScannedData = await res.json()
      setData({
        vendor:    json.vendor ?? null,
        date:      json.date ?? null,
        total:     json.total ?? null,
        subtotal:  json.subtotal ?? null,
        tax:       json.tax ?? null,
        taxRate:   json.taxRate ?? null,
        currency:  json.currency ?? 'EUR',
        items:     json.items ?? [],
        category:  json.category ?? null,
        imageData: json.imageData ?? null,
      })
      setScanState('review')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al escanear')
      setScanState('idle')
    }
  }, [workspaceId])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleSave = () => {
    if (!data) return
    setScanState('saving')
    startTransition(async () => {
      try {
        const saved = await createReceipt(workspaceId, {
          ...data,
          notes,
          status,
        })
        onSaved(saved)
      } catch {
        setError('Error al guardar')
        setScanState('review')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-xl border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="font-semibold text-base">Escanear ticket / factura</h2>
            <p className="text-xs text-muted-foreground mt-0.5">La IA extrae automáticamente todos los datos</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Upload / scanning state */}
          {(scanState === 'idle' || scanState === 'scanning') && (
            <div>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => !scanState.startsWith('scan') && fileRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                  scanState === 'scanning'
                    ? 'border-primary/40 bg-primary/5 cursor-not-allowed'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }`}
              >
                {scanState === 'scanning' ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
                    <p className="text-sm font-medium">Analizando imagen con IA…</p>
                    <p className="text-xs text-muted-foreground">Esto puede tardar unos segundos</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
                        <circle cx="12" cy="13" r="3"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Sube una foto o imagen del ticket</p>
                      <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, HEIC, WEBP — máx. 10 MB</p>
                    </div>
                    <button className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium hover:opacity-90 transition-opacity">
                      Seleccionar imagen
                    </button>
                    <p className="text-xs text-muted-foreground">o arrastra aquí</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>
          )}

          {/* Review state */}
          {(scanState === 'review' || scanState === 'saving') && data && (
            <div className="space-y-5">

              {/* Thumbnail */}
              {data.imageData && (
                <div className="flex justify-center">
                  <img
                    src={data.imageData}
                    alt="Ticket escaneado"
                    className="max-h-48 rounded-lg border object-contain shadow-sm"
                  />
                </div>
              )}

              {/* Extracted fields */}
              <div className="rounded-xl border overflow-hidden">
                <div className="bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Datos extraídos — revisa y corrige si es necesario
                </div>
                <div className="divide-y">
                  <Field label="Proveedor">
                    <input
                      value={data.vendor ?? ''}
                      onChange={(e) => setData((d) => d ? { ...d, vendor: e.target.value } : d)}
                      className="field-input"
                      placeholder="Nombre del comercio"
                    />
                  </Field>
                  <Field label="Fecha">
                    <input
                      type="date"
                      value={data.date ?? ''}
                      onChange={(e) => setData((d) => d ? { ...d, date: e.target.value } : d)}
                      className="field-input"
                    />
                  </Field>
                  <Field label="Total">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={data.total ?? ''}
                        onChange={(e) => setData((d) => d ? { ...d, total: parseFloat(e.target.value) || null } : d)}
                        className="field-input w-32"
                        placeholder="0,00"
                      />
                      <select
                        value={data.currency}
                        onChange={(e) => setData((d) => d ? { ...d, currency: e.target.value } : d)}
                        className="field-input w-20"
                      >
                        {['EUR','USD','GBP','CAD','ILS','CHF'].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </Field>
                  <Field label="Base imponible">
                    <input
                      type="number"
                      step="0.01"
                      value={data.subtotal ?? ''}
                      onChange={(e) => setData((d) => d ? { ...d, subtotal: parseFloat(e.target.value) || null } : d)}
                      className="field-input w-32"
                      placeholder="0,00"
                    />
                  </Field>
                  <Field label="IVA / Tax">
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        step="0.01"
                        value={data.tax ?? ''}
                        onChange={(e) => setData((d) => d ? { ...d, tax: parseFloat(e.target.value) || null } : d)}
                        className="field-input w-28"
                        placeholder="0,00"
                      />
                      <span className="text-xs text-muted-foreground">Tipo:</span>
                      <input
                        type="number"
                        step="1"
                        value={data.taxRate ?? ''}
                        onChange={(e) => setData((d) => d ? { ...d, taxRate: parseFloat(e.target.value) || null } : d)}
                        className="field-input w-16"
                        placeholder="21"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </Field>
                  <Field label="Categoría">
                    <select
                      value={data.category ?? ''}
                      onChange={(e) => setData((d) => d ? { ...d, category: e.target.value || null } : d)}
                      className="field-input"
                    >
                      <option value="">Sin categoría</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Estado">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="field-input"
                    >
                      {STATUS_OPTS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Notas">
                    <input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="field-input"
                      placeholder="Observaciones opcionales"
                    />
                  </Field>
                </div>
              </div>

              {/* Line items */}
              {data.items.length > 0 && (
                <div className="rounded-xl border overflow-hidden">
                  <div className="bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Líneas del ticket
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/20">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground">Descripción</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground">Cant.</th>
                          <th className="text-right px-3 py-2 font-medium text-muted-foreground">P.Unit.</th>
                          <th className="text-right px-4 py-2 font-medium text-muted-foreground">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {data.items.map((item, i) => (
                          <tr key={i} className="bg-card">
                            <td className="px-4 py-2">{item.description}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{item.qty}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{item.unitPrice?.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right tabular-nums font-medium">{item.total?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        {(scanState === 'review' || scanState === 'saving') && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
            <button
              onClick={() => { setScanState('idle'); setData(null); setError(null) }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              disabled={scanState === 'saving'}
            >
              ← Escanear otro
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="text-sm px-4 py-2 rounded-lg border hover:bg-muted/50 transition-colors"
                disabled={scanState === 'saving'}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={scanState === 'saving'}
                className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {scanState === 'saving' ? 'Guardando…' : 'Guardar gasto'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .field-input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 0.375rem 0.625rem;
          font-size: 0.813rem;
          outline: none;
        }
        .field-input:focus {
          ring: 2px solid hsl(var(--ring));
          border-color: hsl(var(--primary));
        }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 px-4 py-3">
      <span className="text-xs text-muted-foreground w-28 shrink-0 mt-1.5">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}
