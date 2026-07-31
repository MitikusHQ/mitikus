'use client'

import { useState, useMemo } from 'react'
import type { ModelConfig } from '@/lib/fiscal-models-config'
import { DeclarationSaveBar } from './DeclarationSaveBar'

interface Props {
  workspaceId: string
  modelo:      string
  periodo:     string
  year:        number
  config:      ModelConfig
  prefill?:    Record<string, string>
  initialId?:  string
  initialStatus?: string
}

export function GenericDeclarationClient({
  workspaceId, modelo, periodo, year, config, prefill, initialId, initialStatus,
}: Props) {
  const [vals, setVals] = useState<Record<string, string>>(
    Object.fromEntries(config.fields.map((f) => [f.key, prefill?.[f.key] ?? '']))
  )

  const numVals = useMemo(() =>
    Object.fromEntries(
      Object.entries(vals).map(([k, v]) => [k, parseFloat(v.replace(',', '.')) || 0])
    ), [vals])

  const resultado = useMemo(() => {
    if (config.calcResult) return config.calcResult(numVals as Record<string, number>)
    return config.fields.reduce((sum, f) => {
      const v = numVals[f.key] ?? 0
      return f.negate ? sum - v : sum + v
    }, 0)
  }, [numVals, config])

  const currencyFmt = (n: number) =>
    n.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' ' + config.currency

  function getData(): Record<string, string> {
    return { ...vals }
  }

  return (
    <div className="space-y-6 print:space-y-4">

      {/* Header */}
      <div className="space-y-1 print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-2xl font-black text-primary">{modelo}</span>
          {config.taxRate && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              {config.taxLabel ?? `${config.taxRate}%`}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{periodo}</span>
        </div>
        <p className="text-sm text-muted-foreground">{config.subtitulo}</p>
      </div>

      {/* Campos */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="divide-y">
          {config.fields.map((field) => (
            <div key={field.key} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{field.label}</span>
                  {field.negate && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-mono">
                      −
                    </span>
                  )}
                </div>
                {field.hint && (
                  <p className="text-xs text-muted-foreground mt-0.5">{field.hint}</p>
                )}
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={vals[field.key] ?? ''}
                onChange={(e) => setVals((prev) => ({ ...prev, [field.key]: e.target.value }))}
                placeholder="0,00"
                className="w-36 text-right rounded-md border border-input bg-background px-3 py-1.5 text-sm font-mono tabular-nums shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>

        {/* Resultado */}
        <div className={`flex items-center justify-between px-4 py-4 border-t ${
          resultado > 0
            ? 'bg-red-50 dark:bg-red-900/10'
            : resultado < 0
            ? 'bg-green-50 dark:bg-green-900/10'
            : 'bg-muted/30'
        }`}>
          <span className="text-sm font-semibold">Resultado estimado</span>
          <span className={`text-xl font-black tabular-nums ${
            resultado > 0
              ? 'text-red-600 dark:text-red-400'
              : resultado < 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-foreground'
          }`}>
            {resultado > 0 ? '+' : ''}{currencyFmt(resultado)}
          </span>
        </div>
      </div>

      {/* Agencia link */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
        </svg>
        Presentar en
        <a
          href={config.agenciaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-medium"
        >
          {config.agencia} →
        </a>
      </div>

      {/* Disclaimer */}
      {config.disclaimer && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 px-4 py-3">
          <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">{config.disclaimer}</p>
        </div>
      )}

      {/* Save bar */}
      <div className="print:hidden">
        <DeclarationSaveBar
          workspaceId={workspaceId}
          modelo={modelo}
          periodo={periodo}
          year={year}
          resultado={resultado}
          getData={getData}
          initialId={initialId}
          initialStatus={initialStatus}
        />
      </div>

      {/* Print header */}
      <div className="hidden print:block text-xs text-muted-foreground border-t pt-4">
        Generado con MITIKUS · {config.titulo} · {periodo} {year}
      </div>
    </div>
  )
}
