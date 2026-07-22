import { Resend } from 'resend'

export async function sendTagNotificationEmail({
  to,
  taggerName,
  taskTitle,
  taskUrl,
}: {
  to: string
  taggerName: string
  taskTitle: string
  taskUrl: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'MITIKUS <noreply@mitikus.com>',
    to,
    subject: `${taggerName} te ha etiquetado en una tarea`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <p style="font-size:15px;color:#111"><strong>${taggerName}</strong> te ha etiquetado en una tarea:</p>
        <div style="margin:16px 0;padding:12px 16px;background:#f5f5f5;border-radius:8px;font-size:15px;color:#111">
          ${taskTitle}
        </div>
        <a href="${taskUrl}" style="display:inline-block;padding:10px 20px;background:#1d4ed8;color:#fff;border-radius:6px;text-decoration:none;font-size:14px">
          Ver tarea
        </a>
        <p style="margin-top:24px;font-size:12px;color:#888">MITIKUS · <a href="https://mitikus.com" style="color:#888">mitikus.com</a></p>
      </div>
    `,
  })
}

export async function sendContractInviteEmail({
  to,
  clientName,
  workspaceName,
  contractTitle,
  signUrl,
}: {
  to:            string
  clientName:    string
  workspaceName: string
  contractTitle: string
  signUrl:       string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from:    'MITIKUS <noreply@mitikus.com>',
    to,
    subject: `${workspaceName} te envía un contrato para firmar`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <p style="font-size:15px;color:#111">Hola <strong>${clientName}</strong>,</p>
        <p style="font-size:15px;color:#111"><strong>${workspaceName}</strong> te ha enviado el siguiente contrato para que lo revises y firmes:</p>
        <div style="margin:16px 0;padding:12px 16px;background:#f5f5f5;border-radius:8px;font-size:15px;color:#111">
          ${contractTitle}
        </div>
        <a href="${signUrl}" style="display:inline-block;padding:10px 20px;background:#1d4ed8;color:#fff;border-radius:6px;text-decoration:none;font-size:14px">
          Ver y firmar contrato
        </a>
        <p style="margin-top:24px;font-size:12px;color:#888">MITIKUS · <a href="https://mitikus.com" style="color:#888">mitikus.com</a></p>
      </div>
    `,
  })
}

export async function sendContractSignedEmail({
  to,
  contractTitle,
  pdfBase64,
}: {
  to:            string
  contractTitle: string
  pdfBase64:     string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from:    'MITIKUS <noreply@mitikus.com>',
    to,
    subject: `Contrato firmado — ${contractTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <p style="font-size:15px;color:#111">El contrato <strong>${contractTitle}</strong> ha sido firmado por ambas partes.</p>
        <p style="font-size:14px;color:#555">Encontrarás el PDF firmado adjunto a este email.</p>
        <p style="margin-top:24px;font-size:12px;color:#888">MITIKUS · <a href="https://mitikus.com" style="color:#888">mitikus.com</a></p>
      </div>
    `,
    attachments: [
      {
        filename:    `${contractTitle}.pdf`,
        content:     pdfBase64,
        contentType: 'application/pdf',
      },
    ],
  })
}
