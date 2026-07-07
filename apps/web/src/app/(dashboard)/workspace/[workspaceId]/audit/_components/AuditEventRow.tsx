import type { AuditLogRow } from '@/app/actions/audit'
import { AuditResultBadge } from './AuditResultBadge'
import { AuditEntityBadge } from './AuditEntityBadge'
import { AuditMetadataPreview } from './AuditMetadataPreview'

interface Props {
  log: AuditLogRow
}

const ACTION_LABELS: Record<string, string> = {
  'tool.install':      'Instaló herramienta',
  'tool.configure':    'Configuró herramienta',
  'tool.execute':      'Ejecutó herramienta',
  'workflow.create':   'Creó workflow',
  'workflow.update':   'Actualizó workflow',
  'workflow.delete':   'Eliminó workflow',
  'workflow.execute':  'Ejecutó workflow',
  'workflow.graph_save': 'Guardó grafo',
  'record.create':     'Creó registro',
  'record.update':     'Actualizó registro',
  'record.delete':     'Eliminó registro',
  'favorite.add':      'Añadió favorito',
  'favorite.remove':   'Quitó favorito',
  'access.denied':     'Acceso denegado',
}

function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)

  if (diffMin < 1) return 'hace un momento'
  if (diffMin < 60) return `hace ${diffMin}m`
  if (diffH < 24) return `hace ${diffH}h`
  if (diffD < 7) return `hace ${diffD}d`
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

const RESULT_DOT: Record<string, string> = {
  success: 'bg-emerald-500',
  failure: 'bg-red-500',
  denied:  'bg-amber-500',
}

export function AuditEventRow({ log }: Props) {
  const actionLabel = ACTION_LABELS[log.action] ?? log.action
  const actor = log.actorName ?? log.actorEmail ?? 'Sistema'
  const dot = RESULT_DOT[log.result] ?? 'bg-muted-foreground'

  return (
    <div className="flex gap-4 group">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`mt-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-background ${dot}`} />
        <div className="flex-1 w-px bg-border mt-1 group-last:hidden" />
      </div>

      {/* Content */}
      <div className="pb-6 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-medium text-sm text-foreground">{actionLabel}</span>
          <AuditResultBadge result={log.result} />
          <AuditEntityBadge entityType={log.entityType} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground mb-1">
          <span>
            <span className="text-foreground/60">Actor:</span>{' '}
            <span className="font-medium text-foreground">{actor}</span>
          </span>
          {log.entityId && (
            <span>
              <span className="text-foreground/60">ID:</span>{' '}
              <code className="font-mono text-[11px]">{log.entityId.slice(0, 12)}…</code>
            </span>
          )}
          <span title={new Date(log.createdAt).toLocaleString('es-ES')}>
            {formatRelativeDate(log.createdAt)}
          </span>
        </div>

        <AuditMetadataPreview metadata={log.metadata} />
      </div>
    </div>
  )
}
