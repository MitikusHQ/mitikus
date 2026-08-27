import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ToolSectionNav } from '../_components/ToolSectionNav'
import { ExecutionStatusBadge } from '../_components/ExecutionStatusBadge'
import { getExecutionHistory } from '@/app/actions/execution'
import { formatCostEUR } from '@/lib/ai-cost'
import { HistoryExportButton } from '@/components/HistoryExportButton'

interface Props {
  params: Promise<{ workspaceId: string; instanceId: string }>
}

function formatMs(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export default async function ToolHistoryPage({ params }: Props) {
  const [{ workspaceId, instanceId }, user] = await Promise.all([params, requireUser()])

  const [workspace, instance, executions] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } }),
    db.toolInstance.findFirst({
      where: { id: instanceId, workspaceId, status: 'ACTIVE' },
      select: { name: true, toolDefinition: { select: { name: true, slug: true } } },
    }),
    getExecutionHistory(instanceId, workspaceId, 50),
  ])

  if (!workspace) notFound()
  if (!instance) notFound()

  const aiLabel = instance.toolDefinition.slug === 'social-media-manager' ? 'Ideas con IA' : undefined

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold truncate">{instance.name}</h1>
        <p className="text-xs text-muted-foreground truncate">{instance.toolDefinition.name}</p>
      </div>

      <ToolSectionNav workspaceId={workspaceId} instanceId={instanceId} aiLabel={aiLabel} />

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold">Historial de ejecuciones IA</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {executions.length === 0
                ? 'Sin ejecuciones aún'
                : `${executions.length} ejecución${executions.length !== 1 ? 'es' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {executions.length > 0 && (
              <HistoryExportButton
                filename={`historial-${instanceId}`}
                rows={executions.map((e) => ({
                  fecha:       e.createdAt,
                  herramienta: instance.name,
                  estado:      e.status,
                  tokens:      e.inputTokens + e.outputTokens,
                  coste:       formatCostEUR(e.estimatedCostEUR),
                  duracion:    e.durationMs > 0 ? formatMs(e.durationMs) : '—',
                  usuario:     e.userName ?? '—',
                }))}
              />
            )}
            <Link
              href={`/workspace/${workspaceId}/tools/${instanceId}/run`}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              ✨ Nueva ejecución
            </Link>
          </div>
        </div>

        {executions.length === 0 ? (
          <div className="rounded-xl border border-dashed p-16 text-center bg-card">
            <div className="text-4xl mb-4">🕐</div>
            <p className="font-medium">Sin historial</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Las ejecuciones IA aparecerán aquí una vez que ejecutes la herramienta.
            </p>
            <Link
              href={`/workspace/${workspaceId}/tools/${instanceId}/run`}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              ✨ Ejecutar ahora
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-muted/60 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap w-36">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">Estado</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">Modelo</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">Tokens</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">Coste</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">Duración</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">Usuario</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground border-b whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map((exec, idx) => (
                    <tr
                      key={exec.id}
                      className={cn(
                        'hover:bg-primary/5 transition-colors border-b last:border-0',
                        idx % 2 === 0 ? 'bg-background' : 'bg-muted/20',
                      )}
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(exec.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <ExecutionStatusBadge status={exec.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded font-mono">
                          {exec.model}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                        {exec.inputTokens + exec.outputTokens > 0
                          ? (exec.inputTokens + exec.outputTokens).toLocaleString('es-ES')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                        {exec.estimatedCostEUR > 0 ? formatCostEUR(exec.estimatedCostEUR) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                        {exec.durationMs > 0 ? formatMs(exec.durationMs) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {exec.userName ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          {exec.status === 'COMPLETED' && (
                            <>
                              <Link
                                href={`/workspace/${workspaceId}/tools/${instanceId}/run?from=${exec.id}`}
                                className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors"
                                title="Reejecutar con las mismas variables"
                              >
                                ↻ Reejecutar
                              </Link>
                              <Link
                                href={`/workspace/${workspaceId}/tools/${instanceId}/history/${exec.id}`}
                                className="text-xs text-primary hover:underline whitespace-nowrap"
                              >
                                Ver
                              </Link>
                            </>
                          )}
                          {exec.status === 'FAILED' && (
                            <>
                              <Link
                                href={`/workspace/${workspaceId}/tools/${instanceId}/run?from=${exec.id}`}
                                className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors"
                                title="Reejecutar con las mismas variables"
                              >
                                ↻ Reejecutar
                              </Link>
                              {exec.errorMessage && (
                                <span
                                  className="text-xs text-destructive cursor-default"
                                  title={exec.errorMessage}
                                >
                                  ⚠ Error
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
              {executions.length} {executions.length === 1 ? 'ejecución' : 'ejecuciones'}
            </div>
          </div>
        )}
    </div>
  )
}


