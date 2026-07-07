'use client'

import { useState } from 'react'
import type { WorkflowVariableData } from '@/app/actions/workflows'
import { cn } from '@/lib/utils'
import { formatCostEUR } from '@/lib/ai-cost'

type RunState = 'idle' | 'running' | 'done' | 'error'

interface NodeResult {
  nodeLabel: string
  status: string
  durationMs: number
  estimatedCostEUR: number
  output: string | null
  errorMessage: string | null
}

interface RunResult {
  workflowExecutionId: string
  status: string
  finalOutput: string | null
  totalCostEUR: number
  durationMs: number
  errorMessage?: string | null
  nodes?: NodeResult[]
}

interface Props {
  workspaceId: string
  workflowId: string
  variables: WorkflowVariableData[]
  runState: RunState
  result: RunResult | null
  onRunStateChange: (state: RunState) => void
  onResultChange: (result: RunResult | null) => void
}

export function WorkflowRunner({
  workspaceId,
  workflowId,
  variables,
  runState,
  result,
  onRunStateChange,
  onResultChange,
}: Props) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(variables.map((v) => [v.key, v.defaultValue])),
  )

  const handleRun = async () => {
    onRunStateChange('running')
    onResultChange(null)
    try {
      const res = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, variables: variableValues }),
      })
      const data = (await res.json()) as RunResult & { error?: string }
      if (!res.ok) {
        onRunStateChange('error')
        onResultChange({ workflowExecutionId: '', status: 'FAILED', finalOutput: null, totalCostEUR: 0, durationMs: 0, errorMessage: data.error ?? 'Error desconocido' })
        return
      }
      onRunStateChange(data.status === 'COMPLETED' ? 'done' : 'error')
      onResultChange(data)
    } catch (e) {
      onRunStateChange('error')
      onResultChange({ workflowExecutionId: '', status: 'FAILED', finalOutput: null, totalCostEUR: 0, durationMs: 0, errorMessage: String(e) })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Variables */}
      {variables.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold mb-3">Variables del workflow</p>
          <div className="space-y-2">
            {variables.map((v) => (
              <div key={v.key} className="space-y-0.5">
                <label className="text-xs font-medium">
                  {v.key}
                  {v.description && (
                    <span className="text-muted-foreground font-normal ml-1">— {v.description}</span>
                  )}
                </label>
                {v.type === 'text' ? (
                  <textarea
                    rows={3}
                    value={variableValues[v.key] ?? ''}
                    onChange={(e) => setVariableValues((prev) => ({ ...prev, [v.key]: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs resize-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                ) : (
                  <input
                    type="text"
                    value={variableValues[v.key] ?? ''}
                    onChange={(e) => setVariableValues((prev) => ({ ...prev, [v.key]: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Run button */}
      <button
        onClick={handleRun}
        disabled={runState === 'running'}
        className={cn(
          'w-full rounded-xl py-3 text-sm font-semibold shadow transition-all',
          runState === 'running'
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:bg-primary/90',
        )}
      >
        {runState === 'running' ? '⏳ Ejecutando…' : '▶ Ejecutar workflow'}
      </button>

      {/* Result */}
      {result && (
        <div
          className={cn(
            'rounded-xl border p-4 space-y-3',
            result.status === 'COMPLETED' ? 'border-green-500/30 bg-green-500/5' : 'border-destructive/30 bg-destructive/5',
          )}
        >
          {/* Summary */}
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                result.status === 'COMPLETED'
                  ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                  : 'bg-destructive/20 text-destructive',
              )}
            >
              {result.status === 'COMPLETED' ? '✓ Completado' : '✗ Error'}
            </span>
            <div className="flex gap-3 text-[10px] text-muted-foreground">
              <span>{(result.durationMs / 1000).toFixed(1)}s</span>
              <span>{formatCostEUR(result.totalCostEUR)}</span>
            </div>
          </div>

          {result.errorMessage && (
            <p className="text-xs text-destructive bg-destructive/10 rounded p-2">{result.errorMessage}</p>
          )}

          {result.finalOutput && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Resultado final
              </p>
              <div className="max-h-48 overflow-y-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap font-mono">
                {result.finalOutput}
              </div>
            </div>
          )}

          {result.workflowExecutionId && (
            <a
              href={`/workspace/${workspaceId}/workflows/${workflowId}/history/${result.workflowExecutionId}`}
              className="text-[10px] text-primary hover:underline block"
            >
              Ver detalles completos →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
