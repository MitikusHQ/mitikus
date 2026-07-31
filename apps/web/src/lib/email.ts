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

export async function sendFiscalReminderEmail({
  to,
  workspaceName,
  modelo,
  titulo,
  periodo,
  deadline,
  daysLeft,
  url,
}: {
  to: string
  workspaceName: string
  modelo: string
  titulo: string
  periodo: string
  deadline: string
  daysLeft: number
  url: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  const urgency = daysLeft <= 3 ? '🔴' : '⚠️'
  await resend.emails.send({
    from: 'MITIKUS Fiscal <noreply@mitikus.com>',
    to,
    subject: `${urgency} ${titulo} vence en ${daysLeft} días — Modelo ${modelo}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <p style="font-size:13px;color:#888;margin:0 0 4px">${workspaceName}</p>
        <h2 style="font-size:18px;color:#111;margin:0 0 16px">Recordatorio fiscal ${urgency}</h2>
        <div style="padding:16px;background:#fef9ee;border:1px solid #f59e0b;border-radius:8px;margin-bottom:20px">
          <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:#111">Modelo ${modelo} — ${titulo}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#555">Período: ${periodo}</p>
          <p style="margin:0;font-size:13px;color:#555">Plazo: <strong>${deadline}</strong> (${daysLeft} días)</p>
        </div>
        <a href="${url}" style="display:inline-block;padding:10px 20px;background:#1d4ed8;color:#fff;border-radius:6px;text-decoration:none;font-size:14px">
          Abrir calculadora →
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

export async function sendContractReminderEmail({
  to,
  clientName,
  contractTitle,
  signUrl,
}: {
  to: string
  clientName: string | null
  contractTitle: string
  signUrl: string
}) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const greeting = clientName ? `Hola ${clientName},` : 'Hola,'
  await resend.emails.send({
    from: 'MITIKUS <notificaciones@mitikus.com>',
    to,
    subject: `Recordatorio: tienes un contrato pendiente de firma — ${contractTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <p style="color:#111;">${greeting}</p>
        <p style="color:#444;">Te recordamos que tienes pendiente de firmar el contrato <strong>${contractTitle}</strong>.</p>
        <p style="color:#444;">Puedes firmarlo en cualquier momento desde el siguiente enlace:</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${signUrl}"
             style="background:#111;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:600;">
            Firmar contrato
          </a>
        </div>
        <p style="color:#888;font-size:13px;">Si ya lo has firmado, ignora este mensaje.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#aaa;font-size:12px;">MITIKUS · Este es un mensaje automático.</p>
      </div>
    `,
  })
}

export async function sendMentionEmail({
  to,
  mentionedName,
  authorName,
  content,
  resourceUrl,
  resourceType,
}: {
  to:           string
  mentionedName: string
  authorName:   string
  content:      string
  resourceUrl:  string
  resourceType: string
}) {
  if (!process.env.RESEND_API_KEY) return
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const typeLabel: Record<string, string> = {
    document: 'documento', contract: 'contrato',
    notebook: 'notebook', presentation: 'presentación', pdf: 'PDF',
  }
  const label = typeLabel[resourceType] ?? 'recurso'
  await resend.emails.send({
    from: 'MITIKUS <notificaciones@mitikus.com>',
    to,
    subject: `${authorName} te ha mencionado en un ${label}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <p style="color:#111;">Hola ${mentionedName},</p>
        <p style="color:#444;"><strong>${authorName}</strong> te ha mencionado en un comentario:</p>
        <blockquote style="border-left:3px solid #6366f1;margin:16px 0;padding:8px 16px;color:#555;font-style:italic;">
          ${content}
        </blockquote>
        <div style="text-align:center;margin:32px 0;">
          <a href="${resourceUrl}"
             style="background:#111;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:600;">
            Ver ${label}
          </a>
        </div>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#aaa;font-size:12px;">MITIKUS · Este es un mensaje automático.</p>
      </div>
    `,
  })
}

export async function sendContractOtpEmail({
  to,
  code,
  expiresInMin,
}: {
  to:           string
  code:         string
  expiresInMin: number
}) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from:    'MITIKUS <noreply@mitikus.com>',
    to,
    subject: `Tu código de verificación: ${code}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <p style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Código de verificación</p>
        <p style="color: #666; margin-bottom: 24px;">
          Para acceder al contrato que te han enviado para firmar, introduce este código:
        </p>
        <div style="background: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: monospace;">${code}</span>
        </div>
        <p style="color: #999; font-size: 13px;">
          Este código caduca en ${expiresInMin} minutos. Si no solicitaste este código, ignora este email.
        </p>
      </div>
    `,
  })
}

export async function sendActivationReminderEmail({
  to,
  userName,
  workspaceUrl,
}: {
  to: string
  userName: string | null
  workspaceUrl: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  const name = userName ?? 'Hola'

  await resend.emails.send({
    from: 'MITIKUS <notificaciones@mitikus.com>',
    to,
    subject: '¿Tienes 8 minutos? Tu primera auditoría te está esperando.',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:0">
        <div style="background:#0f172a;padding:16px 24px;border-radius:8px 8px 0 0">
          <span style="color:#fff;font-size:14px;font-weight:700;letter-spacing:.08em">MITIKUS</span>
        </div>
        <div style="padding:32px 24px;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <p style="font-size:16px;color:#0f172a;margin:0 0 12px">Hola, ${name}.</p>
          <p style="font-size:15px;color:#334155;margin:0 0 20px;line-height:1.6">
            Llevas 3 días en MITIKUS y aún no has ejecutado tu primera auditoría.<br>
            En <strong>8 minutos</strong> tendrás un informe completo listo para entregar.
          </p>
          <a href="${workspaceUrl}" style="display:inline-block;padding:12px 24px;background:#1d4ed8;color:#fff;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">
            Ejecutar mi primera auditoría →
          </a>
          <p style="margin-top:28px;font-size:13px;color:#94a3b8;line-height:1.5">
            Solo te enviamos este email una vez. Si ya lo has probado, ignóralo.<br>
            MITIKUS · <a href="https://mitikus.com" style="color:#94a3b8">mitikus.com</a>
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendDocumentEmail({
  to,
  recipientName,
  senderName,
  workspaceName,
  docTitle,
  rawText,
  note,
  portalUrl,
}: {
  to:            string
  recipientName: string | null
  senderName:    string | null
  workspaceName: string
  docTitle:      string
  rawText:       string
  note:          string | null
  portalUrl:     string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const resend  = new Resend(process.env.RESEND_API_KEY)
  const saludo  = recipientName ? `Hola, ${recipientName.split(' ')[0]}.` : 'Hola.'
  const remite  = senderName ?? workspaceName
  // Primeros 4 párrafos como preview en el email
  const preview = rawText
    .split('\n')
    .filter((l) => l.trim())
    .slice(0, 4)
    .map((p) => `<p style="margin:0 0 10px;color:#334155;font-size:14px;line-height:1.6">${p}</p>`)
    .join('')

  await resend.emails.send({
    from:    `${workspaceName} via MITIKUS <notificaciones@mitikus.com>`,
    to,
    subject: `${docTitle} — enviado por ${remite}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:0">
        <div style="background:#0f172a;padding:14px 24px;border-radius:8px 8px 0 0">
          <span style="color:#fff;font-size:13px;font-weight:700;letter-spacing:.08em">${workspaceName.toUpperCase()}</span>
          <span style="color:#475569;font-size:11px;float:right">mitikus.com</span>
        </div>
        <div style="padding:28px 24px;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <p style="margin:0 0 6px;font-size:15px;color:#64748b">${saludo}</p>
          <p style="margin:0 0 20px;font-size:15px;color:#0f172a">
            Te comparto el informe <strong>${docTitle}</strong>.
          </p>
          ${note ? `<div style="margin:0 0 20px;padding:12px 16px;background:#f8fafc;border-left:3px solid #1d4ed8;border-radius:4px;font-size:14px;color:#334155">${note}</div>` : ''}
          <div style="margin:0 0 24px;padding:20px 24px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">
            <h2 style="margin:0 0 14px;font-size:15px;font-weight:600;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:10px">${docTitle}</h2>
            ${preview}
            <p style="margin:10px 0 0;font-size:13px;color:#94a3b8">— continúa en el portal del cliente →</p>
          </div>
          <div style="text-align:center;margin:24px 0">
            <a href="${portalUrl}"
               style="display:inline-block;padding:13px 28px;background:#0f172a;color:#fff;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
              Ver informe completo →
            </a>
          </div>
          <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;text-align:center">
            Enviado por ${remite} · <a href="https://mitikus.com" style="color:#94a3b8">mitikus.com</a>
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendWelcomeEmail({
  to,
  userName,
  appUrl,
}: {
  to: string
  userName: string | null
  appUrl: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  const name   = userName?.split(' ')[0] ?? 'Hola'

  await resend.emails.send({
    from: 'MITIKUS <notificaciones@mitikus.com>',
    to,
    subject: `Bienvenido a MITIKUS, ${name}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:0">
        <div style="background:#0f172a;padding:16px 24px;border-radius:8px 8px 0 0">
          <span style="color:#fff;font-size:14px;font-weight:700;letter-spacing:.08em">MITIKUS</span>
        </div>
        <div style="padding:32px 24px;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <p style="font-size:16px;color:#0f172a;margin:0 0 8px">Bienvenido, ${name}.</p>
          <p style="font-size:15px;color:#334155;margin:0 0 24px;line-height:1.6">
            Tu cuenta está lista. MITIKUS convierte auditorías manuales en procesos repetibles — para que entregues más en menos tiempo.
          </p>

          <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin-bottom:24px">
            <p style="font-size:13px;font-weight:600;color:#0f172a;margin:0 0 12px">Empieza con estos 3 pasos:</p>
            <div style="font-size:13px;color:#334155;line-height:1.8">
              <div>① Elige una <strong>auditoría</strong> del catálogo</div>
              <div>② Añade el nombre del <strong>cliente</strong></div>
              <div>③ Ejecuta — tendrás un borrador en <strong>8 minutos</strong></div>
            </div>
          </div>

          <a href="${appUrl}" style="display:inline-block;padding:12px 24px;background:#1d4ed8;color:#fff;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">
            Entrar a MITIKUS →
          </a>

          <p style="margin-top:28px;font-size:13px;color:#94a3b8;line-height:1.5">
            MITIKUS · <a href="https://mitikus.com" style="color:#94a3b8">mitikus.com</a>
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendDay7ReminderEmail({
  to,
  userName,
  workspaceUrl,
}: {
  to: string
  userName: string | null
  workspaceUrl: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  const name = userName?.split(' ')[0] ?? 'Hola'

  await resend.emails.send({
    from: 'MITIKUS <notificaciones@mitikus.com>',
    to,
    subject: `${name}, llevas 7 días sin usar tu primera auditoría`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:0">
        <div style="background:#0f172a;padding:16px 24px;border-radius:8px 8px 0 0">
          <span style="color:#fff;font-size:14px;font-weight:700;letter-spacing:.08em">MITIKUS</span>
        </div>
        <div style="padding:32px 24px;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <p style="font-size:16px;color:#0f172a;margin:0 0 12px">${name}, ¿sigues por aquí?</p>
          <p style="font-size:15px;color:#334155;margin:0 0 16px;line-height:1.6">
            Llevas 7 días con tu cuenta MITIKUS y aún no has ejecutado tu primera auditoría. Sin ella, no puedes ver el valor real de la plataforma.
          </p>
          <p style="font-size:15px;color:#334155;margin:0 0 24px;line-height:1.6">
            Una auditoría tarda <strong>8 minutos</strong> y te genera un informe listo para entregar. Sin plantillas, sin formateo.
          </p>
          <a href="${workspaceUrl}" style="display:inline-block;padding:12px 24px;background:#1d4ed8;color:#fff;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">
            Empezar ahora →
          </a>
          <p style="margin-top:28px;font-size:13px;color:#94a3b8;line-height:1.5">
            MITIKUS · <a href="https://mitikus.com" style="color:#94a3b8">mitikus.com</a>
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendTrialEndingEmail({
  to,
  userName,
  daysLeft,
  upgradeUrl,
}: {
  to: string
  userName: string | null
  daysLeft: number
  upgradeUrl: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  const name = userName?.split(' ')[0] ?? 'Hola'
  const days = daysLeft === 1 ? '1 día' : `${daysLeft} días`

  await resend.emails.send({
    from: 'MITIKUS <notificaciones@mitikus.com>',
    to,
    subject: `Tu periodo de prueba termina en ${days}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:0">
        <div style="background:#0f172a;padding:16px 24px;border-radius:8px 8px 0 0">
          <span style="color:#fff;font-size:14px;font-weight:700;letter-spacing:.08em">MITIKUS</span>
        </div>
        <div style="padding:32px 24px;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <p style="font-size:16px;color:#0f172a;margin:0 0 12px">${name}, quedan ${days}.</p>
          <p style="font-size:15px;color:#334155;margin:0 0 16px;line-height:1.6">
            Tu periodo de prueba de MITIKUS termina en ${days}. Activa tu plan ahora para no perder acceso a tus herramientas, clientes e informes.
          </p>
          <div style="background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:16px 20px;margin:0 0 24px">
            <p style="margin:0;font-size:14px;color:#713f12;line-height:1.6">
              <strong>Si no activas el plan:</strong> tu cuenta pasará a modo lectura. Podrás ver todo lo que creaste, pero no ejecutar nuevas auditorías.
            </p>
          </div>
          <a href="${upgradeUrl}" style="display:inline-block;padding:12px 24px;background:#1d4ed8;color:#fff;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">
            Activar mi plan →
          </a>
          <p style="margin-top:28px;font-size:13px;color:#94a3b8;line-height:1.5">
            MITIKUS · <a href="https://mitikus.com" style="color:#94a3b8">mitikus.com</a>
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendInvitationLinkEmail({
  to,
  orgName,
  inviteUrl,
  expiresAt,
}: {
  to: string
  orgName: string
  inviteUrl: string
  expiresAt: Date
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  const expiryStr = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(expiresAt)

  await resend.emails.send({
    from: 'MITIKUS <notificaciones@mitikus.com>',
    to,
    subject: `Te han invitado a ${orgName} en MITIKUS`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:0">
        <div style="background:#0f172a;padding:16px 24px;border-radius:8px 8px 0 0">
          <span style="color:#fff;font-size:14px;font-weight:700;letter-spacing:.08em">MITIKUS</span>
        </div>
        <div style="padding:32px 24px;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <p style="font-size:16px;color:#0f172a;margin:0 0 8px">Te han invitado a unirte al equipo.</p>
          <p style="font-size:15px;color:#334155;margin:0 0 24px;line-height:1.6">
            <strong>${orgName}</strong> te ha invitado a colaborar en MITIKUS.
            El link de acceso es válido hasta el ${expiryStr}.
          </p>
          <a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#1d4ed8;color:#fff;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">
            Aceptar invitación →
          </a>
          <p style="margin-top:28px;font-size:13px;color:#94a3b8;line-height:1.5">
            Si no esperabas este email, ignóralo. El link expirará automáticamente.<br/>
            MITIKUS · <a href="https://mitikus.com" style="color:#94a3b8">mitikus.com</a>
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendInviteWelcomeEmail({
  to,
  userName,
  orgName,
  workspaceUrl,
}: {
  to: string
  userName: string | null
  orgName: string
  workspaceUrl: string
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  const name = userName?.split(' ')[0] ?? 'Hola'

  await resend.emails.send({
    from: 'MITIKUS <notificaciones@mitikus.com>',
    to,
    subject: `Ya tienes acceso al workspace de ${orgName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:0">
        <div style="background:#0f172a;padding:16px 24px;border-radius:8px 8px 0 0">
          <span style="color:#fff;font-size:14px;font-weight:700;letter-spacing:.08em">MITIKUS</span>
        </div>
        <div style="padding:32px 24px;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <p style="font-size:16px;color:#0f172a;margin:0 0 8px">Bienvenido al equipo, ${name}.</p>
          <p style="font-size:15px;color:#334155;margin:0 0 24px;line-height:1.6">
            Ya tienes acceso al workspace de <strong>${orgName}</strong> en MITIKUS. Encontrarás las herramientas, clientes e informes del equipo listos para usar.
          </p>
          <a href="${workspaceUrl}" style="display:inline-block;padding:12px 24px;background:#1d4ed8;color:#fff;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">
            Abrir mi workspace →
          </a>
          <p style="margin-top:28px;font-size:13px;color:#94a3b8;line-height:1.5">
            MITIKUS · <a href="https://mitikus.com" style="color:#94a3b8">mitikus.com</a>
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendPostActivationEmail({
  to,
  userName,
  workspaceUrl,
  executionCount,
}: {
  to: string
  userName: string | null
  workspaceUrl: string
  executionCount: number
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  const name = userName?.split(' ')[0] ?? 'Hola'
  const plural = executionCount === 1 ? 'auditoría' : 'auditorías'

  await resend.emails.send({
    from: 'MITIKUS <notificaciones@mitikus.com>',
    to,
    subject: `${name}, llevas una semana generando informes`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:0">
        <div style="background:#0f172a;padding:16px 24px;border-radius:8px 8px 0 0">
          <span style="color:#fff;font-size:14px;font-weight:700;letter-spacing:.08em">MITIKUS</span>
        </div>
        <div style="padding:32px 24px;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <p style="font-size:16px;color:#0f172a;margin:0 0 12px">${name}, llevas una semana en MITIKUS.</p>
          <p style="font-size:15px;color:#334155;margin:0 0 16px;line-height:1.6">
            Has ejecutado <strong>${executionCount} ${plural}</strong>. El siguiente paso es sacarle más partido: añade más clientes, crea auditorías personalizadas para tu sector o invita a tu equipo para colaborar en tiempo real.
          </p>
          <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin:0 0 24px">
            <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#0f172a">Próximos pasos recomendados:</p>
            <div style="font-size:13px;color:#334155;line-height:1.8">
              <div>→ Crea una herramienta adaptada a tu cliente más habitual</div>
              <div>→ Añade tus clientes para tener el historial de informes</div>
              <div>→ Invita a un compañero y trabajad juntos</div>
            </div>
          </div>
          <a href="${workspaceUrl}" style="display:inline-block;padding:12px 24px;background:#1d4ed8;color:#fff;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">
            Abrir mi workspace →
          </a>
          <p style="margin-top:28px;font-size:13px;color:#94a3b8;line-height:1.5">
            MITIKUS · <a href="https://mitikus.com" style="color:#94a3b8">mitikus.com</a>
          </p>
        </div>
      </div>
    `,
  })
}
