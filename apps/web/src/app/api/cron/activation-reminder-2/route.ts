import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkCronAuth } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const authError = checkCronAuth(req)
  if (authError) return authError

  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mitikus.com'

  // Usuarios que recibieron el día-3 hace 4+ días, sin recordatorio día-7,
  // y aún sin ninguna ejecución de herramienta
  const users = await db.user.findMany({
    where: {
      activationReminderSentAt:  { not: null, lte: fourDaysAgo },
      activation2ReminderSentAt: null,
      toolExecutions:            { none: {} },
    },
    select: {
      id:     true,
      email:  true,
      name:   true,
      orgId:  true,
    },
  })

  if (users.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  const { sendDay7ReminderEmail } = await import('@/lib/email')

  const results = await Promise.allSettled(
    users.map(async (user) => {
      const workspace = await db.workspace.findFirst({
        where:  { orgId: user.orgId },
        select: { id: true },
      })
      const workspaceUrl = workspace
        ? `${appUrl}/workspace/${workspace.id}/tools`
        : appUrl

      await sendDay7ReminderEmail({
        to:           user.email,
        userName:     user.name,
        workspaceUrl,
      })

      await db.user.update({
        where: { id: user.id },
        data:  { activation2ReminderSentAt: new Date() },
      })
    }),
  )

  const sent   = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return NextResponse.json({ sent, failed })
}
