import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { db } from '@/lib/db'
import type { MailAttachment } from '@/lib/mail/smtp-client'

type InvoiceItem = {
  description?: string
  qty?: number
  unitPrice?: number
  total?: number
}

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 42

function formatMoney(value: number, currency = 'EUR') {
  return `${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

function formatDate(value: Date | null) {
  return value ? value.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null
}

function formatIban(iban: string | null | undefined) {
  if (!iban) return null
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

function safeText(value: string | null | undefined) {
  return (value ?? '').replace(/[\u2010-\u2015]/g, '-').replace(/\u20ac/g, 'EUR')
}

function splitText(text: string, maxChars: number) {
  const words = safeText(text).split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

export async function buildInvoicePdfAttachment(workspaceId: string, invoiceId: string): Promise<MailAttachment> {
  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, workspaceId },
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

  if (!invoice) throw new Error('Factura no encontrada para adjuntar.')

  const pdf = await PDFDocument.create()
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const profile = invoice.workspace.companyProfile
  const issuerName = profile?.fiscalName || invoice.workspace.name
  const client = invoice.client
  const items = (invoice.items as InvoiceItem[]) ?? []
  const issuerLocation = formatLocation(profile?.fiscalPostalCode, profile?.fiscalCity, profile?.fiscalProvince)
  const clientLocation = formatLocation(client?.postalCode, client?.city, client?.province)
  const iban = formatIban(profile?.iban)

  const draw = (text: string, x: number, y: number, size = 10, isBold = false, color = rgb(0.06, 0.09, 0.16)) => {
    page.drawText(safeText(text), { x, y, size, font: isBold ? bold : font, color })
  }
  const line = (x1: number, y: number, x2: number) => {
    page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: 0.6, color: rgb(0.88, 0.9, 0.93) })
  }

  let y = PAGE_HEIGHT - 54
  draw(issuerName, MARGIN, y, 20, true)
  y -= 18
  const issuerLines = [
    profile?.nif ? `NIF/CIF: ${profile.nif}` : null,
    profile?.fiscalAddress,
    issuerLocation,
    profile?.fiscalCountry,
    profile?.fiscalEmail,
    profile?.fiscalPhone,
    iban ? `IBAN: ${iban}` : null,
    profile?.tradeRegistry,
  ].filter(Boolean) as string[]
  for (const value of issuerLines) {
    draw(value, MARGIN, y, 9)
    y -= 12
  }

  page.drawRectangle({ x: PAGE_WIDTH - 119, y: PAGE_HEIGHT - 62, width: 76, height: 18, color: rgb(0.86, 0.45, 0.02) })
  draw(invoice.status.toUpperCase(), PAGE_WIDTH - 101, PAGE_HEIGHT - 56, 8, true, rgb(1, 1, 1))
  draw('FACTURA No', PAGE_WIDTH - 126, PAGE_HEIGHT - 84, 9, true, rgb(0.39, 0.45, 0.55))
  draw(invoice.number, PAGE_WIDTH - 126, PAGE_HEIGHT - 108, 22, true)

  line(MARGIN, PAGE_HEIGHT - 156, PAGE_WIDTH - MARGIN)

  const boxTop = PAGE_HEIGHT - 180
  const boxHeight = 130
  page.drawRectangle({ x: MARGIN, y: boxTop - boxHeight, width: 250, height: boxHeight, borderColor: rgb(0.88, 0.9, 0.93), borderWidth: 1, color: rgb(0.98, 0.99, 1) })
  page.drawRectangle({ x: 303, y: boxTop - boxHeight, width: 250, height: boxHeight, borderColor: rgb(0.88, 0.9, 0.93), borderWidth: 1, color: rgb(0.98, 0.99, 1) })

  draw('FACTURAR A', MARGIN + 14, boxTop - 22, 8, true, rgb(0.39, 0.45, 0.55))
  let leftY = boxTop - 42
  draw(client?.name ?? '-', MARGIN + 14, leftY, 11, true)
  leftY -= 14
  const clientLines = [
    client?.taxId ? `NIF/CIF: ${client.taxId}` : null,
    client?.fiscalAddress,
    clientLocation,
    client?.country,
    client?.email,
    client?.phone,
  ].filter(Boolean) as string[]
  for (const value of clientLines) {
    draw(value, MARGIN + 14, leftY, 9)
    leftY -= 12
  }

  draw('DETALLES', 317, boxTop - 22, 8, true, rgb(0.39, 0.45, 0.55))
  let rightY = boxTop - 42
  const detailLines = [
    `Fecha: ${formatDate(invoice.date)}`,
    invoice.dueDate ? `Vencimiento: ${formatDate(invoice.dueDate)}` : null,
    invoice.purchaseOrder ? `Referencia: ${invoice.purchaseOrder}` : null,
    invoice.paymentMethod ? `Forma de pago: ${invoice.paymentMethod}` : null,
  ].filter(Boolean) as string[]
  for (const value of detailLines) {
    draw(value, 317, rightY, 9)
    rightY -= 12
  }

  let tableY = boxTop - boxHeight - 42
  draw('DESCRIPCION', MARGIN, tableY, 8, true, rgb(0.39, 0.45, 0.55))
  draw('CANT.', 312, tableY, 8, true, rgb(0.39, 0.45, 0.55))
  draw('P. UNIT.', 384, tableY, 8, true, rgb(0.39, 0.45, 0.55))
  draw('TOTAL', 489, tableY, 8, true, rgb(0.39, 0.45, 0.55))
  line(MARGIN, tableY - 10, PAGE_WIDTH - MARGIN)
  tableY -= 30

  for (const item of items) {
    const lines = splitText(item.description || 'Servicio', 48)
    draw(lines[0]!, MARGIN, tableY, 9)
    for (let i = 1; i < lines.length; i += 1) {
      tableY -= 11
      draw(lines[i]!, MARGIN, tableY, 9)
    }
    draw(String(item.qty ?? 1), 320, tableY, 9)
    draw((item.unitPrice ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 384, tableY, 9)
    draw(formatMoney(item.total ?? 0, invoice.currency), 470, tableY, 9, true)
    tableY -= 24
  }

  const totalsX = PAGE_WIDTH - 220
  let totalsY = 245
  page.drawRectangle({ x: totalsX - 8, y: totalsY - 68, width: 186, height: 92, borderColor: rgb(0.88, 0.9, 0.93), borderWidth: 1, color: rgb(0.98, 0.99, 1) })
  draw('Subtotal', totalsX, totalsY, 10, false, rgb(0.28, 0.33, 0.41))
  draw(formatMoney(invoice.subtotal, invoice.currency), totalsX + 92, totalsY, 10)
  totalsY -= 19
  draw(`IVA (${invoice.taxRate}%)`, totalsX, totalsY, 10, false, rgb(0.28, 0.33, 0.41))
  draw(formatMoney(invoice.tax, invoice.currency), totalsX + 92, totalsY, 10)
  line(totalsX, totalsY - 10, totalsX + 160)
  totalsY -= 32
  draw('Total', totalsX, totalsY, 13, true)
  draw(formatMoney(invoice.total, invoice.currency), totalsX + 80, totalsY, 13, true)

  const notes = invoice.notes || profile?.defaultPaymentNotes || invoice.legalNote
  if (notes) {
    page.drawRectangle({ x: MARGIN, y: 96, width: PAGE_WIDTH - MARGIN * 2, height: 42, color: rgb(0.98, 0.99, 1) })
    const noteLines = splitText(notes, 95).slice(0, 2)
    let noteY = 120
    for (const value of noteLines) {
      draw(value, MARGIN + 12, noteY, 9, false, rgb(0.28, 0.33, 0.41))
      noteY -= 12
    }
  }

  draw('Generado por MITIKUS - mitikus.com', 230, 48, 8, false, rgb(0.58, 0.64, 0.72))

  const bytes = await pdf.save()
  return {
    filename: `factura-${invoice.number}.pdf`,
    contentType: 'application/pdf',
    content: Buffer.from(bytes),
  }
}