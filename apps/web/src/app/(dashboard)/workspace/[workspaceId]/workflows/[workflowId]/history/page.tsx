import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { listWorkflowExecutions } from '@/app/actions/workflow-executions'
import { formatCostEUR } from '@/lib/ai-cost'

interface Props {
  params: Promise<{ workspaceId: string; workflowId: string }>
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'Pendiente',   cls: 'bg-muted text-muted-foreground' },
  RUNNING:   { label: 'Ejecutando',  cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  COMPLETED: { label: 'Completado',  cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  FAILED:    { label: 'Error',       cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  CANCELLED: { label: 'Cancelado',   cls: 'bg-muted text-muted-foreground' },
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.round(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`
}

export default async function WorkflowHistoryPage({ params }: Props) {
  const [{ workspaceId, workflowId }, user] = await Promise.all([params, requireUser()])

  const [workspace, workflow] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId }, select: { name: true } }),
    db.workflow.findFirst({ where: { id: workflowId, workspaceId }, select: { id: true, name: true } }),
  ])
  if (!workspace || !workflow) notFound()

  const executions = await listWorkflowExecutions(workflowId, workspaceId, 50)

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Historial de ejecuciones</h1>
        <Link
          href={`/workspace/${workspaceId}/workflows/${workflowId}`}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Abrir editor →
        </Link>
      </div>

        {executions.length === 0 ? (
          <div className="rounded-xl border border-dashed p-14 text-center bg-card">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-sm text-muted-foreground">Sin ejecuciones todavía.</p>
            <Link
              href={`/workspace/${workspaceId}/workflows/${workflowId}`}
              className="mt-4 inline-block text-sm text-primary hover:underline"
            >
              Abrir editor y ejecutar →
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border bg-card divide-y overflow-hidden">
            {executions.map((e) => {
              const badge = STATUS_BADGE[e.status] ?? STATUS_BADGE['PENDING']!
              return (
                <Link
                  key={e.id}
                  href={`/workspace/${workspaceId}/workflows/${workflowId}/history/${e.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                    <div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">
                        {new Intl.DateTimeFormat('es-ES', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        }).format(new Date(e.createdAt))}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {e.completedNodeCount}/{e.nodeCount} pasos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-muted-foreground">
                    <span>{formatMs(e.durationMs)}</span>
                    <span>{formatCostEUR(e.totalCostEUR)}</span>
                    <span className="text-muted-foreground/40">→</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
    </div>
  )
}
