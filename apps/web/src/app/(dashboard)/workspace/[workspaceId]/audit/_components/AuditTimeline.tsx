import type { AuditLogRow } from '@/app/actions/audit'
import { AuditEventRow } from './AuditEventRow'

interface Props {
  logs: AuditLogRow[]
}

export function AuditTimeline({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-2xl mb-2">📋</p>
        <p className="font-medium">Sin eventos de auditoría</p>
        <p className="text-sm mt-1">Las acciones realizadas en este workspace aparecerán aquí.</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {logs.map((log) => (
        <AuditEventRow key={log.id} log={log} />
      ))}
    </div>
  )
}
