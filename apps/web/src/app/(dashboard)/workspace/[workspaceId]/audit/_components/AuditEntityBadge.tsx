import type { AuditEntityType } from '@/lib/audit'

interface Props {
  entityType: AuditEntityType
}

const LABELS: Record<AuditEntityType, string> = {
  tool_instance:   'Herramienta',
  tool_definition: 'Definición',
  workflow:        'Workflow',
  record:          'Registro',
  member:          'Miembro',
  planning_engine: 'Planificación',
  workspace:       'Workspace',
  client:          'Cliente',
  invoice:         'Factura',
}

export function AuditEntityBadge({ entityType }: Props) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">
      {LABELS[entityType] ?? entityType}
    </span>
  )
}
