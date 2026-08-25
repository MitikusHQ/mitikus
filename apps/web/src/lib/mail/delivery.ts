import { db } from '@/lib/db'
import { buildInvoicePdfAttachment } from '@/lib/invoices/invoice-pdf'
import { decryptSafe } from '@/lib/crypto'
import { appendMailToSent } from './imap-client'
import { sendSmtpMail, sendSmtpMailWithConfig } from './smtp-client'

type DeliveryResult =
  | { ok: true }
  | { ok: false; error: string }

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Error desconocido al enviar el correo.'
}

export async function deliverMailMessage(messageId: string): Promise<DeliveryResult> {
  const claimed = await db.mailMessage.updateMany({
    where: { id: messageId, status: { in: ['queued', 'failed'] } },
    data: { status: 'sending', lastError: null },
  })

  if (claimed.count === 0) {
    return { ok: false, error: 'El mensaje ya no está pendiente de envío.' }
  }

  const message = await db.mailMessage.findUnique({
    where: { id: messageId },
    include: { invoice: { select: { id: true, status: true } } },
  })

  if (!message) {
    return { ok: false, error: 'Mensaje no encontrado.' }
  }

  try {
    const attachments = message.invoiceId
      ? [await buildInvoicePdfAttachment(message.workspaceId, message.invoiceId)]
      : []

    // Resolve per-workspace SMTP if configured, otherwise fall through to global env
    const profile = await db.companyProfile.findUnique({
      where: { workspaceId: message.workspaceId },
      select: { emailSendMode: true, smtpHost: true, smtpPort: true, smtpSecure: true, smtpUser: true, smtpPasswordEncrypted: true },
    })

    const useWorkspaceSmtp =
      profile?.emailSendMode === 'custom_smtp' &&
      profile.smtpHost &&
      profile.smtpUser &&
      profile.smtpPasswordEncrypted

    const mailPayload = {
      to: message.toEmail,
      cc: message.ccEmail,
      bcc: message.bccEmail,
      fromName: message.fromName,
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.body,
      attachments,
    }

    const sent = useWorkspaceSmtp
      ? await sendSmtpMailWithConfig(
          {
            host: profile!.smtpHost!,
            port: profile!.smtpPort ?? 587,
            secure: profile!.smtpSecure,
            user: profile!.smtpUser ?? undefined,
            pass: decryptSafe(profile!.smtpPasswordEncrypted) ?? undefined,
            fromEmail: profile!.smtpUser!,
          },
          mailPayload,
        )
      : await sendSmtpMail(mailPayload)

    const sentCopy = await appendMailToSent(sent.rawMessage).catch((error) => ({
      ok: false as const,
      error: getErrorMessage(error),
    }))
    if (!sentCopy.ok) {
      console.error('[MAIL2] Sent-copy append failed', sentCopy.error)
    }

    await db.$transaction([
      db.mailMessage.update({
        where: { id: message.id },
        data: { status: 'sent', sentAt: new Date(), lastError: null },
      }),
      ...(message.invoiceId && message.invoice?.status !== 'pagada' && message.invoice?.status !== 'cancelada'
        ? [
            db.invoice.update({
              where: { id: message.invoiceId },
              data: { status: 'enviada' },
            }),
          ]
        : []),
    ])
    return { ok: true }
  } catch (error) {
    const messageText = getErrorMessage(error)
    await db.mailMessage.update({
      where: { id: message.id },
      data: { status: 'failed', lastError: messageText },
    })
    return { ok: false, error: messageText }
  }
}

export async function processQueuedMail(limit = 10) {
  const messages = await db.mailMessage.findMany({
    where: { status: 'queued' },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: { id: true },
  })

  let sent = 0
  let failed = 0
  const errors: Array<{ id: string; error: string }> = []

  for (const message of messages) {
    const result = await deliverMailMessage(message.id)
    if (result.ok) {
      sent += 1
    } else {
      failed += 1
      errors.push({ id: message.id, error: result.error })
    }
  }

  return { processed: messages.length, sent, failed, errors }
}

