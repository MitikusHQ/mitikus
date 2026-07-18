import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
