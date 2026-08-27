'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { deliverMailMessage } from '@/lib/mail/delivery'
import { syncInboxForWorkspace } from '@/lib/mail/inbox-sync'
import { decryptSafe } from '@/lib/crypto'
import {
  calcularHuella,
  generarURLVerificacion,
  formatFechaAEAT,
  formatTimestampAEAT,
} from '@/lib/verifactu'
import { assertCan } from '@/lib/permissions'
import { trackInvoiceCreated, trackInvoiceEmitted, trackInvoiceSent } from '@/lib/pmf-analytics'

export interface InvoiceItem {
  description: string
  qty:         number
  unitPrice:   number
  total:       number
}

export interface InvoiceMailMessage {
  id: string
  direction: string
  fromName: string
  fromEmail: string | null
  toEmail: string
  subject: string
  body: string
  status: string
  createdAt: string
  sentAt: string | null
}

export interface InvoiceData {
  id:          string
  number:      string
  clientId:    string | null
  clientName:  string | null
  date:        string
  operationDate: string | null
  dueDate:     string | null
  status:      string
  items:       InvoiceItem[]
  subtotal:    number
  taxRate:     number
  tax:         number
  total:       number
  currency:    string
  notes:       string | null
  paymentMethod: string | null
  purchaseOrder: string | null
  legalNote:    string | null
  createdAt:   string
  // Verifactu
  serie:          string
  tipoFactura:    string
  huella:         string | null
  huellaAnterior: string | null
  fechaGeneracion: string | null
  enviadaAEAT:    boolean
  qrUrl:          string | null
  // Rectificativa
  rectificaId:    string | null
  mailMessages:   InvoiceMailMessage[]
}

export interface InvoiceInput {
  number:      string
  clientId?:   string | null
  date:        string
  operationDate?: string | null
  dueDate?:    string | null
  status?:     string
  items:       InvoiceItem[]
  subtotal:    number
  taxRate:     number
  tax:         number
  total:       number
  currency?:   string
  notes?:      string | null
  paymentMethod?: string | null
  purchaseOrder?: string | null
  legalNote?:    string | null
}

async function requireAuth() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('User not found')
  return user
}

async function assertWorkspaceAccess(workspaceId: string) {
  const user = await requireAuth()
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) throw new Error('Workspace not found')
  return user
}

async function assertInvoiceWrite(workspaceId: string) {
  const user = await assertWorkspaceAccess(workspaceId)
  assertCan(user, 'create_invoice')
  return user
}

async function assertInvoiceEdit(workspaceId: string) {
  const user = await assertWorkspaceAccess(workspaceId)
  assertCan(user, 'delete_invoice')  // EDITOR+ — para emitir, enviar y eliminar
  return user
}

function repairMailText(value: string | null) {
  if (!value || !/[ÃÂ]/.test(value)) return value
  try {
    const repaired = Buffer.from(value, 'latin1').toString('utf8')
    return repaired.includes('�') ? value : repaired
  } catch {
    return value
  }
}

function mapInvoice(r: {
  id: string; number: string; clientId: string | null; client: { name: string } | null;
  date: Date; operationDate: Date | null; dueDate: Date | null; status: string; items: unknown; subtotal: number;
  taxRate: number; tax: number; total: number; currency: string; notes: string | null;
  paymentMethod: string | null; purchaseOrder: string | null; legalNote: string | null; createdAt: Date;
  serie: string; tipoFactura: string; huella: string | null; huellaAnterior: string | null;
  fechaGeneracion: Date | null; enviadaAEAT: boolean; qrUrl: string | null;
  rectificaId: string | null;
  mailMessages?: Array<{ id: string; direction: string; fromName: string; fromEmail: string | null; toEmail: string; subject: string; body: string; status: string; createdAt: Date; sentAt: Date | null }>;
}): InvoiceData {
  return {
    id:         r.id,
    number:     r.number,
    clientId:   r.clientId,
    clientName: r.client?.name ?? null,
    date:       r.date.toISOString(),
    operationDate: r.operationDate?.toISOString() ?? null,
    dueDate:    r.dueDate?.toISOString() ?? null,
    status:     r.status,
    items:      (r.items as unknown as InvoiceItem[]) ?? [],
    subtotal:   r.subtotal,
    taxRate:    r.taxRate,
    tax:        r.tax,
    total:      r.total,
    currency:   r.currency,
    notes:      r.notes,
    paymentMethod: r.paymentMethod,
    purchaseOrder: r.purchaseOrder,
    legalNote:     r.legalNote,
    createdAt:  r.createdAt.toISOString(),
    serie:           r.serie,
    tipoFactura:     r.tipoFactura,
    huella:          r.huella,
    huellaAnterior:  r.huellaAnterior,
    fechaGeneracion: r.fechaGeneracion?.toISOString() ?? null,
    enviadaAEAT:     r.enviadaAEAT,
    qrUrl:           r.qrUrl,
    rectificaId:     r.rectificaId,
    mailMessages:    (r.mailMessages ?? []).map((message) => ({
      id:        message.id,
      direction: message.direction,
      fromName:  repairMailText(message.fromName) ?? message.fromName,
      fromEmail: message.fromEmail,
      toEmail:   message.toEmail,
      subject:   repairMailText(message.subject) ?? message.subject,
      body:      repairMailText(message.body) ?? message.body,
      status:    message.status,
      createdAt: message.createdAt.toISOString(),
      sentAt:    message.sentAt?.toISOString() ?? null,
    })),
  }
}

