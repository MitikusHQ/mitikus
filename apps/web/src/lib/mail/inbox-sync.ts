import { db } from '@/lib/db'
import { fetchInboxMessages } from './imap-client'

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? null
}

function invoiceNumbersFromText(value: string) {
  return Array.from(new Set(value.match(/\b20\d{2}-\d{3,}\b/g) ?? []))
}

function trimBody(value: string) {
  const withoutQuoted = value.split(/\nOn .+wrote:|\nEl .+escribió:|\nDe:\s|\nFrom:\s/i)[0] ?? value
  return withoutQuoted.trim().slice(0, 12000)
}

export async function syncInboxReplies(limit = 25) {
  const messages = await fetchInboxMessages(limit)
  let imported = 0
  let skipped = 0
  const errors: Array<{ uid: number; error: string }> = []

  for (const message of messages) {
    try {
      const existing = await db.mailMessage.findFirst({
        where: {
          provider: 'mitikus-imap',
          imapMailbox: message.mailbox,
          imapUid: message.uid,
        },
        select: { id: true },
      })
      if (existing) {
        skipped += 1
        continue
      }

      const haystack = `${message.subject}\n${message.body}`
      const numbers = invoiceNumbersFromText(haystack)
      if (numbers.length === 0) {
        skipped += 1
        continue
      }

      const invoice = await db.invoice.findFirst({
        where: { number: { in: numbers } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          number: true,
          workspaceId: true,
          workspace: { select: { orgId: true } },
        },
      })
      if (!invoice) {
        skipped += 1
        continue
      }

      await db.mailMessage.create({
        data: {
          workspaceId: invoice.workspaceId,
          orgId: invoice.workspace.orgId,
          userId: null,
          invoiceId: invoice.id,
          direction: 'inbound',
          toEmail: normalizeEmail(message.toEmail) ?? '',
          fromEmail: normalizeEmail(message.fromEmail),
          fromName: message.fromName || message.fromEmail || 'Cliente',
          replyTo: null,
          subject: message.subject,
          body: trimBody(message.body),
          status: 'received',
          provider: 'mitikus-imap',
          externalMessageId: message.messageId,
          imapMailbox: message.mailbox,
          imapUid: message.uid,
          rawHeaders: message.headers,
          sentAt: message.date,
        },
      })
      imported += 1
    } catch (error) {
      errors.push({ uid: message.uid, error: error instanceof Error ? error.message : 'Error desconocido' })
    }
  }

  return { scanned: messages.length, imported, skipped, errors }
}
export async function syncInboxForWorkspace(workspaceId: string, orgId: string, limit = 25) {
  const messages = await fetchInboxMessages(limit)
  let imported = 0
  let skipped = 0
  const errors: Array<{ uid: number; error: string }> = []

  for (const message of messages) {
    try {
      const existing = await db.mailMessage.findFirst({
        where: {
          provider: 'mitikus-imap',
          imapMailbox: message.mailbox,
          imapUid: message.uid,
        },
        select: { id: true },
      })
      if (existing) {
        skipped += 1
        continue
      }

      const haystack = `${message.subject}\n${message.body}`
      const numbers = invoiceNumbersFromText(haystack)
      const invoice = numbers.length > 0
        ? await db.invoice.findFirst({
            where: { workspaceId, number: { in: numbers } },
            orderBy: { createdAt: 'desc' },
            select: { id: true },
          })
        : null

      await db.mailMessage.create({
        data: {
          workspaceId,
          orgId,
          userId: null,
          invoiceId: invoice?.id ?? null,
          direction: 'inbound',
          toEmail: normalizeEmail(message.toEmail) ?? '',
          fromEmail: normalizeEmail(message.fromEmail),
          fromName: message.fromName || message.fromEmail || 'Remitente',
          replyTo: null,
          subject: message.subject,
          body: trimBody(message.body),
          status: 'received',
          provider: 'mitikus-imap',
          externalMessageId: message.messageId,
          imapMailbox: message.mailbox,
          imapUid: message.uid,
          rawHeaders: message.headers,
          sentAt: message.date,
        },
      })
      imported += 1
    } catch (error) {
      errors.push({ uid: message.uid, error: error instanceof Error ? error.message : 'Error desconocido' })
    }
  }

  return { scanned: messages.length, imported, skipped, errors }
}
