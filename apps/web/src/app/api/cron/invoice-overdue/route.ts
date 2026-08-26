/**
 * GET /api/cron/invoice-overdue
 *
 * Cron diario (09:30 UTC) que:
 *   1. Encuentra facturas con status='enviada' y dueDate < hoy.
 *   2. Las marca como 'vencida'.
 *   3. Envía un email digest al owner del workspace (una vez por factura).
 *
 * Agrupa las facturas vencidas por workspace para enviar un solo email
 * por workspace, no uno por factura.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkCronAuth } from '@/lib/cron-auth'
import { sendInvoiceOverdueEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const authError = checkCronAuth(req)
  if (authError) return authError

  const now = new Date()

  // Facturas enviadas vencidas, sin notificación enviada todavía
  const overdueInvoices = await db.invoice.findMany({
    where: {
      status: 'enviada',
      dueDate: { lt: now },
      overdueNotifiedAt: null,
    },
    select: {
      id:          true,
      number:      true,
      total:       true,
      currency:    true,
      dueDate:     true,
      workspaceId: true,
      client:      { select: { name: true } },
      workspace:   {
        select: {
          name: true,
          orgId: true,
        },
      },
    },
  })

  if (overdueInvoices.length === 0) {
    return NextResponse.json({ processed: 0, notified: 0 })
  }

  // Marcar todas como vencidas de golpe
  await db.invoice.updateMany({
    where: { id: { in: overdueInvoices.map((i) => i.id) } },
    data: { status: 'vencida', overdueNotifiedAt: now },
  })

  // Agrupar por workspace para un email por workspace
  const byWorkspace = new Map<string, typeof overdueInvoices>()
  for (const inv of overdueInvoices) {
    const list = byWorkspace.get(inv.workspaceId) ?? []
    list.push(inv)
    byWorkspace.set(inv.workspaceId, list)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mitikus.com'
  let notified = 0

  const emailResults = await Promise.allSettled(
    Array.from(byWorkspace.entries()).map(async ([workspaceId, invoices]) => {
      const orgId = invoices[0]!.workspace.orgId
      const workspaceName = invoices[0]!.workspace.name

      const owner = await db.user.findFirst({
        where: { orgId, role: 'OWNER' },
        select: { email: true, name: true },
      })
      if (!owner) return

      await sendInvoiceOverdueEmail({
        to: owner.email,
        ownerName: owner.name,
        workspaceName,
        overdueInvoices: invoices.map((inv) => ({
          number:     inv.number,
          clientName: inv.client?.name ?? null,
          total:      inv.total,
          currency:   inv.currency,
          dueDate:    inv.dueDate!,
        })),
        invoicesUrl: `${appUrl}/workspace/${workspaceId}/invoices`,
      })
      notified++
    })
  )

  const failed = emailResults.filter((r) => r.status === 'rejected').length

  return NextResponse.json({
    processed: overdueInvoices.length,
    notified,
    failed,
  })
}