const includeClient = {
  client: { select: { name: true } },
  mailMessages: {
    orderBy: { createdAt: 'desc' as const },
    take: 10,
    select: {
      id: true,
      direction: true,
      fromName: true,
      fromEmail: true,
      toEmail: true,
      subject: true,
      body: true,
      status: true,
      createdAt: true,
      sentAt: true,
    },
  },
}

export async function getInvoices(workspaceId: string): Promise<InvoiceData[]> {
  await assertWorkspaceAccess(workspaceId)
  const rows = await db.invoice.findMany({
    where:   { workspaceId },
    include: includeClient,
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(mapInvoice)
}

export async function getInvoice(workspaceId: string, invoiceId: string): Promise<InvoiceData | null> {
  await assertWorkspaceAccess(workspaceId)
  const r = await db.invoice.findFirst({
    where:   { id: invoiceId, workspaceId },
    include: includeClient,
  })
  return r ? mapInvoice(r) : null
}

export async function getNextInvoiceNumber(workspaceId: string): Promise<string> {
  await assertWorkspaceAccess(workspaceId)
  const year = new Date().getFullYear()
  const prefix = `${year}-`

  // ARCH1: SELECT FOR UPDATE dentro de una transacción para evitar race conditions
  // bajo concurrencia. El lock row-level impide que dos sesiones simultáneas
  // obtengan el mismo número correlativo.
  const result = await db.$transaction(async (tx) => {
    // Bloqueamos las filas del workspace+año antes de contar
    await tx.$queryRawUnsafe(
      `SELECT id FROM "Invoice" WHERE "workspaceId" = $1 AND number LIKE $2 FOR UPDATE`,
      workspaceId,
      `${prefix}%`,
    )
    const count = await tx.invoice.count({
      where: { workspaceId, number: { startsWith: prefix } },
    })
    return String(count + 1).padStart(3, '0')
  })

  return `${prefix}${result}`
}

export async function createInvoice(workspaceId: string, data: InvoiceInput): Promise<InvoiceData> {
  const user = await assertInvoiceWrite(workspaceId)
  const r = await db.invoice.create({
    data: {
      workspaceId,
      number:   data.number,
      clientId: data.clientId ?? null,
      date:     new Date(data.date),
      operationDate: data.operationDate ? new Date(data.operationDate) : null,
      dueDate:  data.dueDate ? new Date(data.dueDate) : null,
      status:   data.status ?? 'borrador',
      items:    (data.items ?? []) as object[],
      subtotal: data.subtotal,
      taxRate:  data.taxRate,
      tax:      data.tax,
      total:    data.total,
      currency: data.currency ?? 'EUR',
      notes:    data.notes ?? null,
      paymentMethod: data.paymentMethod ?? null,
      purchaseOrder: data.purchaseOrder ?? null,
      legalNote:     data.legalNote ?? null,
    },
    include: includeClient,
  })
  trackInvoiceCreated({
    orgId:       user.orgId,
    workspaceId,
    userId:      user.id,
    invoiceId:   r.id,
    total:       r.total,
    currency:    r.currency,
  })
  revalidatePath(`/workspace/${workspaceId}/invoices`)
  return mapInvoice(r)
}

// Estados que bloquean modificación y borrado
const IMMUTABLE_STATUSES = ['enviada', 'pagada', 'vencida', 'cancelada']

export async function updateInvoice(
  workspaceId: string,
  invoiceId: string,
  data: Partial<InvoiceInput>,
): Promise<InvoiceData> {
  await assertInvoiceWrite(workspaceId)
  const existing = await db.invoice.findFirst({
    where: { id: invoiceId, workspaceId },
    select: { id: true, status: true },
  })
  if (!existing) throw new Error('Factura no encontrada')
  if (IMMUTABLE_STATUSES.includes(existing.status)) {
    // En facturas emitidas solo se permite cambiar el estado (ej: enviada → pagada)
    // Cualquier cambio en el contenido fiscal está bloqueado
    const ALLOWED_KEYS_ON_EMITTED: (keyof InvoiceInput)[] = ['status']
    const attemptedKeys = Object.keys(data) as (keyof InvoiceInput)[]
    const hasFiscalChange = attemptedKeys.some(k => !ALLOWED_KEYS_ON_EMITTED.includes(k))
    if (hasFiscalChange) {
      throw new Error('No se puede modificar el contenido de una factura ya emitida. Para corregirla, crea una factura rectificativa.')
    }
  }

  const r = await db.invoice.update({
    where:   { id: invoiceId },
    data: {
      ...(data.number   !== undefined && { number:   data.number }),
      ...(data.clientId !== undefined && { clientId: data.clientId }),
      ...(data.date     !== undefined && { date:     new Date(data.date) }),
      ...(data.operationDate !== undefined && { operationDate: data.operationDate ? new Date(data.operationDate) : null }),
      ...(data.dueDate  !== undefined && { dueDate:  data.dueDate ? new Date(data.dueDate) : null }),
      ...(data.status   !== undefined && { status:   data.status }),
      ...(data.items    !== undefined && { items:    (data.items ?? []) as object[] }),
      ...(data.subtotal !== undefined && { subtotal: data.subtotal }),
      ...(data.taxRate  !== undefined && { taxRate:  data.taxRate }),
      ...(data.tax      !== undefined && { tax:      data.tax }),
      ...(data.total    !== undefined && { total:    data.total }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.notes    !== undefined && { notes:    data.notes }),
      ...(data.paymentMethod !== undefined && { paymentMethod: data.paymentMethod }),
      ...(data.purchaseOrder !== undefined && { purchaseOrder: data.purchaseOrder }),
      ...(data.legalNote     !== undefined && { legalNote: data.legalNote }),
    },
    include: includeClient,
  })
  revalidatePath(`/workspace/${workspaceId}/invoices`)
  return mapInvoice(r)
}

export async function deleteInvoice(workspaceId: string, invoiceId: string): Promise<void> {
  await assertInvoiceEdit(workspaceId)
  const existing = await db.invoice.findFirst({
    where: { id: invoiceId, workspaceId },
    select: { status: true },
  })
  if (existing && IMMUTABLE_STATUSES.includes(existing.status)) {
    throw new Error('No se puede eliminar una factura ya emitida. Las facturas emitidas forman parte del registro fiscal.')
  }
  await db.invoice.deleteMany({ where: { id: invoiceId, workspaceId } })
  revalidatePath(`/workspace/${workspaceId}/invoices`)
}

/**
 * Emite una factura: calcula la huella Verifactu, genera el QR y actualiza el estado a "enviada".
 * Debe llamarse ANTES de generar el PDF — el PDF sin huella no es legalmente válido.
 *
 * @param emisorNif - NIF del emisor (autónomo/empresa). Obtener de CompanyProfile cuando esté disponible.
 */
// LEGAL3: Valida formato NIF/CIF español (7-8 dígitos + letra, con o sin prefijo ES)
function validarNifEspanol(nif: string): boolean {
  const clean = nif.trim().toUpperCase().replace(/^ES/, '')
  // NIF (personas físicas): 8 dígitos + letra control
  // NIE (extranjeros): X/Y/Z + 7 dígitos + letra control
  // CIF (personas jurídicas): letra + 7 dígitos + dígito/letra control
  return /^[0-9]{8}[A-Z]$/.test(clean)
      || /^[XYZ][0-9]{7}[A-Z]$/.test(clean)
      || /^[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J]$/.test(clean)
}

export async function emitirFactura(
  workspaceId: string,
  invoiceId: string,
  emisorNif: string,
): Promise<InvoiceData> {
  const user = await assertInvoiceEdit(workspaceId)  // Emitir = acción irreversible, requiere EDITOR

  // LEGAL3: El NIF emisor debe tener formato válido antes de calcular el hash
  if (!validarNifEspanol(emisorNif)) {
    throw new Error(`NIF/CIF emisor inválido: "${emisorNif}". Configura un NIF/CIF español válido en el perfil fiscal del workspace antes de emitir facturas.`)
  }

  const factura = await db.invoice.findFirst({
    where: { id: invoiceId, workspaceId },
  })
  if (!factura) throw new Error('Factura no encontrada')
  if (factura.huella) throw new Error('Esta factura ya ha sido emitida')

  // 1. Obtener hash de la factura anterior del mismo workspace (encadenamiento)
  const anterior = await db.invoice.findFirst({
    where:   { workspaceId, huella: { not: null } },
    orderBy: { fechaGeneracion: 'desc' },
    select:  { huella: true, number: true, serie: true, date: true },
  })

  // 2. Preparar datos para el hash
  const fechaGeneracion = new Date()
  const numSerie = `${factura.serie}/${factura.number}`
  const fechaStr = formatFechaAEAT(factura.date)

  const huella = calcularHuella(
    {
      emisorNif,
      numSerie,
      fecha:          fechaStr,
      tipoFactura:    factura.tipoFactura,
      cuotaIVA:       factura.tax,
      importeTotal:   factura.total,
      fechaGeneracion: formatTimestampAEAT(fechaGeneracion),
    },
    anterior?.huella ?? null,
  )

  // 3. Generar URL de verificación para el QR
  const qrUrl = generarURLVerificacion(
    emisorNif,
    numSerie,
    fechaStr,
    factura.total,
    huella,
  )

  // 4. Persistir huella + marcar como enviada ANTES de entregar el PDF
  const updated = await db.invoice.update({
    where: { id: invoiceId },
    data: {
      huella,
      huellaAnterior:  anterior?.huella ?? null,
      fechaGeneracion,
      qrUrl,
      status: 'enviada',
    },
    include: includeClient,
  })

  trackInvoiceEmitted({
    orgId:       user.orgId,
    workspaceId,
    userId:      user.id,
    invoiceId,
    total:       updated.total,
  })
  revalidatePath(`/workspace/${workspaceId}/invoices`)
  return mapInvoice(updated)
}

export async function sendInvoiceToClient(
  workspaceId: string,
  invoiceId: string,
  recipientEmail: string,
  recipientName?: string,
): Promise<{ success: true; invoice: InvoiceData } | { error: string }> {
  const user = await assertInvoiceEdit(workspaceId)  // Enviar a cliente requiere EDITOR
  const email = recipientEmail.trim()
  if (!email || !email.includes('@')) return { error: 'Introduce un email válido.' }

  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, workspaceId },
    include: {
      client: {
        select: {
          name: true,
          contactName: true,
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
              iban: true,
              defaultPaymentNotes: true,
              emailSenderName: true,
              emailReplyTo: true,
              emailSignature: true,
            },
          },
        },
      },
    },
  })
  if (!invoice) return { error: 'Factura no encontrada.' }

  const profile = invoice.workspace.companyProfile
  const issuerName = profile?.fiscalName || invoice.workspace.name
  const fromName = profile?.emailSenderName || issuerName
  const replyTo = profile?.emailReplyTo || profile?.fiscalEmail || null
  const total = invoice.total.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const greetingName = recipientName?.trim() || invoice.client?.contactName?.trim() || invoice.client?.name || ''

  const body = [
    `Hola${greetingName ? ` ${greetingName}` : ''},`,
    '',
    `Te enviamos la factura ${invoice.number} por importe de ${total} ${invoice.currency}.`,
    'Adjuntamos el PDF de la factura para que puedas revisarla y guardarla.',
    '',
    profile?.emailSignature || `Gracias,\n${fromName}`,
  ].join('\n')

  const mailMessage = await db.mailMessage.create({
    data: {
      workspaceId,
      orgId: user.orgId,
      userId: user.id,
      invoiceId,
      toEmail: email,
      fromName,
      replyTo,
      subject: `Factura ${invoice.number} - ${issuerName}`,
      body,
      status: 'queued',
      provider: 'mitikus-mail',
    },
  })

  const delivery = await deliverMailMessage(mailMessage.id)
  if (!delivery.ok) {
    revalidatePath(`/workspace/${workspaceId}/invoices`)
    return { error: `La factura quedó preparada, pero no se pudo enviar todavía: ${delivery.error}` }
  }

  const sentInvoice = await db.invoice.findFirst({
    where: { id: invoiceId, workspaceId },
    include: includeClient,
  })

  trackInvoiceSent({ orgId: user.orgId, workspaceId, userId: user.id, invoiceId })
  revalidatePath(`/workspace/${workspaceId}/invoices`)
  return { success: true, invoice: mapInvoice(sentInvoice ?? invoice) }
}

