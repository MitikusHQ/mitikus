import net from 'node:net'
import tls from 'node:tls'

interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user?: string
  pass?: string
  fromEmail: string
}

export interface MailAttachment {
  filename: string
  contentType: string
  content: Buffer
}

export interface SmtpMail {
  to: string
  cc?: string | null
  bcc?: string | null
  fromName: string
  replyTo?: string | null
  subject: string
  text: string
  attachments?: MailAttachment[]
}

function getSmtpConfig(): SmtpConfig {
  const host = process.env.MITIKUS_SMTP_HOST
  const fromEmail = process.env.MITIKUS_SMTP_FROM_EMAIL ?? process.env.MITIKUS_SMTP_USER
  if (!host || !fromEmail) {
    throw new Error('Configura MITIKUS_SMTP_HOST y MITIKUS_SMTP_FROM_EMAIL para activar el envío real.')
  }

  return {
    host,
    port: Number(process.env.MITIKUS_SMTP_PORT ?? 587),
    secure: process.env.MITIKUS_SMTP_SECURE === 'true',
    user: process.env.MITIKUS_SMTP_USER,
    pass: process.env.MITIKUS_SMTP_PASS,
    fromEmail,
  }
}

function encodeHeader(value: string) {
  if (/^[\x20-\x7E]*$/.test(value)) return value
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`
}

function normalizeEmail(value: string) {
  return value.trim().replace(/[<>]/g, '')
}

function splitEmails(value: string | null | undefined) {
  return (value ?? '')
    .split(/[;,]/)
    .map((item) => normalizeEmail(item))
    .filter(Boolean)
}

function dotStuff(value: string) {
  return value.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..')
}

function foldBase64(value: Buffer | string) {
  const raw = Buffer.isBuffer(value) ? value.toString('base64') : Buffer.from(value, 'utf8').toString('base64')
  return raw.match(/.{1,76}/g)?.join('\r\n') ?? ''
}

function buildMessage(config: SmtpConfig, mail: SmtpMail) {
  const fromName = encodeHeader(mail.fromName)
  const fromEmail = normalizeEmail(config.fromEmail)
  const toEmail = normalizeEmail(mail.to)
  const ccEmails = splitEmails(mail.cc)
  const boundary = `mitikus-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const headers = [
    `From: ${fromName} <${fromEmail}>`,
    `To: <${toEmail}>`,
    ...(ccEmails.length ? [`Cc: ${ccEmails.map((email) => `<${email}>`).join(', ')}`] : []),
    `Subject: ${encodeHeader(mail.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@mitikus.com>`,
    ...(mail.replyTo ? [`Reply-To: <${normalizeEmail(mail.replyTo)}>`] : []),
    'MIME-Version: 1.0',
  ]

  if (!mail.attachments?.length) {
    return [
      ...headers,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      dotStuff(mail.text),
    ].join('\r\n')
  }

  const parts = [
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    dotStuff(mail.text),
    '',
    ...mail.attachments.flatMap((attachment) => [
      `--${boundary}`,
      `Content-Type: ${attachment.contentType}; name="${encodeHeader(attachment.filename)}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${encodeHeader(attachment.filename)}"`,
      '',
      foldBase64(attachment.content),
      '',
    ]),
    `--${boundary}--`,
  ]

  return [
    ...headers,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    ...parts,
  ].join('\r\n')
}

function readResponse(socket: net.Socket): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = ''
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString('utf8')
      const lines = buffer.split(/\r?\n/).filter(Boolean)
      const last = lines[lines.length - 1]
      if (last && /^\d{3} /.test(last)) {
        cleanup()
        resolve(buffer)
      }
    }
    const onError = (err: Error) => {
      cleanup()
      reject(err)
    }
    const cleanup = () => {
      socket.off('data', onData)
      socket.off('error', onError)
    }
    socket.on('data', onData)
    socket.on('error', onError)
  })
}

async function command(socket: net.Socket, value: string, allowedCodes: number[]) {
  socket.write(`${value}\r\n`)
  const response = await readResponse(socket)
  const code = Number(response.slice(0, 3))
  if (!allowedCodes.includes(code)) {
    throw new Error(`SMTP ${code}: ${response.trim()}`)
  }
  return response
}

