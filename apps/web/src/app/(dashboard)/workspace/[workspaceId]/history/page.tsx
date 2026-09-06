import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatCostEUR } from '@/lib/ai-cost'
import { ExecutionStatusBadge } from '../tools/[instanceId]/_components/ExecutionStatusBadge'
import { HistoryExportButton } from '@/components/HistoryExportButton'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  params: Promise<{ workspaceId: string }>
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

function formatMs(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

export default async function WorkspaceHistoryPage({ params }: Props) {
  const [{ workspaceId }, user, locale] = await Promise.all([params, requireUser(), getLocale()])
  const t = getDashboardTranslations(locale)

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true, name: true },
  })
  if (!workspace) notFound()

  const executions = await db.toolExecution.findMany({
    where: { workspaceId },
    include: {
      user: { select: { name: true } },
      toolInstance: {
        select: {
          id: true,
          name: true,
          toolDefinition: { select: { name: true, category: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const totalCost = executions.reduce((s, e) => s + e.estimatedCostEUR, 0)
  const completed = executions.filter((e) => e.status === 'COMPLETED').length

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">{t.historyTitle}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t.historySubtitle}
          </p>
        </div>
        {executions.length > 0 && (
          <HistoryExportButton
            filename={`historial-${workspaceId}`}
            rows={executions.map((e) => ({
              fecha:       e.createdAt.toISOString(),
              herramienta: e.toolInstance.name,
              estado:      e.status,
              tokens:      e.inputTokens + e.outputTokens,
              coste:       formatCostEUR(e.estimatedCostEUR),
              duracion:    e.durationMs > 0 ? (e.durationMs < 1000 ? `${e.durationMs}ms` : `${(e.durationMs / 1000).toFixed(1)}s`) : '—',
              usuario:     e.user.name ?? '—',
            }))}
          />
        )}
      </div>

      {/* Stats */}
      {executions.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border bg-card p-5">
            <p className="text-xs text-muted-foreground mb-1">{t.historyExecutions}</p>
            <p className="text-2xl font-bold">{executions.length}</p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <p className="text-xs text-muted-foreground mb-1">{t.historyCompleted}</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completed}</p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <p className="text-xs text-muted-foreground mb-1">{t.historyAiCost}</p>
            <p className="text-2xl font-bold">{formatCostEUR(totalCost)}</p>
          </div>
        </div>
      )}

      {/* List */}
      {executions.length === 0 ? (
        <div className="rounded-xl border border-dashed p-16 text-center bg-card">
          <div className="text-4xl mb-4">🕐</div>
          <p className="font-medium">{t.historyEmpty}</p>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            {t.historyEmptyDescription}
          </p>
          <Link
            href={`/workspace/${workspaceId}/tools`}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            {t.historyGoToTools}
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-muted/60 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">{t.historyDate}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">{t.historyTool}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">{t.historyStatus}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">{t.historyTokens}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">{t.historyCost}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">{t.historyDuration}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">{t.historyUser}</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground border-b whitespace-nowrap">{t.historyActions}</th>
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
                      {formatDate(exec.createdAt.toISOString())}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/workspace/${workspaceId}/tools/${exec.toolInstance.id}`}
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        {exec.toolInstance.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{exec.toolInstance.toolDefinition.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <ExecutionStatusBadge status={exec.status} locale={locale} />
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
                      {exec.user.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        {exec.status === 'COMPLETED' && (
                          <>
                            <Link
                              href={`/workspace/${workspaceId}/tools/${exec.toolInstance.id}/run?from=${exec.id}`}
                              className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors"
                              title={t.historyRerunTitle}
                            >
                              {t.historyRerun}
                            </Link>
                            <Link
                              href={`/workspace/${workspaceId}/tools/${exec.toolInstance.id}/history/${exec.id}`}
                              className="text-xs text-primary hover:underline whitespace-nowrap"
                            >
                              {t.historyView}
                            </Link>
                          </>
                        )}
                        {exec.status === 'FAILED' && (
                          <Link
                            href={`/workspace/${workspaceId}/tools/${exec.toolInstance.id}/run?from=${exec.id}`}
                            className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors"
                          >
                            {t.historyRetry}
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
            {executions.length} {executions.length === 1 ? t.historyFooterSingular : t.historyFooterPlural} · {t.historyFooterCostLabel} {formatCostEUR(totalCost)}
          </div>
        </div>
      )}
    </div>
  )
}