export async function getInvoiceStats(workspaceId: string) {
  await assertWorkspaceAccess(workspaceId)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [allInvoices, monthInvoices] = await Promise.all([
    db.invoice.findMany({ where: { workspaceId }, select: { status: true, total: true } }),
    db.invoice.findMany({
      where: { workspaceId, createdAt: { gte: startOfMonth } },
      select: { total: true, status: true },
    }),
  ])

  const totalPendiente  = allInvoices.filter(i => i.status === 'enviada').reduce((s, i) => s + i.total, 0)
  const totalPagado     = allInvoices.filter(i => i.status === 'pagada').reduce((s, i) => s + i.total, 0)
  const totalMes        = monthInvoices.reduce((s, i) => s + i.total, 0)
  const countPendiente  = allInvoices.filter(i => i.status === 'enviada').length

  return { totalPendiente, totalPagado, totalMes, countPendiente }
}

/**
 * Crea una factura rectificativa (tipo R1) en estado borrador a partir de una factura emitida.
 * Los importes se copian en negativo para que el usuario los revise antes de emitir.
 * La factura original debe estar en estado inmutable (enviada, pagada, vencida, cancelada).
 */
export async function createRectificativeInvoice(
  workspaceId: string,
  originalInvoiceId: string,
  motivo: string,
): Promise<InvoiceData> {
  await assertInvoiceEdit(workspaceId) // Crear rectificativa requiere EDITOR+

  const original = await db.invoice.findFirst({
    where: { id: originalInvoiceId, workspaceId },
    include: includeClient,
  })
  if (!original) throw new Error('Factura original no encontrada')
  if (!IMMUTABLE_STATUSES.includes(original.status)) {
    throw new Error('Solo se pueden rectificar facturas ya emitidas')
  }

  // Número correlativo para la nueva factura
  const year = new Date().getFullYear()
  const count = await db.invoice.count({
    where: { workspaceId, number: { startsWith: `${year}-` } },
  })
  const seq = String(count + 1).padStart(3, '0')
  const newNumber = `${year}-${seq}`

  // Los items se copian con totales en negativo — el usuario revisará el borrador
  const originalItems = (original.items as unknown as InvoiceItem[]) ?? []
  const rectItems: InvoiceItem[] = originalItems.map(item => ({
    description: item.description,
    qty:         item.qty,
    unitPrice:   item.unitPrice,
    total:       -Math.abs(item.total),
  }))

  const rectSubtotal = -Math.abs(original.subtotal)
  const rectTax      = -Math.abs(original.tax)
  const rectTotal    = -Math.abs(original.total)

  const legalNote = [
    `Factura rectificativa de: ${original.number}`,
    `Motivo: ${motivo.trim()}`,
    original.legalNote ? `Nota original: ${original.legalNote}` : null,
  ].filter(Boolean).join('\n')

  const r = await db.invoice.create({
    data: {
      workspaceId,
      number:        newNumber,
      clientId:      original.clientId,
      date:          new Date(),
      status:        'borrador',
      tipoFactura:   'R1',
      serie:         original.serie,
      items:         rectItems as object[],
      subtotal:      rectSubtotal,
      taxRate:       original.taxRate,
      tax:           rectTax,
      total:         rectTotal,
      currency:      original.currency,
      notes:         original.notes,
      paymentMethod: original.paymentMethod,
      legalNote,
      rectificaId:   original.id,
    },
    include: includeClient,
  })

  revalidatePath(`/workspace/${workspaceId}/invoices`)
  return mapInvoice(r)
}

export async function syncInvoiceRepliesForWorkspace(workspaceId: string) {
  const user = await assertWorkspaceAccess(workspaceId)
  const profile = await db.companyProfile.findUnique({
    where: { workspaceId },
    select: {
      imapHost: true,
      imapPort: true,
      imapSecure: true,
      imapUser: true,
      imapPasswordEncrypted: true,
      smtpUser: true,
      smtpPasswordEncrypted: true,
    },
  })
  const imapPassword =
    decryptSafe(profile?.imapPasswordEncrypted) ??
    (profile?.imapUser && profile.smtpUser && profile.imapUser === profile.smtpUser
      ? decryptSafe(profile.smtpPasswordEncrypted)
      : null)
  const imapConfig = profile?.imapHost && profile.imapUser && imapPassword
    ? {
        host: profile.imapHost,
        port: profile.imapPort ?? 993,
        secure: profile.imapSecure,
        user: profile.imapUser,
        pass: imapPassword,
      }
    : null
  const result = await syncInboxForWorkspace(workspaceId, user.orgId, 50, imapConfig)
  revalidatePath(`/workspace/${workspaceId}/invoices`)
  return result
}
