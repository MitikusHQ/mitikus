import { cn } from '@/lib/utils'
import type { Locale } from '@/i18n/config'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

const STATUS_CONFIG = {
  PENDING:   { cls: 'bg-muted text-muted-foreground border-border' },
  RUNNING:   { cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' },
  COMPLETED: { cls: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' },
  FAILED:    { cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' },
  CANCELLED: { cls: 'bg-muted text-muted-foreground border-border' },
} as const

type Status = keyof typeof STATUS_CONFIG

interface Props {
  status: string
  className?: string
  locale: Locale
}

export function ExecutionStatusBadge({ status, className, locale }: Props) {
  const t = getDashboardTranslations(locale)
  const config = STATUS_CONFIG[status as Status] ?? STATUS_CONFIG.PENDING
  const labels: Record<Status, string> = {
    PENDING: t.toolStatusPending,
    RUNNING: t.toolStatusRunning,
    COMPLETED: t.toolStatusCompleted,
    FAILED: t.toolStatusFailed,
    CANCELLED: t.toolStatusCancelled,
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.cls,
        className,
      )}
    >
      {labels[status as Status] ?? t.toolStatusPending}
    </span>
  )
}
