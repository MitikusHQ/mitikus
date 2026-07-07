import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
  PENDING:   { label: 'Pendiente',   cls: 'bg-muted text-muted-foreground border-border' },
  RUNNING:   { label: 'Ejecutando…', cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' },
  COMPLETED: { label: 'Completado',  cls: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' },
  FAILED:    { label: 'Error',       cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' },
  CANCELLED: { label: 'Cancelado',   cls: 'bg-muted text-muted-foreground border-border' },
} as const

type Status = keyof typeof STATUS_CONFIG

interface Props {
  status: string
  className?: string
}

export function ExecutionStatusBadge({ status, className }: Props) {
  const config = STATUS_CONFIG[status as Status] ?? STATUS_CONFIG.PENDING
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.cls,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
