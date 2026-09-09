'use client'

import { useState, useTransition } from 'react'
import { deleteReceipt, updateReceiptStatus, type ReceiptData } from '@/app/actions/receipts'
import { ReceiptScanModal } from './ReceiptScanModal'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'

const CATEGORY_ICONS: Record<string, string> = {
  'alimentación':     '🛒',
  'transporte':       '🚗',
  'restaurante':      '🍽️',
  'alojamiento':      '🏨',
  'material oficina': '📦',
  'servicios':        '🔧',
  'suministros':      '💡',
  'otro':             '📄',
}

interface Props {
  workspaceId: string
  initialReceipts: ReceiptData[]
  locale: Locale
}

export function ReceiptsClient({ workspaceId, initialReceipts, locale }: Props) {
  const t = getDashboardTranslations(locale)

  const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
    pendiente:     { label: t.receiptsStatusPending,   cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    revisado:      { label: t.receiptsStatusReviewed,  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    contabilizado: { label: t.receiptsStatusAccounted, cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  }

  const [receipts, setReceipts] = useState(initialReceipts)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<ReceiptData | null>(null)
  const [, startTransition] = useTransition()

  const totalPendiente = receipts
    .filter((r) => r.status === 'pendiente' && r.total != null)
    .reduce((s, r) => s + (r.total ?? 0), 0)

  const totalMes = receipts
    .filter((r) => {
      if (!r.createdAt) return false
      const d = new Date(r.createdAt)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((s, r) => s + (r.total ?? 0), 0)

  function handleSaved(r: ReceiptData) {
    setReceipts((prev) => [r, ...prev])
    setShowModal(false)
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteReceipt(workspaceId, id)
      setReceipts((prev) => prev.filter((r) => r.id !== id))
      if (selected?.id === id) setSelected(null)
    })
  }

  function handleStatusChange(id: string, status: string) {
    startTransition(async () => {
      await updateReceiptStatus(workspaceId, id, status)
      setReceipts((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))
      if (selected?.id === id) setSelected((s) => s ? { ...s, status } : s)
    })
  }

  const fmt = (n: number | null, currency = 'EUR') =>
    n != null
      ? n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + currency
      : '—'

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t.receiptsTitle}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t.receiptsSubtitle}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
            <circle cx="12" cy="13" r="3"/>
          </svg>
          {t.receiptsScan}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label={t.receiptsTotalMonth} value={fmt(totalMes)} />
        <StatCard label={t.receiptsPendingReview} value={fmt(totalPendiente)} accent />
        <StatCard label={t.receiptsCount} value={String(receipts.length)} />
      </div>

      {/* List + detail */}
      {receipts.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
          </div>
          <p className="text-sm font-medium">{t.receiptsEmpty}</p>
          <p className="text-xs text-muted-foreground mt-1">{t.receiptsEmptyHint}</p>
          <button onClick={() => setShowModal(true)} className="mt-4 text-sm text-primary hover:underline">
            {t.receiptsScanNow}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">

          {/* List */}
          <div className="rounded-xl border overflow-hidden">
            <div className="divide-y">
              {receipts.map((r) => {
                const badge = STATUS_LABELS[r.status] ?? STATUS_LABELS.pendiente!
                const icon = r.category ? (CATEGORY_ICONS[r.category] ?? '📄') : '📄'
                const dateStr = r.date
                  ? new Date(r.date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors ${
                      selected?.id === r.id ? 'bg-primary/5 border-l-2 border-primary' : ''
                    }`}
                  >
                    <span className="text-xl w-8 text-center shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{r.vendor ?? t.receiptsNoVendor}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {dateStr}
                        {r.category && <> · {r.category}</>}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-right shrink-0">
                      {fmt(r.total, r.currency)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Detail panel */}
          {selected ? (
            <div className="rounded-xl border overflow-hidden self-start sticky top-4">
              <div className="bg-muted/40 px-4 py-3 border-b flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.receiptsDetail}</span>
                <button onClick={() => handleDelete(selected.id)} className="text-xs text-red-500 hover:text-red-700 transition-colors">
                  {t.receiptsDelete}
                </button>
              </div>
              {selected.imageData && (
                <div className="p-3 border-b flex justify-center bg-muted/10">
                  <img src={selected.imageData} alt={t.receiptsDetail} className="max-h-40 rounded-lg object-contain" />
                </div>
              )}
              <div className="divide-y text-sm">
                <DetailRow label={t.receiptsVendor}   value={selected.vendor ?? '—'} />
                <DetailRow label={t.receiptsDate}     value={selected.date ? new Date(selected.date).toLocaleDateString(locale) : '—'} />
                <DetailRow label={t.receiptsTotal}    value={fmt(selected.total, selected.currency)} strong />
                <DetailRow label={t.receiptsTaxBase}  value={fmt(selected.subtotal, selected.currency)} />
                <DetailRow label={t.receiptsTax}
                  value={selected.tax != null
                    ? `${fmt(selected.tax, selected.currency)}${selected.taxRate ? ` (${selected.taxRate}%)` : ''}`
                    : '—'}
                />
                <DetailRow label={t.receiptsCategory} value={selected.category ?? '—'} />
                <DetailRow label={t.receiptsNotes}    value={selected.notes ?? '—'} />
                <div className="px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-1">{t.receiptsStatus}</p>
                  <select
                    value={selected.status}
                    onChange={(e) => handleStatusChange(selected.id, e.target.value)}
                    className="w-full text-xs rounded-md border border-input bg-background px-2 py-1.5"
                  >
                    <option value="pendiente">{t.receiptsStatusPending}</option>
                    <option value="revisado">{t.receiptsStatusReviewed}</option>
                    <option value="contabilizado">{t.receiptsStatusAccounted}</option>
                  </select>
                </div>
              </div>
              {selected.items && selected.items.length > 0 && (
                <div className="border-t">
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.receiptsLines}</p>
                  <div className="divide-y">
                    {selected.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2 text-xs">
                        <span className="text-muted-foreground truncate flex-1">{item.description}</span>
                        <span className="tabular-nums ml-2 font-medium">{item.total?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed bg-muted/10 p-8 text-center text-sm text-muted-foreground">
              {t.receiptsSelectHint}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <ReceiptScanModal workspaceId={workspaceId} onClose={() => setShowModal(false)} onSaved={handleSaved} locale={locale} />
      )}
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold tabular-nums mt-0.5 ${accent ? 'text-amber-600 dark:text-amber-400' : ''}`}>
        {value}
      </p>
    </div>
  )
}

function DetailRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between px-4 py-2 gap-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={`text-xs text-right ${strong ? 'font-bold text-base' : ''}`}>{value}</span>
    </div>
  )
}
