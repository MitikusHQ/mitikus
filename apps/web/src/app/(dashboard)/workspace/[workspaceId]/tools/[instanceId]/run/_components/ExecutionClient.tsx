'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { DataSchema } from '@protools/schema'
import { VariableForm } from './VariableForm'
import { ExecutionResult, type ExecutionState } from './ExecutionResult'

interface ExecutionApiResponse {
  executionId: string
  result: string
  model: string
  inputTokens: number
  outputTokens: number
  estimatedCostEUR: number
  durationMs: number
  error?: string
}

interface Props {
  toolInstanceId: string
  workspaceId: string
  toolName: string
  fields: DataSchema['fields']
  initialValues?: Record<string, string>
  fromMissionId?: string
  fromStepId?: string
}

export function ExecutionClient({
  toolInstanceId, workspaceId, toolName, fields, initialValues, fromMissionId, fromStepId,
}: Props) {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, string>>(initialValues ?? {})
  const [execState, setExecState] = useState<ExecutionState>({ type: 'idle' })
  const [completing, setCompleting] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)

  const handleCompleteStep = useCallback(async () => {
    if (!fromMissionId || !fromStepId) return
    setCompleting(true)
    setCompleteError(null)
    try {
      const res = await fetch(`/api/missions/${fromMissionId}/steps/${fromStepId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'completed' }),
      })
      if (!res.ok) throw new Error()
      router.push(`/workspace/${workspaceId}/missions/${fromMissionId}`)
    } catch {
      setCompleteError('No se pudo actualizar la misión. Inténtalo de nuevo.')
      setCompleting(false)
    }
  }, [fromMissionId, fromStepId, workspaceId, router])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setExecState({ type: 'loading' })

      try {
        const res = await fetch('/api/execute-tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolInstanceId, workspaceId, variables: values }),
        })

        const data = (await res.json()) as ExecutionApiResponse

        if (!res.ok || data.error) {
          setExecState({ type: 'error', message: data.error ?? 'Error desconocido' })
          return
        }

        setExecState({
          type: 'success',
          executionId: data.executionId,
          result: data.result,
          model: data.model,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          estimatedCostEUR: data.estimatedCostEUR,
          durationMs: data.durationMs,
        })
      } catch {
        setExecState({ type: 'error', message: 'Error de conexión. Inténtalo de nuevo.' })
      }
    },
    [toolInstanceId, workspaceId, values],
  )

  const isLoading = execState.type === 'loading'

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Panel izquierdo: variables */}
      <div>
        <div className="rounded-xl border bg-card p-5 sticky top-6">
          <div className="mb-5">
            <h2 className="font-semibold text-[15px]">Variables de entrada</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Rellena los campos para personalizar el output de la IA
            </p>
          </div>
          <VariableForm
            fields={fields}
            values={values}
            onChange={setValues}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Panel derecho: resultado */}
      <div>
        <div className="mb-4">
          <h2 className="font-semibold text-[15px]">Resultado</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Output generado por IA para <span className="font-medium">{toolName}</span>
          </p>
        </div>
        <ExecutionResult state={execState} toolName={toolName} />

        {execState.type === 'success' && fromMissionId && fromStepId && (
          <div className="mt-3 rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-2">
            <p className="text-sm font-medium">
              ✓ Resultado generado — esto completa el paso de tu misión.
            </p>
            <p className="text-xs text-muted-foreground">
              Vuelve a la misión para marcarlo como hecho. El progreso y la siguiente acción se actualizan solos.
            </p>
            {completeError && (
              <p className="text-xs text-destructive">{completeError}</p>
            )}
            <button
              type="button"
              onClick={handleCompleteStep}
              disabled={completing}
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {completing ? 'Actualizando misión…' : 'Volver a la misión y marcar como hecho →'}
            </button>
          </div>
        )}

        {execState.type === 'success' && (
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setExecState({ type: 'idle' })}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Nueva ejecución
            </button>
            <span className="text-muted-foreground/30">·</span>
            <a
              href={`/workspace/${workspaceId}/tools/${toolInstanceId}/history`}
              className="text-xs text-primary hover:underline"
            >
              Ver historial →
            </a>
            {fromMissionId && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <a
                  href={`/workspace/${workspaceId}/missions/${fromMissionId}`}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Volver sin marcar como hecho
                </a>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
