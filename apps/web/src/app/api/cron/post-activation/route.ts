import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkCronAuth } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const authError = checkCronAuth(req)
  if (authError) return authError

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mitikus.com'
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Usuarios con al menos 1 ejecución, 7+ días en la plataforma, sin email post-activación
  const users = await db.user.findMany({
    where: {
      createdAt: { lte: sevenDaysAgo },
      postActivationEmailSentAt: null,
      toolExecutions: { some: {} },
    },
    select: {
      id: true,
      email: true,
      name: true,
      orgId: true,
      _count: { select: { toolExecutions: true } },
    },
  })

  if (users.length === 0) return NextResponse.json({ sent: 0 })

  const { sendPostActivationEmail } = await import('@/lib/email')

  const results = await Promise.allSettled(
    users.map(async (user) => {
      const workspace = await db.workspace.findFirst({
        where: { orgId: user.orgId },
        select: { id: true },
      })
      const workspaceUrl = workspace
        ? `${appUrl}/workspace/${workspace.id}`
        : appUrl

      await sendPostActivationEmail({
        to: user.email,
        userName: user.name,
        workspaceUrl,
        executionCount: user._count.toolExecutions,
      })

      await db.user.update({
        where: { id: user.id },
        data: { postActivationEmailSentAt: new Date() },
      })
    }),
  )

  const sent   = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return NextResponse.json({ sent, failed })
}
