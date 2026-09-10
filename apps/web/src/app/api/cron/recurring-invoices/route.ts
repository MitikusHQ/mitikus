/**
 * GET /api/cron/recurring-invoices
 *
 * Cron diario (08:00 UTC) que:
 *   1. Busca facturas plantilla (recurringInterval != null) cuya recurringNextDate <= hoy.
 *   2. Crea una copia en estado "borrador" con nueva fecha/número y sin huella Verifactu.
 *   3. Avanza recurringNextDate al siguiente periodo.
 *   4. Notifica al owner del workspace (in-app notification).
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkCronAuth } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

function advanceDate(from: Date, interval: string): Date {
  const d = new Date(from)
  if (interval === 'monthly')   d.setMonth(d.getMonth() + 1)
  if (interval === 'quarterly') d.setMonth(d.getMonth() + 3)
  if (interval === 'yearly')    d.setFullYear(d.getFullYear() + 1)
  return d
}

function nextInvoiceNumber(existing: string): string {
  // Formato esperado: "YYYY-NNN" — incrementa el contador
  const match = existing.match(/^(\D*)(\d+)$/)
  if (!match) return existing + '-1'
  const prefix = match[1] ?? ''
  const numStr = match[2] ?? '0'
  const num = parseInt(numStr, 10) + 1
  return `${prefix}${String(num).padStart(numStr.length, '0')}`
}

export async function GET(req: Request) {
  const authError = checkCronAuth(req)
  if (authError) return authError

  const now = new Date()

  const templates = await db.invoice.findMany({
    where: {
      recurringInterval: { not: null },
      recurringNextDate: { lte: now },
      recurringAnchorId: null, // solo plantillas, no copias
    },
    select: {
      id:               true,
      workspaceId:      true,
      clientId:         true,
      number:           true,
      dueDate:          true,
      items:            true,
      subtotal:         true,
      taxRate:          true,
      tax:              true,
      total:            true,
      currency:         true,
      notes:            true,
      paymentMethod:    true,
      purchaseOrder:    true,
      legalNote:        true,
      serie:            true,
      tipoFactura:      true,
      recurringInterval: true,
      recurringNextDate: true,
    },
  })

  if (templates.length === 0) return NextResponse.json({ created: 0 })

  let created = 0
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mitikus.com'

  await Promise.allSettled(
    templates.map(async (tpl) => {
      const newNumber = nextInvoiceNumber(tpl.number)
      const newDate   = new Date()
      const newDue    = tpl.dueDate
        ? new Date(newDate.getTime() + (tpl.dueDate.getTime() - tpl.recurringNextDate!.getTime()))
        : null

      // Crear la factura copia en borrador
      await db.invoice.create({
        data: {
          workspaceId:       tpl.workspaceId,
          clientId:          tpl.clientId,
          number:            newNumber,
          date:              newDate,
          dueDate:           newDue,
          status:            'borrador',
          items:             tpl.items as never,
          subtotal:          tpl.subtotal,
          taxRate:           tpl.taxRate,
          tax:               tpl.tax,
          total:             tpl.total,
          currency:          tpl.currency,
          notes:             tpl.notes,
          paymentMethod:     tpl.paymentMethod,
          purchaseOrder:     tpl.purchaseOrder,
          legalNote:         tpl.legalNote,
          serie:             tpl.serie,
          tipoFactura:       tpl.tipoFactura,
          recurringAnchorId: tpl.id,
        },
      })

      // Avanzar la fecha de la plantilla
      const nextDate = advanceDate(tpl.recurringNextDate!, tpl.recurringInterval!)
      await db.invoice.update({
        where: { id: tpl.id },
        data:  { recurringNextDate: nextDate },
      })

      // Notificación in-app al owner del workspace
      const ws = await db.workspace.findUnique({
        where:  { id: tpl.workspaceId },
        select: { orgId: true },
      })
      if (ws) {
        const owner = await db.user.findFirst({
          where:  { orgId: ws.orgId, role: 'OWNER' },
          select: { id: true },
        })
        if (owner) {
          await db.notification.create({
            data: {
              userId:      owner.id,
              workspaceId: tpl.workspaceId,
              type:        'recurring_invoice',
              message:     `Factura recurrente generada: ${newNumber} (${tpl.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} ${tpl.currency})`,
              link:        `${appUrl}/workspace/${tpl.workspaceId}/invoices`,
            },
          })
        }
      }

      created++
    })
  )

  return NextResponse.json({ created })
}
