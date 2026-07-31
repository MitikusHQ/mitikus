import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; invoiceId: string }> },
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new NextResponse('Unauthorized', { status: 401 })

  const { workspaceId, invoiceId } = await params

  const invoice = await db.invoice.findFirst({
    where:   { id: invoiceId, workspaceId },
    include: { client: { select: { name: true, email: true } }, workspace: { select: { name: true } } },
  })
  if (!invoice) return new NextResponse('Not found', { status: 404 })

  const items = invoice.items as Array<{ description: string; qty: number; unitPrice: number; total: number }>

  const fmtDate = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const fmtMoney = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const itemRows = items.map(it => `
    <tr>
      <td class="desc">${escHtml(it.description)}</td>
      <td class="num">${it.qty}</td>
      <td class="num">${fmtMoney(it.unitPrice)}</td>
      <td class="num bold">${fmtMoney(it.total)} ${invoice.currency}</td>
    </tr>`).join('')

  const STATUS_ES: Record<string, string> = {
    borrador: 'BORRADOR', enviada: 'ENVIADA', pagada: 'PAGADA', vencida: 'VENCIDA', cancelada: 'CANCELADA',
  }
  const statusLabel = STATUS_ES[invoice.status] ?? invoice.status.toUpperCase()
  const statusColor = invoice.status === 'pagada' ? '#16a34a' : invoice.status === 'vencida' ? '#dc2626' : invoice.status === 'enviada' ? '#d97706' : '#6b7280'

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, Arial, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 48px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .company { font-size: 22px; font-weight: 700; color: #111; }
  .badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; color: #fff; background: ${statusColor}; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 36px; }
  .meta-block h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 6px; }
  .meta-block p { font-size: 13px; color: #111; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #888; border-bottom: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
  tbody td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .bold { font-weight: 600; }
  .desc { max-width: 320px; }
  .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
  .totals-box { width: 240px; }
  .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #555; }
  .totals-row.final { font-weight: 700; font-size: 15px; color: #111; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 4px; }
  .notes { margin-top: 32px; padding: 16px; background: #f9fafb; border-radius: 8px; font-size: 12px; color: #555; line-height: 1.6; }
  .footer { margin-top: 48px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 16px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">${escHtml(invoice.workspace.name)}</div>
    </div>
    <div style="text-align:right">
      <div class="badge">${statusLabel}</div>
      <div style="font-size:24px;font-weight:700;color:#111;margin-top:8px">${escHtml(invoice.number)}</div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-block">
      <h4>Facturar a</h4>
      <p><strong>${escHtml(invoice.client?.name ?? '—')}</strong></p>
      ${invoice.client?.email ? `<p>${escHtml(invoice.client.email)}</p>` : ''}
    </div>
    <div class="meta-block">
      <h4>Detalles</h4>
      <p>Fecha: ${fmtDate(invoice.date)}</p>
      ${invoice.dueDate ? `<p>Vencimiento: ${fmtDate(invoice.dueDate)}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th style="text-align:right">Cant.</th>
        <th style="text-align:right">P. unit.</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>${fmtMoney(invoice.subtotal)} ${invoice.currency}</span></div>
      <div class="totals-row"><span>IVA (${invoice.taxRate}%)</span><span>${fmtMoney(invoice.tax)} ${invoice.currency}</span></div>
      <div class="totals-row final"><span>Total</span><span>${fmtMoney(invoice.total)} ${invoice.currency}</span></div>
    </div>
  </div>

  ${invoice.notes ? `<div class="notes">${escHtml(invoice.notes)}</div>` : ''}

  <div class="footer">Generado por MITIKUS · mitikus.com</div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="factura-${invoice.number}.html"`,
    },
  })
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
