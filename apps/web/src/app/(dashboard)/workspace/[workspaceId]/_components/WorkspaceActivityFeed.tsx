import { db } from '@/lib/db'

interface Props {
  workspaceId: string
}

const ACTION_LABELS: Record<string, string> = {
  'tool.install':         'Instaló herramienta',
  'tool.configure':       'Configuró herramienta',
  'tool.execute':         'Ejecutó herramienta',
  'workflow.create':      'Creó flujo',
  'workflow.execute':     'Ejecutó flujo',
  'workflow.archive':     'Archivó flujo',
  'record.create':        'Creó registro',
  'record.update':        'Actualizó registro',
  'record.delete':        'Eliminó registro',
  'mission.step.assign':  'Asignó paso de misión',
  'mission.step.complete':'Completó paso de misión',
}

const ACTION_ICON: Record<string, string> = {
  'tool.install':          '🔧',
  'tool.execute':          '⚡',
  'workflow.create':       '🔀',
  'workflow.execute':      '▶',
  'record.create':         '📝',
  'record.update':         '✏️',
  'mission.step.assign':   '👤',
  'mission.step.complete': '✓',
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}

export async function WorkspaceActivityFeed({ workspaceId }: Props) {
  const logs = await db.auditLog.findMany({
    where:   { workspaceId },
    orderBy: { createdAt: 'desc' },
    take:    12,
  })

  if (logs.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Actividad reciente
        </h2>
        <p className="text-sm text-muted-foreground py-2">Aún no hay actividad registrada en este workspace.</p>
      </section>
    )
  }

  // Fetch actors in one query
  const actorIds = [...new Set(logs.map((l) => l.actorUserId).filter(Boolean))] as string[]
  const users = actorIds.length > 0
    ? await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, email: true } })
    : []
  const userMap = new Map(users.map((u) => [u.id, u]))

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Actividad reciente</h2>
      <div className="rounded-xl border bg-card divide-y">
        {logs.map((log) => {
          const icon  = ACTION_ICON[log.action]  ?? '○'
          const label = ACTION_LABELS[log.action] ?? log.action
          const u = log.actorUserId ? userMap.get(log.actorUserId) : null
          const actor = u?.name ?? u?.email?.split('@')[0] ?? 'Sistema'
          return (
            <div key={log.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-sm w-5 shrink-0 text-center">{icon}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground ml-1.5">· {actor}</span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                {formatRelative(log.createdAt)}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
