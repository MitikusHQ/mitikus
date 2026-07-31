import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkCronAuth } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const authError = checkCronAuth(req)
  if (authError) return authError

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mitikus.com'

  // Usuarios que llevan 3+ días registrados, no han recibido el recordatorio
  // y no tienen ninguna ejecución de herramienta
  const users = await db.user.findMany({
    where: {
      createdAt: { lte: threeDaysAgo },
      activationReminderSentAt: null,
      toolExecutions: { none: {} },
    },
    select: {
      id: true,
      email: true,
      name: true,
      // Tomamos el primer workspace del usuario para construir la URL
      org: {
        select: {
          workspaces: {
            take: 1,
            select: { id: true },
          },
        },
      },
    },
  })

  if (users.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  const { sendActivationReminderEmail } = await import('@/lib/email')

  const results = await Promise.allSettled(
    users.map(async (user) => {
      const workspaceId = user.org.workspaces[0]?.id
      const workspaceUrl = workspaceId
        ? `${appUrl}/workspace/${workspaceId}/tools`
        : `${appUrl}/dashboard`

      await sendActivationReminderEmail({
        to: user.email,
        userName: user.name,
        workspaceUrl,
      })

      await db.user.update({
        where: { id: user.id },
        data: { activationReminderSentAt: new Date() },
      })
    }),
  )

  const sent   = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return NextResponse.json({ sent, failed })
}
