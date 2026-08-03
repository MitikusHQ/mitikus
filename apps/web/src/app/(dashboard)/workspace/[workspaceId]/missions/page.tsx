import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ workspaceId: string }>
  searchParams: Promise<{ estado?: string }>
}

const STATUS_LABELS: Record<string, string> = {
  active:    'Activa',
  completed: 'Completada',
  paused:    'Pausada',
  cancelled: 'Cancelada',
}

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Crítica',
  high:     'Alta',
  medium:   'Media',
  low:      'Baja',
}

const STATUS_STYLES: Record<string, string> = {
  active:    'bg-primary/10 text-primary',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paused:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  cancelled: 'bg-muted text-muted-foreground',
}

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'text-red-600 dark:text-red-400',
  high:     'text-orange-600 dark:text-orange-400',
  medium:   'text-muted-foreground',
  low:      'text-muted-foreground',
}

export default async function MissionsPage({ params, searchParams }: Props) {
  const [{ workspaceId }, { estado }, user] = await Promise.all([params, searchParams, requireUser()])

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true, name: true },
  })
  if (!workspace) notFound()

  const statusFilter = estado && ['active', 'completed', 'paused', 'cancelled'].includes(estado)
    ? estado
    : undefined

  const objectives = await db.companyObjective.findMany({
    where: {
      workspaceId,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: [
      { status: 'asc' },
      { priority: 'asc' },
      { createdAt: 'desc' },
    ],
    include: {
      _count: { select: { steps: true, tasks: true } },
      client: { select: { name: true } },
    },
  })

  const counts = await db.companyObjective.groupBy({
    by: ['status'],
    where: { workspaceId },
    _count: true,
  })
  const countByStatus = Object.fromEntries(counts.map((c) => [c.status, c._count]))
  const total = Object.values(countByStatus).reduce((a, b) => a + b, 0)

  const filters = [
    { key: undefined, label: 'Todas', count: total },
    { key: 'active',    label: 'Activas',     count: countByStatus['active']    ?? 0 },
    { key: 'completed', label: 'Completadas',  count: countByStatus['completed'] ?? 0 },
    { key: 'paused',    label: 'Pausadas',     count: countByStatus['paused']    ?? 0 },
    { key: 'cancelled', label: 'Canceladas',   count: countByStatus['cancelled'] ?? 0 },
  ]

  const base = `/workspace/${workspaceId}`

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Misiones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Objetivos estratégicos y su seguimiento de ejecución
          </p>
        </div>
        <Link
          href={`${base}/copilot`}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          + Nueva misión con Arkos
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const isActive = f.key === statusFilter
          const href = f.key ? `${base}/missions?estado=${f.key}` : `${base}/missions`
          return (
            <Link
              key={f.label}
              href={href}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span className="ml-1.5 opacity-70">{f.count}</span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Lista */}
      {objectives.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center space-y-3">
          <p className="font-medium text-sm">
            {statusFilter ? `No hay misiones ${STATUS_LABELS[statusFilter]?.toLowerCase() ?? ''}s` : 'Aún no hay misiones'}
          </p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Las misiones son objetivos estratégicos con pasos de ejecución. Créalas con Arkos o desde el panel principal.
          </p>
          <Link
            href={`${base}/copilot`}
            className="inline-block mt-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Crear primera misión con Arkos
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {objectives.map((obj) => {
            const stepsTotal = obj._count.steps
            const stepsLabel = stepsTotal === 1 ? '1 paso' : `${stepsTotal} pasos`

            return (
              <Link
                key={obj.id}
                href={`${base}/missions/${obj.id}`}
                className="block rounded-xl border bg-card p-5 hover:border-primary/40 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Título + badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[obj.status] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {STATUS_LABELS[obj.status] ?? obj.status}
                      </span>
                      {obj.priority !== 'medium' && (
                        <span className={`text-[10px] font-medium ${PRIORITY_STYLES[obj.priority] ?? ''}`}>
                          {PRIORITY_LABELS[obj.priority] ?? obj.priority}
                        </span>
                      )}
                      {obj.client && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {obj.client.name}
                        </span>
                      )}
                    </div>

                    <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                      {obj.label}
                    </p>

                    {obj.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {obj.description}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{stepsLabel}</span>
                      {obj._count.tasks > 0 && (
                        <span>{obj._count.tasks} tarea{obj._count.tasks !== 1 ? 's' : ''}</span>
                      )}
                      {obj.dueDate && (
                        <span>
                          Vence {new Date(obj.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {obj.completedAt && (
                        <span>
                          Completada {new Date(obj.completedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progreso */}
                  <div className="shrink-0 flex flex-col items-end gap-2 w-20">
                    <span className="text-sm font-bold tabular-nums">{obj.progress}%</span>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          obj.status === 'completed' ? 'bg-green-500' : 'bg-primary'
                        }`}
                        style={{ width: `${obj.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
