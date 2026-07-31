import Link from 'next/link'
import { db } from '@/lib/db'

interface Props {
  orgId: string
}

export async function TrialBanner({ orgId }: Props) {
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
          ? `⚠️ Tu periodo de prueba termina en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}. No perderás nada si activas tu plan ahora.`
          : `Periodo de prueba · ${daysLeft} día${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}`}
      </span>
      <Link
        href="/org"
        className="shrink-0 text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
      >
        Activar plan →
      </Link>
    </div>
  )
}
