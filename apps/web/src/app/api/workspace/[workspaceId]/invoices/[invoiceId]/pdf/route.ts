import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import QRCode from 'qrcode'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; invoiceId: string }> },
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new NextResponse('Unauthorized', { status: 401 })

  const { workspaceId, invoiceId } = await params
  const user = await db.user.findUnique({
    where: { clerkId },
    select: { orgId: true },
  })
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) return new NextResponse('Not found', { status: 404 })

  const invoice = await db.invoice.findFirst({
    where:   { id: invoiceId, workspaceId },
    include: {
      client: {
        select: {
          name: true,
          email: true,
          phone: true,
          taxId: true,
          fiscalAddress: true,
          postalCode: true,
          city: true,
          province: true,
          country: true,
        },
      },
      workspace: {
        select: {
          name: true,
          logoUrl: true,
          companyProfile: {
            select: {
              fiscalName: true,
              nif: true,
              fiscalAddress: true,
              fiscalPostalCode: true,
              fiscalCity: true,
              fiscalProvince: true,
              fiscalCountry: true,
              fiscalEmail: true,
              fiscalPhone: true,
              tradeRegistry: true,
              iban: true,
              defaultPaymentNotes: true,
            },
          },
        },
      },
    },
  })
  if (!invoice) return new NextResponse('Not found', { status: 404 })

  const items = invoice.items as Array<{ description: string; qty: number; unitPrice: number; total: number }>
  const issuer = invoice.workspace.companyProfile
  const issuerName = issuer?.fiscalName || invoice.workspace.name
  const issuerLogoUrl = invoice.workspace.logoUrl
  const paymentNotes = invoice.notes || issuer?.defaultPaymentNotes || null
  const issuerLocation = formatLocation(issuer?.fiscalPostalCode, issuer?.fiscalCity, issuer?.fiscalProvince)
  const clientLocation = formatLocation(invoice.client?.postalCode, invoice.client?.city, invoice.client?.province)

  const fmtDate = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const fmtMoney = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const PAYMENT_METHOD_ES: Record<string, string> = {
    transferencia: 'Transferencia',
    tarjeta: 'Tarjeta',
    efectivo: 'Efectivo',
    domiciliacion: 'Domiciliación',
    otro: 'Otro',
  }

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
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; font-size: 12px; color: #111827; background: #fff; padding: 34px 42px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 28px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb; margin-bottom: 20px; }
  .issuer { display: grid; grid-template-columns: auto 1fr; gap: 16px; align-items: start; min-width: 0; }
  .issuer-logo { display: block; width: 76px; height: 76px; object-fit: cover; border-radius: 2px; }
  .company { font-size: 24px; line-height: 1.1; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
  .issuer-details p { color: #111827; line-height: 1.35; }
  .invoice-title { text-align: right; min-width: 180px; }
  .badge { display: inline-flex; padding: 5px 16px; border-radius: 999px; font-size: 10px; font-weight: 800; letter-spacing: 0.08em; color: #fff; background: ${statusColor}; }
  .invoice-label { margin-top: 10px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
  .invoice-number { font-size: 24px; line-height: 1.1; font-weight: 800; color: #0f172a; margin-top: 3px; }
  .meta { display: grid; grid-template-columns: 1.2fr 1fr; gap: 18px; margin-bottom: 24px; }
  .meta-block { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px 18px; background: #fbfdff; }
  .meta-block h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 9px; }
  .meta-block p { font-size: 12px; color: #111827; line-height: 1.45; white-space: pre-line; }
  .meta-block strong { font-size: 14px; color: #0f172a; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 22px; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
  thead th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; }
  tbody td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  tbody tr:last-child td { border-bottom: 0; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .bold { font-weight: 600; }
  .desc { max-width: 420px; }
  .summary { display: flex; justify-content: flex-end; margin-bottom: 22px; }
  .totals-box { width: 285px; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; background: #fbfdff; }
  .totals-row { display: flex; justify-content: space-between; gap: 16px; padding: 5px 0; font-size: 12px; color: #475569; }
  .totals-row.final { font-weight: 800; font-size: 16px; color: #0f172a; border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 5px; }
  .notes { margin-top: 14px; padding: 13px 15px; background: #f8fafc; border: 1px solid #eef2f7; border-radius: 10px; font-size: 12px; color: #475569; line-height: 1.55; }
  .footer { margin-top: 34px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 14px; }
</style>
</head>
<body>
  <div class="header">
    <div class="issuer">
      ${issuerLogoUrl ? `<img class="issuer-logo" src="${escHtml(issuerLogoUrl)}" alt="${escHtml(issuerName)}"/>` : ''}
      <div class="issuer-details">
        <div class="company">${escHtml(issuerName)}</div>
        ${issuer?.nif ? `<p>NIF/CIF: ${escHtml(issuer.nif)}</p>` : ''}
        ${issuer?.fiscalAddress ? `<p>${escHtml(issuer.fiscalAddress)}</p>` : ''}
        ${issuerLocation ? `<p>${escHtml(issuerLocation)}</p>` : ''}
        ${issuer?.fiscalCountry ? `<p>${escHtml(issuer.fiscalCountry)}</p>` : ''}
        ${issuer?.fiscalEmail ? `<p>${escHtml(issuer.fiscalEmail)}</p>` : ''}
        ${issuer?.fiscalPhone ? `<p>${escHtml(issuer.fiscalPhone)}</p>` : ''}
        ${issuer?.iban ? `<p>IBAN: ${escHtml(formatIban(issuer.iban))}</p>` : ''}
        ${issuer?.tradeRegistry ? `<p style="margin-top:5px">${escHtml(issuer.tradeRegistry)}</p>` : ''}
      </div>
    </div>
    <div class="invoice-title">
      <div class="badge">${statusLabel}</div>
      <div class="invoice-label">Factura nº</div>
      <div class="invoice-number">${escHtml(invoice.number)}</div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-block">
      <h4>Facturar a</h4>
      <p><strong>${escHtml(invoice.client?.name ?? '—')}</strong></p>
      ${invoice.client?.taxId ? `<p>NIF/CIF: ${escHtml(invoice.client.taxId)}</p>` : ''}
      ${invoice.client?.fiscalAddress ? `<p>${escHtml(invoice.client.fiscalAddress)}</p>` : ''}
      ${clientLocation ? `<p>${escHtml(clientLocation)}</p>` : ''}
      ${invoice.client?.country ? `<p>${escHtml(invoice.client.country)}</p>` : ''}
      ${invoice.client?.email ? `<p>${escHtml(invoice.client.email)}</p>` : ''}
      ${invoice.client?.phone ? `<p>${escHtml(invoice.client.phone)}</p>` : ''}
    </div>
    <div class="meta-block">
      <h4>Detalles</h4>
      <p>Fecha: ${fmtDate(invoice.date)}</p>
      ${invoice.operationDate && invoice.operationDate.getTime() !== invoice.date.getTime() ? `<p>Fecha operación: ${fmtDate(invoice.operationDate)}</p>` : ''}
      ${invoice.dueDate ? `<p>Vencimiento: ${fmtDate(invoice.dueDate)}</p>` : ''}
      ${invoice.purchaseOrder ? `<p>Referencia: ${escHtml(invoice.purchaseOrder)}</p>` : ''}
      ${invoice.paymentMethod ? `<p>Forma de pago: ${escHtml(PAYMENT_METHOD_ES[invoice.paymentMethod] ?? invoice.paymentMethod)}</p>` : ''}
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

  <div class="summary">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>${fmtMoney(invoice.subtotal)} ${invoice.currency}</span></div>
      <div class="totals-row"><span>IVA (${invoice.taxRate}%)</span><span>${fmtMoney(invoice.tax)} ${invoice.currency}</span></div>
      <div class="totals-row final"><span>Total</span><span>${fmtMoney(invoice.total)} ${invoice.currency}</span></div>
    </div>
  </div>

  ${paymentNotes ? `<div class="notes">${escHtml(paymentNotes)}</div>` : ''}
  ${invoice.legalNote ? `<div class="notes"><strong>Mención legal:</strong><br/>${escHtml(invoice.legalNote)}</div>` : ''}

  TRACEABILITY_BLOCK

  <div class="footer">Generado por MITIKUS · mitikus.com</div>
</body>
</html>`

  // Bloque de trazabilidad: solo si la factura tiene huella calculada
  let traceBlock = ''
  if (invoice.huella && invoice.qrUrl) {
    let qrSvg = ''
    try {
      qrSvg = await QRCode.toString(invoice.qrUrl, { type: 'svg', width: 80, margin: 1 })
    } catch {
      // Si falla el QR, seguir sin él
    }
    const fmtTs = (d: Date) => d.toLocaleString('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    traceBlock = `
    <div style="margin-top:20px;border:1px solid #e5e7eb;border-radius:10px;padding:14px 18px;background:#f8fafc;display:flex;align-items:flex-start;gap:20px;">
      ${qrSvg ? `<div style="flex-shrink:0;width:80px;height:80px;">${qrSvg}</div>` : ''}
      <div style="min-width:0;font-size:10px;color:#64748b;line-height:1.6;">
        <div style="font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Trazabilidad fiscal (Verifactu RD 1007/2023)</div>
        <div><span style="color:#374151;font-weight:600;">Huella SHA-256:</span> ${escHtml(invoice.huella)}</div>
        ${invoice.huellaAnterior ? `<div><span style="color:#374151;font-weight:600;">Huella anterior:</span> ${escHtml(invoice.huellaAnterior)}</div>` : '<div><span style="color:#374151;font-weight:600;">Primera factura de la serie</span></div>'}
        ${invoice.fechaGeneracion ? `<div><span style="color:#374151;font-weight:600;">Generada:</span> ${escHtml(fmtTs(invoice.fechaGeneracion))}</div>` : ''}
        ${invoice.enviadaAEAT ? '<div style="color:#16a34a;font-weight:600;">✓ Enviada a AEAT</div>' : '<div style="color:#92400e;">Pendiente de remisión a AEAT — fase preparatoria Verifactu</div>'}
      </div>
    </div>`
  }

  const finalHtml = html.replace('TRACEABILITY_BLOCK', traceBlock)

  return new NextResponse(finalHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="factura-${escHtml(invoice.number)}.html"`,
    },
  })
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function formatIban(iban: string) {
  const compact = iban.replace(/\s+/g, '').toUpperCase()
  if (/^ES\d+$/.test(compact) && compact.length > 14) {
    return `${compact.slice(0, 4)} ${compact.slice(4, 8)} ${compact.slice(8, 12)} ${compact.slice(12, 14)} ${compact.slice(14)}`
  }
  return compact.replace(/(.{4})/g, '$1 ').trim()
}

function formatLocation(postalCode?: string | null, city?: string | null, province?: string | null) {
  const normalizedCity = city?.trim().toLocaleLowerCase('es-ES')
  const normalizedProvince = province?.trim().toLocaleLowerCase('es-ES')
  const visibleProvince = normalizedCity && normalizedCity === normalizedProvince ? null : province
  return [postalCode, city, visibleProvince].filter(Boolean).join(' ')
}
