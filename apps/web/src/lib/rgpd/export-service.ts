/**
 * RGPD Export Service — genera un ZIP con todos los datos de la org.
 *
 * El ZIP contiene ficheros JSON con datos estructurados (docs, tareas,
 * contratos, hojas, presentaciones, facturas, etc.).
 * No incluye binarios (archivos subidos): solo metadatos de FileRecord.
 *
 * Se llama fire-and-forget desde el webhook de Stripe al cancelar.
 * El resultado se almacena en DataExportRequest.zipData (Postgres Bytes).
 * El link de descarga expira en 30 días.
 */

import JSZip from 'jszip'
import { db } from '@/lib/db'
import { createHmac } from 'node:crypto'

const EXPORT_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 días

// ---------------------------------------------------------------
// Token de descarga (HMAC-SHA256, sin dependencias externas)
// ---------------------------------------------------------------

function getExportSecret(): string {
  const s = process.env.MITIKUS_LICENSE_SECRET
  if (!s || s.length < 16) throw new Error('MITIKUS_LICENSE_SECRET no configurada.')
  return s
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export function issueExportToken(orgId: string): string {
  const secret = getExportSecret()
  const now = Math.floor(Date.now() / 1000)
  const payload = b64url(Buffer.from(JSON.stringify({ orgId, iat: now, exp: now + EXPORT_TOKEN_TTL_SECONDS })))
  const sig = b64url(createHmac('sha256', secret).update(payload).digest())
  return `${payload}.${sig}`
}

export function verifyExportToken(token: string): { orgId: string } | null {
  try {
    const [payload, sig] = token.split('.')
    if (!payload || !sig) return null
    const secret = getExportSecret()
    const expected = b64url(createHmac('sha256', secret).update(payload).digest())
    if (sig !== expected) return null
    const data = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')) as { orgId: string; exp: number }
    if (data.exp < Math.floor(Date.now() / 1000)) return null
    return { orgId: data.orgId }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------
// Generación del ZIP
// ---------------------------------------------------------------

export async function generateOrgExportZip(orgId: string): Promise<Buffer> {
  const zip = new JSZip()

  // Org + workspaces
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, sector: true, createdAt: true },
  })
  zip.file('organization.json', JSON.stringify(org, null, 2))

  const workspaces = await db.workspace.findMany({
    where: { orgId },
    select: { id: true, name: true, slug: true, createdAt: true },
  })
  zip.file('workspaces.json', JSON.stringify(workspaces, null, 2))

  // Usuarios
  const users = await db.user.findMany({
    where: { orgId },
    select: { id: true, email: true, name: true, jobTitle: true, role: true, createdAt: true },
  })
  zip.file('users.json', JSON.stringify(users, null, 2))

  // Por workspace
  for (const ws of workspaces) {
    const wsFolder = zip.folder(ws.slug ?? ws.id)!

    // Documentos
    const docs = await db.document.findMany({
      where: { workspaceId: ws.id },
      select: { id: true, title: true, content: true, createdAt: true, updatedAt: true },
    })
    if (docs.length > 0) wsFolder.file('documents.json', JSON.stringify(docs, null, 2))

    // Hojas de cálculo
    const sheets = await db.spreadsheet.findMany({
      where: { workspaceId: ws.id },
      select: { id: true, title: true, category: true, createdAt: true, updatedAt: true },
    }).catch(() => [])
    if (sheets.length > 0) wsFolder.file('sheets.json', JSON.stringify(sheets, null, 2))

    // Tareas
    const tasks = await db.task.findMany({
      where: { workspaceId: ws.id },
      select: { id: true, title: true, description: true, status: true, priority: true, dueDate: true, createdAt: true },
    })
    if (tasks.length > 0) wsFolder.file('tasks.json', JSON.stringify(tasks, null, 2))

    // Contratos
    const contracts = await db.contract.findMany({
      where: { workspaceId: ws.id },
      select: { id: true, title: true, status: true, clientName: true, clientEmail: true, createdAt: true },
    }).catch(() => [])
    if (contracts.length > 0) wsFolder.file('contracts.json', JSON.stringify(contracts, null, 2))

    // Facturas
    const invoices = await db.invoice.findMany({
      where: { workspaceId: ws.id },
      select: { id: true, number: true, status: true, total: true, date: true, dueDate: true },
    }).catch(() => [])
    if (invoices.length > 0) wsFolder.file('invoices.json', JSON.stringify(invoices, null, 2))

    // Archivos (solo metadatos, sin binarios)
    const files = await db.workspaceFile.findMany({
      where: { workspaceId: ws.id },
      select: { id: true, name: true, mimeType: true, size: true, url: true, type: true },
    }).catch(() => [])
    if (files.length > 0) wsFolder.file('files_metadata.json', JSON.stringify(files, null, 2))
  }

  // Brain / memoria
  const memoryItems = await db.memoryItem.findMany({
    where: { orgId },
    select: { id: true, title: true, content: true, type: true, status: true, createdAt: true },
  }).catch(() => [])
  if (memoryItems.length > 0) zip.file('brain_memory.json', JSON.stringify(memoryItems, null, 2))

  zip.file('README.txt', [
    'Exportación de datos MITIKUS — RGPD Art. 20 (Portabilidad)',
    `Org: ${org?.name ?? orgId}`,
    `Fecha: ${new Date().toISOString()}`,
    '',
    'Contenido:',
    '  organization.json  — datos de la organización',
    '  workspaces.json    — workspaces',
    '  users.json         — miembros del equipo',
    '  <workspace>/       — carpeta por workspace con docs, tareas, contratos, etc.',
    '  brain_memory.json  — entradas de memoria del Brain (si las hay)',
    '',
    'Los archivos binarios subidos no se incluyen en este ZIP.',
    'Contacto: privacidad@mitikus.com',
  ].join('\n'))

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}

// ---------------------------------------------------------------
// Orquestación principal — llamada desde el webhook
// ---------------------------------------------------------------

export async function triggerOrgDataExport(orgId: string): Promise<void> {
  // Upsert en PENDING para evitar duplicados
  await db.dataExportRequest.upsert({
    where: { orgId },
    create: { orgId, status: 'PENDING' },
    update: { status: 'PENDING', error: null, zipData: null, expiresAt: null, updatedAt: new Date() },
  })

  // Llamada fire-and-forget al endpoint interno que procesa el ZIP
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mitikus.com'
  fetch(`${baseUrl}/api/billing/rgpd-export`, {
    method: 'POST',
    headers: { 'x-internal-secret': process.env.MITIKUS_LICENSE_SECRET ?? '' },
    body: JSON.stringify({ orgId }),
  }).catch(() => { /* fire-and-forget */ })
}
