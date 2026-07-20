'use client'

import { cn } from '@/lib/utils'
import { formatCostEUR } from '@/lib/ai-cost'
import { AIResponseRenderer } from '@/components/ai-response'
import { ExportButtons } from './ExportButtons'

interface IdleState { type: 'idle' }
interface LoadingState { type: 'loading' }
interface SuccessState {
  type: 'success'
  executionId: string
  result: string
  model: string
  inputTokens: number
  outputTokens: number
  estimatedCostEUR: number
  durationMs: number
}
interface ErrorState { type: 'error'; message: string }

export type ExecutionState = IdleState | LoadingState | SuccessState | ErrorState

interface Props {
  state: ExecutionState
  toolName: string
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
      <span className="font-medium text-foreground/60">{label}</span>
      {value}
    </span>
  )
}

export function ExecutionResult({ state, toolName }: Props) {
  if (state.type === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] rounded-xl border border-dashed bg-muted/20 text-center p-8">
        <div className="text-4xl mb-4">✨</div>
        <p className="text-sm font-medium">Resultado de la ejecución</p>
        <p className="text-xs text-muted-foreground mt-1">
          Rellena las variables y pulsa &quot;Ejecutar&quot; para generar el output de{' '}
          <span className="font-medium">{toolName}</span>.
        </p>
      </div>
    )
  }

  if (state.type === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] rounded-xl border bg-card text-center p-8 gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <div>
          <p className="text-sm font-medium">Generando…</p>
          <p className="text-xs text-muted-foreground mt-0.5">Esto puede tardar unos segundos</p>
        </div>
      </div>
    )
  }

  if (state.type === 'error') {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 min-h-[160px] flex flex-col gap-3">
        <div className="flex items-center gap-2 text-destructive">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-sm font-semibold">Error en la ejecución</span>
        </div>
        <p className="text-sm text-destructive/80">{state.message}</p>
      </div>
    )
  }

  // state.type === 'success'
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center flex-wrap gap-1.5">
          <MetaChip label="Modelo" value={state.model} />
          <MetaChip label="Tokens" value={`${state.inputTokens + state.outputTokens}`} />
          <MetaChip label="Coste" value={formatCostEUR(state.estimatedCostEUR)} />
          <MetaChip label="Tiempo" value={`${(state.durationMs / 1000).toFixed(1)}s`} />
        </div>
        <ExportButtons result={state.result} toolName={toolName} />
      </div>
      <AIResponseRenderer result={state.result} />
    </div>
  )
}
