import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkCronAuth } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const authError = checkCronAuth(req)
  if (authError) return authError

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mitikus.com'

  // Suscripciones en trial que terminan en ≤3 días y aún no recibieron el aviso
  const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

  const subs = await db.subscription.findMany({
    where: {
      status: 'TRIALING',
      trialEndsAt: { not: null, lte: in3Days },
      trialEndReminderSentAt: null,
    },
    select: {
      id: true,
      trialEndsAt: true,
      organization: {
        select: {
          id: true,
          users: {
            where: { role: 'OWNER' },
            take: 1,
            select: { id: true, email: true, name: true },
          },
          workspaces: { take: 1, select: { id: true } },
        },
      },
    },
  })

  if (subs.length === 0) return NextResponse.json({ sent: 0 })

  const { sendTrialEndingEmail } = await import('@/lib/email')

  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      const owner = sub.organization.users[0]
      if (!owner) return

      const daysLeft = Math.ceil(
        (new Date(sub.trialEndsAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
      if (daysLeft <= 0) return

      const workspaceId = sub.organization.workspaces[0]?.id
      const upgradeUrl = workspaceId
        ? `${appUrl}/workspace/${workspaceId}/settings`
        : `${appUrl}/org`

      await sendTrialEndingEmail({
        to: owner.email,
        userName: owner.name,
        daysLeft,
        upgradeUrl,
      })

      await db.subscription.update({
        where: { id: sub.id },
        data: { trialEndReminderSentAt: new Date() },
      })
    }),
  )

  const sent   = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return NextResponse.json({ sent, failed })
}
