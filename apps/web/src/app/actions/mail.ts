'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { deliverMailMessage } from '@/lib/mail/delivery'
import { syncInboxForWorkspace } from '@/lib/mail/inbox-sync'

export type MailFolder = 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash'

export interface WorkspaceMailMessage {
  id: string
  direction: string
  toEmail: string
  ccEmail: string | null
  bccEmail: string | null
  fromEmail: string | null
  fromName: string
  replyTo: string | null
  subject: string
  body: string
  status: string
  provider: string
  invoiceId: string | null
  invoiceNumber: string | null
  clientId: string | null
  clientName: string | null
  clientContactName: string | null
  clientSector: string | null
  clientType: string | null
  lastError: string | null
  sentAt: string | null
  createdAt: string
}

export interface ComposeMailInput {
  toEmail: string
  ccEmail?: string
  bccEmail?: string
  subject: string
  body: string
}

const FOLDER_LABELS: Record<MailFolder, string> = {
  inbox: 'Recibidos',
  sent: 'Enviados',
  drafts: 'Borradores',
  spam: 'Spam',
  trash: 'Papelera',
}

interface ClientMailContext {
  id: string
  name: string
  contactName: string | null
  email: string | null
  sector: string | null
  clientType: string
}

function clean(value: string | null | undefined) {
  return value?.trim() ?? ''
}

function normalizeEmail(value: string | null | undefined) {
  return clean(value).toLowerCase()
}

function repairStoredText(value: string | null) {
  if (!value || !/[ÃÂ]/.test(value)) return value
  try {
    const repaired = Buffer.from(value, 'latin1').toString('utf8')
    return repaired.includes('�') ? value : repaired
  } catch {
    return value
  }
}

function mapMessage(message: {
  id: string
  direction: string
  toEmail: string
  ccEmail: string | null
  bccEmail: string | null
  fromEmail: string | null
  fromName: string
  replyTo: string | null
  subject: string
  body: string
  status: string
  provider: string
  invoiceId: string | null
  lastError: string | null
  sentAt: Date | null
  createdAt: Date
  invoice: { number: string } | null
}, client: ClientMailContext | null = null): WorkspaceMailMessage {
  return {
    id: message.id,
    direction: message.direction,
    toEmail: message.toEmail,
    ccEmail: message.ccEmail,
    bccEmail: message.bccEmail,
    fromEmail: message.fromEmail,
    fromName: repairStoredText(message.fromName) ?? message.fromName,
    replyTo: message.replyTo,
    subject: repairStoredText(message.subject) ?? message.subject,
    body: repairStoredText(message.body) ?? message.body,
    status: message.status,
    provider: message.provider,
    invoiceId: message.invoiceId,
    invoiceNumber: message.invoice?.number ?? null,
    clientId: client?.id ?? null,
    clientName: client?.name ?? null,
    clientContactName: client?.contactName ?? null,
    clientSector: client?.sector ?? null,
    clientType: client?.clientType ?? null,
    lastError: message.lastError,
    sentAt: message.sentAt?.toISOString() ?? null,
    createdAt: message.createdAt.toISOString(),
  }
}

async function getWorkspaceContext(workspaceId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('User not found')

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: {
      id: true,
      name: true,
      orgId: true,
      companyProfile: {
        select: {
          fiscalName: true,
          emailSenderName: true,
          emailReplyTo: true,
          fiscalEmail: true,
          emailSignature: true,
        },
      },
    },
  })
  if (!workspace) throw new Error('Workspace not found')
  return { user, workspace }
}

function folderWhere(workspaceId: string, folder: MailFolder) {
  if (folder === 'inbox') return { workspaceId, direction: 'inbound', status: 'received' }
  if (folder === 'sent') return { workspaceId, direction: 'outbound', status: 'sent' }
  if (folder === 'drafts') return { workspaceId, direction: 'outbound', status: 'draft' }
  if (folder === 'spam') return { workspaceId, status: 'spam' }
  return { workspaceId, status: 'trash' }
}

function messageContactEmail(message: { direction: string; fromEmail: string | null; toEmail: string }) {
  return normalizeEmail(message.direction === 'inbound' ? message.fromEmail : message.toEmail)
}

async function getClientContextMap(workspaceId: string, emails: string[]) {
  const wanted = Array.from(new Set(emails.map(normalizeEmail).filter(Boolean)))
  if (wanted.length === 0) return new Map<string, ClientMailContext>()

  const clients = await db.client.findMany({
    where: { workspaceId, isArchived: false, email: { not: null } },
    select: { id: true, name: true, contactName: true, email: true, sector: true, clientType: true },
  })

  const map = new Map<string, ClientMailContext>()
  for (const client of clients) {
    const email = normalizeEmail(client.email)
    if (email && wanted.includes(email) && !map.has(email)) map.set(email, client)
  }
  return map
}

