import Link from 'next/link'
import { db } from '@/lib/db'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'

interface Props {
  orgId: string
  locale: Locale
}

export async function TrialBanner({ orgId, locale }: Props) {
  const t = getDashboardTranslations(locale)

  const sub = await db.subscription.findUnique({
    where: { orgId },
    select: { status: true, trialEndsAt: true, tier: true },
  })

  if (!sub || sub.status !== 'TRIALING' || !sub.trialEndsAt) return null

  const daysLeft = Math.ceil(
    (new Date(sub.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )

  if (daysLeft <= 0) return null

  const isUrgent = daysLeft <= 3

  const dayWord = daysLeft === 1 ? t.trialDaySingular : t.trialDayPlural

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm ${
        isUrgent
          ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300'
          : 'border-border bg-muted/40 text-muted-foreground'
      }`}
    >
      <span>
        {isUrgent
          ? `${t.trialUrgentPrefix}${daysLeft}${dayWord}${t.trialUrgentSuffix}`
          : `${t.trialNormalPrefix}${daysLeft}${daysLeft === 1 ? t.trialNormalSingularSuffix : t.trialNormalPluralSuffix}`}
      </span>
      <Link
        href="/org"
        className="shrink-0 text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
      >
        {t.trialActivate}
      </Link>
    </div>
  )
}
