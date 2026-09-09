import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashFormsWebhookToken, parseWorkspaceIntegrations } from '@/lib/integrations/calendar'

const MAX_BODY_BYTES = 100_000

function asText(value: unknown) {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return ''
}

function normalizeKey(key: string) {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

function flattenObject(input: unknown, prefix = ''): Array<{ key: string; value: string }> {
  if (!input || typeof input !== 'object') return []
  if (Array.isArray(input)) return input.flatMap((item, index) => flattenObject(item, prefix ? `${prefix}.${index}` : String(index)))

  return Object.entries(input as Record<string, unknown>).flatMap(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object') return flattenObject(value, nextKey)
    const text = asText(value)
    return text ? [{ key: nextKey, value: text }] : []
  })
}

function extractTypeformEntries(payload: Record<string, unknown>) {
  const formResponse = payload.form_response
  if (!formResponse || typeof formResponse !== 'object') return null

  const response = formResponse as Record<string, unknown>
  const definition = response.definition && typeof response.definition === 'object' ? response.definition as Record<string, unknown> : null
  const fields = Array.isArray(definition?.fields) ? definition.fields : []
  const labels = new Map<string, string>()

  for (const field of fields) {
    if (!field || typeof field !== 'object') continue
    const item = field as Record<string, unknown>
    const id = asText(item.id || item.ref)
    const title = asText(item.title)
    if (id && title) labels.set(id, title)
  }

  const answers = Array.isArray(response.answers) ? response.answers : []
  return answers.flatMap((answer) => {
    if (!answer || typeof answer !== 'object') return []
    const item = answer as Record<string, unknown>
    const field = item.field && typeof item.field === 'object' ? item.field as Record<string, unknown> : null
    const id = asText(field?.id || field?.ref)
    const key = labels.get(id) || asText(field?.title || field?.ref || id) || 'Answer'
    const value = asText(item.text ?? item.email ?? item.phone_number ?? item.number ?? item.boolean ?? item.date ?? item.url)
    return value ? [{ key, value }] : []
  })
}

function findValue(entries: Array<{ key: string; value: string }>, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeKey)
  return entries.find((entry) => normalizedAliases.some((alias) => normalizeKey(entry.key).includes(alias)))?.value ?? ''
}

function extractLeadData(payload: unknown) {
  const record = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload as Record<string, unknown> : {}
  const entries = extractTypeformEntries(record) ?? flattenObject(payload)

  const email = findValue(entries, ['email', 'correo', 'mail'])
  const name = findValue(entries, ['name', 'nombre', 'full name', 'contacto', 'contact']) || email.split('@')[0] || 'Lead externo'
  const company = findValue(entries, ['company', 'empresa', 'negocio', 'organization', 'organizacion']) || undefined
  const phone = findValue(entries, ['phone', 'telefono', 'tel', 'mobile', 'movil']) || undefined
  const message = findValue(entries, ['message', 'mensaje', 'comments', 'comentarios', 'description', 'descripcion'])

  const excludedAliases = ['name', 'nombre', 'email', 'correo', 'mail', 'company', 'empresa', 'phone', 'telefono', 'message', 'mensaje']
  const details = entries
    .filter((entry) => !excludedAliases.some((alias) => normalizeKey(entry.key).includes(normalizeKey(alias))))
    .slice(0, 30)
    .map((entry) => `${entry.key}: ${entry.value}`)
    .join('\n')

  return {
    name: name.slice(0, 100),
    email: email || 'sin-email@mitikus.local',
    company: company?.slice(0, 100),
    phone: phone?.slice(0, 30),
    message: [message, details].filter(Boolean).join('\n\n').slice(0, 1000) || undefined,
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const contentLength = Number(req.headers.get('content-length') ?? '0')
  if (contentLength > MAX_BODY_BYTES) return NextResponse.json({ error: 'Payload too large' }, { status: 413 })

  const { workspaceId } = await params
  const token = req.nextUrl.searchParams.get('token') || req.headers.get('x-mitikus-webhook-token')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, companyProfile: { select: { integrations: true } } },
  })
  if (!workspace) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const forms = parseWorkspaceIntegrations(workspace.companyProfile?.integrations).forms
  if (!forms || hashFormsWebhookToken(token) !== forms.webhookTokenHash) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await req.json().catch(() => null)
  if (!payload) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const leadData = extractLeadData(payload)
  const lead = await db.workspaceLead.create({ data: { workspaceId, ...leadData } })

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 })
}