export async function getMailboxMessages(workspaceId: string, folder: MailFolder = 'inbox') {
  await getWorkspaceContext(workspaceId)
  const messages = await db.mailMessage.findMany({
    where: folderWhere(workspaceId, folder),
    include: { invoice: { select: { number: true } } },
    orderBy: [{ sentAt: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  })
  const clientMap = await getClientContextMap(workspaceId, messages.map(messageContactEmail))
  return {
    folder,
    label: FOLDER_LABELS[folder],
    messages: messages.map((message) => mapMessage(message, clientMap.get(messageContactEmail(message)) ?? null)),
  }
}

function buildSender(workspace: Awaited<ReturnType<typeof getWorkspaceContext>>['workspace']) {
  const profile = workspace.companyProfile
  const fromName = clean(profile?.emailSenderName) || clean(profile?.fiscalName) || workspace.name
  const replyTo = clean(profile?.emailReplyTo) || clean(profile?.fiscalEmail) || null
  const signature = clean(profile?.emailSignature)
  return { fromName, replyTo, signature }
}

function normalizeComposeInput(input: ComposeMailInput) {
  const toEmail = clean(input.toEmail)
  const ccEmail = clean(input.ccEmail) || null
  const bccEmail = clean(input.bccEmail) || null
  const subject = clean(input.subject)
  const body = clean(input.body)

  if (!toEmail) throw new Error('Indica al menos un destinatario.')
  if (!subject) throw new Error('Indica un asunto.')
  if (!body) throw new Error('Escribe el mensaje antes de enviarlo.')

  return { toEmail, ccEmail, bccEmail, subject, body }
}

export async function sendWorkspaceMail(workspaceId: string, input: ComposeMailInput) {
  const { user, workspace } = await getWorkspaceContext(workspaceId)
  const data = normalizeComposeInput(input)
  const sender = buildSender(workspace)
  const body = sender.signature && !data.body.includes(sender.signature)
    ? `${data.body}\n\n${sender.signature}`
    : data.body

  const message = await db.mailMessage.create({
    data: {
      workspaceId,
      orgId: user.orgId,
      userId: user.id,
      direction: 'outbound',
      toEmail: data.toEmail,
      ccEmail: data.ccEmail,
      bccEmail: data.bccEmail,
      fromEmail: null,
      fromName: sender.fromName,
      replyTo: sender.replyTo,
      subject: data.subject,
      body,
      status: 'queued',
      provider: 'mitikus-smtp',
    },
  })

  const result = await deliverMailMessage(message.id)
  revalidatePath(`/workspace/${workspaceId}/mail`)
  if (!result.ok) return { ok: false as const, error: result.error }
  return { ok: true as const }
}

export async function saveWorkspaceMailDraft(workspaceId: string, input: ComposeMailInput) {
  const { user, workspace } = await getWorkspaceContext(workspaceId)
  const toEmail = clean(input.toEmail)
  const ccEmail = clean(input.ccEmail) || null
  const bccEmail = clean(input.bccEmail) || null
  const subject = clean(input.subject) || 'Sin asunto'
  const body = clean(input.body)
  const sender = buildSender(workspace)

  const message = await db.mailMessage.create({
    data: {
      workspaceId,
      orgId: user.orgId,
      userId: user.id,
      direction: 'outbound',
      toEmail,
      ccEmail,
      bccEmail,
      fromEmail: null,
      fromName: sender.fromName,
      replyTo: sender.replyTo,
      subject,
      body,
      status: 'draft',
      provider: 'mitikus-smtp',
    },
    include: { invoice: { select: { number: true } } },
  })

  revalidatePath(`/workspace/${workspaceId}/mail`)
  return mapMessage(message)
}

export async function moveMailMessageToTrash(workspaceId: string, messageId: string) {
  await getWorkspaceContext(workspaceId)
  await db.mailMessage.updateMany({
    where: { id: messageId, workspaceId },
    data: { status: 'trash' },
  })
  revalidatePath(`/workspace/${workspaceId}/mail`)
  return { ok: true as const }
}

export async function deleteMailMessagePermanently(workspaceId: string, messageId: string) {
  await getWorkspaceContext(workspaceId)
  await db.mailMessage.deleteMany({
    where: { id: messageId, workspaceId, status: 'trash' },
  })
  revalidatePath(`/workspace/${workspaceId}/mail`)
  return { ok: true as const }
}

export async function syncMailboxForWorkspace(workspaceId: string) {
  const { user } = await getWorkspaceContext(workspaceId)
  const result = await syncInboxForWorkspace(workspaceId, user.orgId, 50)
  revalidatePath(`/workspace/${workspaceId}/mail`)
  return result
}

