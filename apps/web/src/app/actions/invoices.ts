'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import {
  calcularHuella,
  generarURLVerificacion,
  formatFechaAEAT,
  formatTimestampAEAT,
} from '@/lib/verifactu'

export interface InvoiceItem {
  description: string
  qty:         number
  unitPrice:   number
  total:       number
}

export interface InvoiceData {
  id:          string
  number:      string
  clientId:    string | null
  clientName:  string | null
  date:        string
  dueDate:     string | null
  status:      string
  items:       InvoiceItem[]
  subtotal:    number
  taxRate:     number
  tax:         number
  total:       number
  currency:    string
  notes:       string | null
  createdAt:   string
  // Verifactu
  serie:          string
  tipoFactura:    string
  huella:         string | null
  huellaAnterior: string | null
  fechaGeneracion: string | null
  enviadaAEAT:    boolean
  qrUrl:          string | null
}

export interface InvoiceInput {
  number:      string
  clientId?:   string | null
  date:        string
  dueDate?:    string | null
  status?:     string
  items:       InvoiceItem[]
  subtotal:    number
  taxRate:     number
  tax:         number
  total:       number
  currency?:   string
  notes?:      string | null
}

async function requireAuth() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('User not found')
  return user
}

function mapInvoice(r: {
  id: string; number: string; clientId: string | null; client: { name: string } | null;
  date: Date; dueDate: Date | null; status: string; items: unknown; subtotal: number;
  taxRate: number; tax: number; total: number; currency: string; notes: string | null; createdAt: Date;
  serie: string; tipoFactura: string; huella: string | null; huellaAnterior: string | null;
  fechaGeneracion: Date | null; enviadaAEAT: boolean; qrUrl: string | null;
}): InvoiceData {
  return {
    id:         r.id,
    number:     r.number,
    clientId:   r.clientId,
    clientName: r.client?.name ?? null,
    date:       r.date.toISOString(),
    dueDate:    r.dueDate?.toISOString() ?? null,
    status:     r.status,
    items:      (r.items as unknown as InvoiceItem[]) ?? [],
    subtotal:   r.subtotal,
    taxRate:    r.taxRate,
    tax:        r.tax,
    total:      r.total,
    currency:   r.currency,
    notes:      r.notes,
    createdAt:  r.createdAt.toISOString(),
    serie:           r.serie,
    tipoFactura:     r.tipoFactura,
    huella:          r.huella,
    huellaAnterior:  r.huellaAnterior,
    fechaGeneracion: r.fechaGeneracion?.toISOString() ?? null,
    enviadaAEAT:     r.enviadaAEAT,
    qrUrl:           r.qrUrl,
  }
}

const includeClient = { client: { select: { name: true } } }

export async function getInvoices(workspaceId: string): Promise<InvoiceData[]> {
  await requireAuth()
  const rows = await db.invoice.findMany({
    where:   { workspaceId },
    include: includeClient,
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(mapInvoice)
}

export async function getInvoice(workspaceId: string, invoiceId: string): Promise<InvoiceData | null> {
  await requireAuth()
  const r = await db.invoice.findFirst({
    where:   { id: invoiceId, workspaceId },
    include: includeClient,
  })
  return r ? mapInvoice(r) : null
}

export async function getNextInvoiceNumber(workspaceId: string): Promise<string> {
  await requireAuth()
  const year = new Date().getFullYear()
  const count = await db.invoice.count({
    where: {
      workspaceId,
      number: { startsWith: `${year}-` },
    },
  })
  const seq = String(count + 1).padStart(3, '0')
  return `${year}-${seq}`
}

export async function createInvoice(workspaceId: string, data: InvoiceInput): Promise<InvoiceData> {
  await requireAuth()
  const r = await db.invoice.create({
    data: {
      workspaceId,
      number:   data.number,
      clientId: data.clientId ?? null,
      date:     new Date(data.date),
      dueDate:  data.dueDate ? new Date(data.dueDate) : null,
      status:   data.status ?? 'borrador',
      items:    (data.items ?? []) as object[],
      subtotal: data.subtotal,
      taxRate:  data.taxRate,
      tax:      data.tax,
      total:    data.total,
      currency: data.currency ?? 'EUR',
      notes:    data.notes ?? null,
    },
    include: includeClient,
  })
  revalidatePath(`/workspace/${workspaceId}/invoices`)
  return mapInvoice(r)
}

export async function updateInvoice(
  workspaceId: string,
  invoiceId: string,
  data: Partial<InvoiceInput>,
): Promise<InvoiceData> {
  await requireAuth()
  const r = await db.invoice.update({
    where:   { id: invoiceId },
    data: {
      ...(data.number   !== undefined && { number:   data.number }),
      ...(data.clientId !== undefined && { clientId: data.clientId }),
      ...(data.date     !== undefined && { date:     new Date(data.date) }),
      ...(data.dueDate  !== undefined && { dueDate:  data.dueDate ? new Date(data.dueDate) : null }),
      ...(data.status   !== undefined && { status:   data.status }),
      ...(data.items    !== undefined && { items:    (data.items ?? []) as object[] }),
      ...(data.subtotal !== undefined && { subtotal: data.subtotal }),
      ...(data.taxRate  !== undefined && { taxRate:  data.taxRate }),
      ...(data.tax      !== undefined && { tax:      data.tax }),
      ...(data.total    !== undefined && { total:    data.total }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.notes    !== undefined && { notes:    data.notes }),
    },
    include: includeClient,
  })
  revalidatePath(`/workspace/${workspaceId}/invoices`)
  return mapInvoice(r)
}

export async function deleteInvoice(workspaceId: string, invoiceId: string): Promise<void> {
  await requireAuth()
  await db.invoice.deleteMany({ where: { id: invoiceId, workspaceId } })
  revalidatePath(`/workspace/${workspaceId}/invoices`)
}

/**
 * Emite una factura: calcula la huella Verifactu, genera el QR y actualiza el estado a "enviada".
 * Debe llamarse ANTES de generar el PDF — el PDF sin huella no es legalmente válido.
 *
 * @param emisorNif - NIF del emisor (autónomo/empresa). Obtener de CompanyProfile cuando esté disponible.
 */
export async function emitirFactura(
  workspaceId: string,
  invoiceId: string,
  emisorNif: string,
): Promise<InvoiceData> {
  await requireAuth()

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

  revalidatePath(`/workspace/${workspaceId}/invoices`)
  return mapInvoice(updated)
}

export async function getInvoiceStats(workspaceId: string) {
  await requireAuth()
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
