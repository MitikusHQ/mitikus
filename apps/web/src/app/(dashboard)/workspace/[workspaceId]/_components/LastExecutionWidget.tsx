import Link from 'next/link'
import { db } from '@/lib/db'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'

interface Props {
  workspaceId: string
  locale: Locale
}

export async function LastExecutionWidget({ workspaceId, locale }: Props) {
  const t = getDashboardTranslations(locale)

  const last = await db.toolExecution.findFirst({
    where: {
      toolInstance: { workspaceId },
      status: 'COMPLETED',
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      toolInstance: {
        select: {
          id: true,
          name: true,
          toolDefinition: { select: { category: true } },
          client: { select: { name: true } },
        },
      },
    },
  })

  if (!last) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3">
        <p className="text-sm text-muted-foreground">{t.lastExecEmpty}</p>
        <Link
          href={`/workspace/${workspaceId}/tools`}
          className="text-xs font-semibold text-primary hover:underline whitespace-nowrap shrink-0"
        >
          {t.lastExecSeeTools}
        </Link>
      </div>
    )
  }

  const elapsed = Date.now() - new Date(last.createdAt).getTime()
  const hours = Math.floor(elapsed / 3_600_000)
  const days  = Math.floor(elapsed / 86_400_000)
  const timeAgo =
    days > 0
      ? `${t.lastExecDaysAgoPrefix}${days}${t.lastExecDaysAgoSuffix}`
      : hours > 0
        ? `${t.lastExecHoursAgoPrefix}${hours}${t.lastExecHoursAgoSuffix}`
        : t.lastExecJustNow

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
          {t.lastExecLabel}
        </p>
        <p className="text-sm font-medium truncate">
          {last.toolInstance.name}
          {last.toolInstance.client && (
            <span className="text-muted-foreground font-normal"> · {last.toolInstance.client.name}</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
        <Link
          href={`/workspace/${workspaceId}/tools/${last.toolInstance.id}/run`}
          className="text-xs font-semibold text-primary hover:underline whitespace-nowrap"
        >
          {t.lastExecRerun}
        </Link>
      </div>
    </div>
  )
}
