import { cn } from '@/lib/utils'
import type { OrgRole } from '@prisma/client'

const ROLE_BADGE_CLASSES: Record<OrgRole, string> = {
  OWNER:    'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800',
  ADMIN:    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  EDITOR:   'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  MEMBER:   'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  OPERATOR: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  VIEWER:   'bg-muted text-muted-foreground border-border',
}

const ROLE_LABELS: Record<OrgRole, string> = {
  OWNER:    'Propietario',
  ADMIN:    'Administrador',
  EDITOR:   'Editor',
  MEMBER:   'Miembro',
  OPERATOR: 'Operador',
  VIEWER:   'Lector',
}

interface Props {
  role: OrgRole
  className?: string
}

export function RoleBadge({ role, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        ROLE_BADGE_CLASSES[role],
        className,
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  )
}
