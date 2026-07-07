'use client'

import { useState, useTransition } from 'react'
import { resetOrgDailyUsage, exportOrgUsageCSV } from '@/app/actions/ai-admin'

interface RecentError {
  id: string
  createdAt: Date
  userId: string
  workspaceId: string | null
  errorMessage: string | null
  durationMs: number
  attempts: number
}

interface Props {
  recentErrors: RecentError[]
}

export function AdminPanel({ recentErrors }: Props) {
  const [resetMsg, setResetMsg] = useState<string | null>(null)
  const [isPendingReset, startReset] = useTransition()
  const [isPendingExport, startExport] = useTransition()

  function handleReset() {
    if (
      !confirm(
        '¿Seguro que quieres borrar los registros de uso IA de hoy? Esto reiniciará los contadores diarios.',
      )
    )
      return

    startReset(async () => {
      const result = await resetOrgDailyUsage()
      if ('error' in result) {
        setResetMsg(`Error: ${result.error}`)
      } else {
        setResetMsg(`Eliminados ${result.deleted} registros. Límites reiniciados.`)
        setTimeout(() => window.location.reload(), 1500)
      }
    })
  }

  function handleExport() {
    startExport(async () => {
      const result = await exportOrgUsageCSV()
      if ('error' in result) {
        alert(`Error al exportar: ${result.error}`)
        return
      }
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-usage-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-destructive uppercase tracking-wide">
          Panel de administración
        </span>
        <span className="text-xs text-muted-foreground">(solo OWNER / ADMIN)</span>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleReset}
          disabled={isPendingReset}
          className="rounded-md border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
        >
          {isPendingReset ? 'Reiniciando…' : 'Reiniciar contadores hoy'}
        </button>

        <button
          onClick={handleExport}
          disabled={isPendingExport}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
        >
          {isPendingExport ? 'Exportando…' : 'Exportar CSV (30 días)'}
        </button>
      </div>

      {resetMsg && (
        <p className="text-sm text-muted-foreground">{resetMsg}</p>
      )}

      {/* Últimos errores */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Últimos errores Anthropic (72h)</p>
        {recentErrors.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin errores recientes.</p>
        ) : (
          <div className="divide-y rounded-md border text-xs font-mono overflow-x-auto">
            {recentErrors.map((e) => (
              <div key={e.id} className="px-3 py-2 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString('es-ES')}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span>{e.durationMs}ms</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{e.attempts} intento(s)</span>
                </div>
                <div className="text-destructive truncate">
                  {e.errorMessage ?? '(sin mensaje)'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
