import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ToolSectionNav } from '../../_components/ToolSectionNav'
import { ExecutionStatusBadge } from '../../_components/ExecutionStatusBadge'
import { getExecutionDetail } from '@/app/actions/execution'
import { formatCostEUR } from '@/lib/ai-cost'
import { cn } from '@/lib/utils'
import { AIResponseRenderer } from '@/components/ai-response'
import { ExportButtons } from '../../run/_components/ExportButtons'

interface Props {
  params: Promise<{ workspaceId: string; instanceId: string; executionId: string }>
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(iso))
}

export default async function ExecutionDetailPage({ params }: Props) {
  const [{ workspaceId, instanceId, executionId }, user] = await Promise.all([
    params,
    requireUser(),
  ])

  const [workspace, instance, execution] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } }),
    db.toolInstance.findFirst({
      where: { id: instanceId, workspaceId, status: 'ACTIVE' },
      select: { name: true, toolDefinition: { select: { name: true, slug: true } } },
    }),
    getExecutionDetail(executionId, workspaceId),
  ])

  if (!workspace) notFound()
  if (!instance) notFound()
  if (!execution) notFound()

  const aiLabel = instance.toolDefinition.slug === 'social-media-manager' ? 'Ideas con IA' : undefined

  const variables = execution.variables as Record<string, unknown>
  const varEntries = Object.entries(variables).filter(([, v]) => v !== null && v !== undefined && v !== '')

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <ToolSectionNav workspaceId={workspaceId} instanceId={instanceId} aiLabel={aiLabel} />

      <div className="grid gap-8 lg:grid-cols-3">

          {/* ── Resultado (main) ── */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-3">
              <ExecutionStatusBadge status={execution.status} />
              <span className="text-sm text-muted-foreground">{formatDate(execution.createdAt)}</span>
            </div>

            {execution.status === 'COMPLETED' && execution.result ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Resultado
                  </h2>
                  <ExportButtons result={execution.result} toolName={instance.name} />
                </div>
                <AIResponseRenderer result={execution.result} />
              </div>
            ) : execution.status === 'FAILED' ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                <h2 className="text-sm font-semibold text-destructive mb-2">Error</h2>
                <p className="text-sm text-destructive/80">{execution.errorMessage}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                <p className="text-sm">No hay resultado disponible para esta ejecución.</p>
              </div>
            )}

            {/* Variables usadas */}
            {varEntries.length > 0 && (
              <div className="rounded-xl border bg-card p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Variables utilizadas
                </h2>
                <dl className="divide-y">
                  {varEntries.map(([key, value]) => (
                    <div key={key} className={cn('py-2.5 flex items-start gap-3')}>
                      <dt className="text-xs font-medium text-muted-foreground w-36 shrink-0 mt-0.5 font-mono">
                        {key}
                      </dt>
                      <dd className="text-sm text-foreground">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

          {/* ── Metadatos (sidebar) ── */}
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <h2 className="text-sm font-semibold">Telemetría</h2>
              <dl className="space-y-2 text-xs">
                {[
                  { label: 'Modelo', value: execution.model },
                  { label: 'Proveedor', value: execution.provider },
                  { label: 'Tokens entrada', value: execution.inputTokens.toLocaleString('es-ES') },
                  { label: 'Tokens salida', value: execution.outputTokens.toLocaleString('es-ES') },
                  {
                    label: 'Total tokens',
                    value: (execution.inputTokens + execution.outputTokens).toLocaleString('es-ES'),
                  },
                  { label: 'Coste estimado', value: formatCostEUR(execution.estimatedCostEUR) },
                  {
                    label: 'Duración',
                    value:
                      execution.durationMs < 1000
                        ? `${execution.durationMs}ms`
                        : `${(execution.durationMs / 1000).toFixed(1)}s`,
                  },
                  { label: 'Usuario', value: execution.userName ?? '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium text-foreground text-right font-mono">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <Link
              href={`/workspace/${workspaceId}/tools/${instanceId}/run?from=${executionId}`}
              className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              ↻ Reejecutar con estos datos
            </Link>
            <Link
              href={`/workspace/${workspaceId}/tools/${instanceId}/run`}
              className="flex w-full items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              ✨ Nueva ejecución limpia
            </Link>
          </div>
        </div>
    </div>
  )
}


