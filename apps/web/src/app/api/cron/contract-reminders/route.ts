import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkCronAuth } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Verificar secret de Vercel Cron
  const authError = checkCronAuth(req)
  if (authError) return authError

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)

  // Contratos SENT con email, sin recordatorio enviado, enviados hace 3+ días
  const contracts = await db.contract.findMany({
    where: {
      status: 'SENT',
      clientEmail: { not: null },
      reminderSentAt: null,
      updatedAt: { lte: threeDaysAgo },
    },
    select: {
      id: true,
      title: true,
      clientEmail: true,
      clientName: true,
      shareToken: true,
    },
  })

  if (contracts.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mitikus.com'
  const { sendContractReminderEmail } = await import('@/lib/email')

  const results = await Promise.allSettled(
    contracts.map(async (contract) => {
      await sendContractReminderEmail({
        to: contract.clientEmail!,
        clientName: contract.clientName,
        contractTitle: contract.title,
        signUrl: `${appUrl}/contracts/sign/${contract.shareToken}`,
      })
      await db.contract.update({
        where: { id: contract.id },
        data: { reminderSentAt: new Date() },
      })
    })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return NextResponse.json({ sent, failed })
}
