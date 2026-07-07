import { cn } from '@/lib/utils'
import type { OrgActivityItem } from '@/app/actions/org'

const ACTION_LABELS: Record<string, string> = {
  'tool.install': 'Instaló herramienta',
  'tool.configure': 'Configuró herramienta',
  'tool.execute': 'Ejecutó herramienta',
  'workflow.create': 'Creó workflow',
  'workflow.update': 'Actualizó workflow',
  'workflow.delete': 'Eliminó workflow',
  'workflow.execute': 'Ejecutó workflow',
  'workflow.publish': 'Publicó workflow',
  'workflow.archive': 'Archivó workflow',
  'workflow.version_create': 'Creó versión de workflow',
  'record.create': 'Creó registro',
  'record.update': 'Actualizó registro',
  'record.delete': 'Eliminó registro',
  'org.member_role_update': 'Cambió rol de miembro',
  'access.denied': 'Acceso denegado',
}

const RESULT_DOT: Record<string, string> = {
  success: 'bg-green-500',
  failure: 'bg-red-500',
  denied:  'bg-amber-500',
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}

interface Props {
  items: OrgActivityItem[]
}

export function OrgRecentActivity({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        Sin actividad registrada todavía
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card divide-y">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 px-4 py-3">
          <span
            className={cn(
              'mt-1.5 w-2 h-2 rounded-full shrink-0',
              RESULT_DOT[item.result] ?? 'bg-muted-foreground/30',
            )}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">
                {ACTION_LABELS[item.action] ?? item.action}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">{formatRelative(item.createdAt)}</span>
            </div>
            {item.actorName && (
              <p className="text-xs text-muted-foreground mt-0.5">{item.actorName}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
