import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getWorkflowExecutionDetail } from '@/app/actions/workflow-executions'
import { formatCostEUR } from '@/lib/ai-cost'

interface Props {
  params: Promise<{ workspaceId: string; workflowId: string; executionId: string }>
}

const NODE_STATUS_STYLE: Record<string, { dot: string; label: string; bar: string }> = {
  IDLE:      { dot: 'bg-muted-foreground/30', label: 'Pendiente',  bar: 'bg-muted' },
  QUEUED:    { dot: 'bg-amber-400',           label: 'En cola',    bar: 'bg-amber-400' },
  RUNNING:   { dot: 'bg-blue-500 animate-pulse', label: 'Ejecutando', bar: 'bg-blue-500' },
  COMPLETED: { dot: 'bg-green-500',           label: 'Completado', bar: 'bg-green-500' },
  FAILED:    { dot: 'bg-destructive',         label: 'Error',      bar: 'bg-destructive' },
  CANCELLED: { dot: 'bg-muted-foreground',    label: 'Cancelado',  bar: 'bg-muted-foreground' },
  SKIPPED:   { dot: 'bg-muted-foreground/40', label: 'Omitido',   bar: 'bg-muted-foreground/40' },
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.round(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`
}

export default async function ExecutionDetailPage({ params }: Props) {
  const [{ workspaceId, workflowId, executionId }, user] = await Promise.all([params, requireUser()])

  const [workspace, workflow] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId }, select: { name: true } }),
    db.workflow.findFirst({ where: { id: workflowId, workspaceId }, select: { id: true, name: true } }),
  ])
  if (!workspace || !workflow) notFound()

  const execution = await getWorkflowExecutionDetail(executionId, workspaceId)
  if (!execution) notFound()

  const isCompleted = execution.status === 'COMPLETED'

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Ejecución del workflow</h1>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatMs(execution.durationMs)}</span>
          <span>{formatCostEUR(execution.totalCostEUR)}</span>
          <span className={`px-2 py-0.5 rounded-full font-medium ${isCompleted ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
            {isCompleted ? 'Completado' : execution.status}
          </span>
        </div>
      </div>

        {/* Timeline de nodos */}
        <section>
          <h2 className="text-sm font-semibold mb-4">Pasos ejecutados</h2>
          <div className="space-y-3">
            {execution.nodeExecutions.map((n, i) => {
              const style = NODE_STATUS_STYLE[n.status] ?? NODE_STATUS_STYLE['IDLE']!
              return (
                <div key={n.id} className="rounded-xl border bg-card overflow-hidden">
                  {/* Status bar */}
                  <div className={`h-0.5 w-full ${style.bar}`} />
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{i + 1}</span>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{n.nodeLabel}</p>
                          <p className="text-xs text-muted-foreground">{n.toolName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                        {n.durationMs > 0 && <span>{formatMs(n.durationMs)}</span>}
                        {n.inputTokens > 0 && <span>{n.inputTokens + n.outputTokens} tokens</span>}
                        {n.estimatedCostEUR > 0 && <span>{formatCostEUR(n.estimatedCostEUR)}</span>}
                        <span className="text-[11px] font-medium">{style.label}</span>
                      </div>
                    </div>

                    {n.errorMessage && (
                      <div className="mt-3 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                        <p className="text-xs text-destructive">{n.errorMessage}</p>
                      </div>
                    )}

                    {n.output && (
                      <details className="mt-3">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none">
                          Ver output ({n.output.length} chars)
                        </summary>
                        <div className="mt-2 max-h-40 overflow-y-auto rounded-lg bg-muted p-3 text-xs font-mono whitespace-pre-wrap">
                          {n.output}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Output final */}
        {execution.finalOutput && (
          <section>
            <h2 className="text-sm font-semibold mb-3">Resultado final</h2>
            <div className="rounded-xl border bg-card p-5">
              <div className="max-h-96 overflow-y-auto text-sm whitespace-pre-wrap font-mono">
                {execution.finalOutput}
              </div>
            </div>
          </section>
        )}

        {/* Logs */}
        {execution.logs.length > 0 && (
          <section>
            <details>
              <summary className="text-sm font-semibold cursor-pointer hover:text-primary select-none mb-3">
                Logs del motor ({execution.logs.length})
              </summary>
              <div className="rounded-xl border bg-card divide-y mt-3">
                {execution.logs.map((log) => (
                  <div key={log.id} className="px-4 py-2 flex items-start gap-3">
                    <span className={`text-[10px] font-mono mt-0.5 shrink-0 ${log.level === 'error' ? 'text-destructive' : log.level === 'warn' ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-xs">{log.message}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto shrink-0 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString('es-ES')}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          </section>
        )}
    </div>
  )
}
