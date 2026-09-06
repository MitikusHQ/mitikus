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
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  params: Promise<{ workspaceId: string; instanceId: string; executionId: string }>
}

function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(iso))
}

export default async function ExecutionDetailPage({ params }: Props) {
  const [{ workspaceId, instanceId, executionId }, user, locale] = await Promise.all([
    params,
    requireUser(),
    getLocale(),
  ])
  const t = getDashboardTranslations(locale)

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

  const aiLabel = instance.toolDefinition.slug === 'social-media-manager' ? t.toolAiIdeas : undefined

  const variables = execution.variables as Record<string, unknown>
  const varEntries = Object.entries(variables).filter(([, v]) => v !== null && v !== undefined && v !== '')

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <ToolSectionNav workspaceId={workspaceId} instanceId={instanceId} aiLabel={aiLabel} locale={locale} />

      <div className="grid gap-8 lg:grid-cols-3">

          {/* ── Resultado (main) ── */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-3">
              <ExecutionStatusBadge status={execution.status} locale={locale} />
              <span className="text-sm text-muted-foreground">{formatDate(execution.createdAt, locale)}</span>
            </div>

            {execution.status === 'COMPLETED' && execution.result ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.toolResult}
                  </h2>
                  <ExportButtons result={execution.result} toolName={instance.name} />
                </div>
                <AIResponseRenderer result={execution.result} />
              </div>
            ) : execution.status === 'FAILED' ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                <h2 className="text-sm font-semibold text-destructive mb-2">{t.toolExecutionErrorTitle}</h2>
                <p className="text-sm text-destructive/80">{execution.errorMessage}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                <p className="text-sm">{t.toolNoResult}</p>
              </div>
            )}

            {/* Variables usadas */}
            {varEntries.length > 0 && (
              <div className="rounded-xl border bg-card p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  {t.toolVariablesUsed}
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
              <h2 className="text-sm font-semibold">{t.toolTelemetry}</h2>
              <dl className="space-y-2 text-xs">
                {[
                  { label: t.toolMetaModel, value: execution.model },
                  { label: t.toolProvider, value: execution.provider },
                  { label: t.toolInputTokens, value: execution.inputTokens.toLocaleString(locale) },
                  { label: t.toolOutputTokens, value: execution.outputTokens.toLocaleString(locale) },
                  {
                    label: t.toolTotalTokens,
                    value: (execution.inputTokens + execution.outputTokens).toLocaleString(locale),
                  },
                  { label: t.toolEstimatedCost, value: formatCostEUR(execution.estimatedCostEUR) },
                  {
                    label: t.toolDuration,
                    value:
                      execution.durationMs < 1000
                        ? `${execution.durationMs}ms`
                        : `${(execution.durationMs / 1000).toFixed(1)}s`,
                  },
                  { label: t.clientsUser, value: execution.userName ?? '—' },
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
              ↻ {t.toolRerunWithData}
            </Link>
            <Link
              href={`/workspace/${workspaceId}/tools/${instanceId}/run`}
              className="flex w-full items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              ✨ {t.toolCleanExecution}
            </Link>
          </div>
        </div>
    </div>
  )
}