async function connect(config: SmtpConfig): Promise<net.Socket> {
  const socket = config.secure
    ? tls.connect({ host: config.host, port: config.port, servername: config.host })
    : net.connect({ host: config.host, port: config.port })

  await new Promise<void>((resolve, reject) => {
    socket.once('connect', resolve)
    socket.once('error', reject)
  })
  const greeting = await readResponse(socket)
  if (!greeting.startsWith('220')) {
    throw new Error(`SMTP no disponible: ${greeting.trim()}`)
  }
  return socket
}

export async function sendSmtpMail(mail: SmtpMail) {
  const config = getSmtpConfig()
  let socket = await connect(config)

  try {
    let hello = await command(socket, 'EHLO mitikus.com', [250])

    if (!config.secure && hello.toUpperCase().includes('STARTTLS')) {
      await command(socket, 'STARTTLS', [220])
      socket = tls.connect({ socket, servername: config.host })
      await new Promise<void>((resolve, reject) => {
        socket.once('secureConnect', resolve)
        socket.once('error', reject)
      })
      hello = await command(socket, 'EHLO mitikus.com', [250])
    }

    if (config.user && config.pass) {
      await command(socket, 'AUTH LOGIN', [334])
      await command(socket, Buffer.from(config.user).toString('base64'), [334])
      await command(socket, Buffer.from(config.pass).toString('base64'), [235])
    }

    const rawMessage = buildMessage(config, mail)
    const fromEmail = normalizeEmail(config.fromEmail)
    const recipients = Array.from(new Set([normalizeEmail(mail.to), ...splitEmails(mail.cc), ...splitEmails(mail.bcc)]))
    await command(socket, `MAIL FROM:<${fromEmail}>`, [250])
    for (const recipient of recipients) {
      await command(socket, `RCPT TO:<${recipient}>`, [250, 251])
    }
    await command(socket, 'DATA', [354])
    socket.write(`${rawMessage}\r\n.\r\n`)
    const dataResponse = await readResponse(socket)
    if (!dataResponse.startsWith('250')) {
      throw new Error(`SMTP envío rechazado: ${dataResponse.trim()}`)
    }
    await command(socket, 'QUIT', [221])
    return { rawMessage }
  } finally {
    socket.destroy()
  }
}


export interface WorkspaceSmtpConfig {
  host: string
  port: number
  secure: boolean
  user?: string
  pass?: string
  fromEmail: string
}

/** Igual que sendSmtpMail pero usando la configuración SMTP explícita del workspace. */
export async function sendSmtpMailWithConfig(config: WorkspaceSmtpConfig, mail: SmtpMail) {
  let socket = await connect(config)

  try {
    let hello = await command(socket, 'EHLO mitikus.com', [250])

    if (!config.secure && hello.toUpperCase().includes('STARTTLS')) {
      await command(socket, 'STARTTLS', [220])
      socket = tls.connect({ socket, servername: config.host })
      await new Promise<void>((resolve, reject) => {
        socket.once('secureConnect', resolve)
        socket.once('error', reject)
      })
      hello = await command(socket, 'EHLO mitikus.com', [250])
    }

    if (hello.toUpperCase().includes('AUTH') && config.user && config.pass) {
      await command(socket, 'AUTH LOGIN', [334])
      await command(socket, Buffer.from(config.user).toString('base64'), [334])
      await command(socket, Buffer.from(config.pass).toString('base64'), [235])
    }

    const rawMessage = buildMessage(config, mail)

    await command(socket, `MAIL FROM:<${config.fromEmail}>`, [250])
    const allRecipients = [
      ...splitEmails(mail.to),
      ...splitEmails(mail.cc),
      ...splitEmails(mail.bcc),
    ].filter(Boolean)
    for (const recipient of allRecipients) {
      await command(socket, `RCPT TO:<${recipient}>`, [250, 251])
    }
    await command(socket, 'DATA', [354])
    socket.write(`${rawMessage}\r\n.\r\n`)
    const dataResponse = await readResponse(socket)
    if (!dataResponse.startsWith('250')) {
      throw new Error(`SMTP envío rechazado: ${dataResponse.trim()}`)
    }
    await command(socket, 'QUIT', [221])
    return { rawMessage }
  } finally {
    socket.destroy()
  }
}
