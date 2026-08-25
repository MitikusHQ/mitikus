import net from 'node:net'
import tls from 'node:tls'

interface ImapConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  sentMailbox?: string
  inboxMailbox: string
}

export interface ImapFetchedMessage {
  mailbox: string
  uid: number
  raw: string
  headers: string
  subject: string
  fromEmail: string | null
  fromName: string | null
  toEmail: string | null
  messageId: string | null
  date: Date | null
  body: string
}

function getImapConfig(): ImapConfig | null {
  const host = process.env.MITIKUS_IMAP_HOST
  const user = process.env.MITIKUS_IMAP_USER ?? process.env.MITIKUS_SMTP_USER
  const pass = process.env.MITIKUS_IMAP_PASS ?? process.env.MITIKUS_SMTP_PASS
  if (!host || !user || !pass) return null

  return {
    host,
    port: Number(process.env.MITIKUS_IMAP_PORT ?? 993),
    secure: process.env.MITIKUS_IMAP_SECURE !== 'false',
    user,
    pass,
    sentMailbox: process.env.MITIKUS_IMAP_SENT_MAILBOX,
    inboxMailbox: process.env.MITIKUS_IMAP_INBOX_MAILBOX ?? 'INBOX',
  }
}

function quote(value: string) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function formatImapDate(date: Date) {
  const day = String(date.getDate()).padStart(2, '0')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  const time = [date.getHours(), date.getMinutes(), date.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':')
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const abs = Math.abs(offset)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  return `${day}-${month}-${year} ${time} ${sign}${hh}${mm}`
}

function readUntil(socket: net.Socket, predicate: (buffer: string) => boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = ''
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString('utf8')
      if (predicate(buffer)) {
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

function readTagged(socket: net.Socket, tag: string) {
  return readUntil(socket, (buffer) => new RegExp(`(?:^|\\r?\\n)${tag} (OK|NO|BAD)`, 'i').test(buffer))
}

async function command(socket: net.Socket, tag: string, value: string) {
  socket.write(`${tag} ${value}\r\n`)
  const response = await readTagged(socket, tag)
  if (!new RegExp(`(?:^|\\r?\\n)${tag} OK`, 'i').test(response)) {
    throw new Error(`IMAP ${tag}: ${response.trim()}`)
  }
  return response
}

async function connect(config: ImapConfig): Promise<net.Socket> {
  const socket = config.secure
    ? tls.connect({ host: config.host, port: config.port, servername: config.host })
    : net.connect({ host: config.host, port: config.port })

  await new Promise<void>((resolve, reject) => {
    socket.once(config.secure ? 'secureConnect' : 'connect', resolve)
    socket.once('error', reject)
  })

  const greeting = await readUntil(socket, (buffer) => /(?:^|\r?\n)\* OK/i.test(buffer))
  if (!/(?:^|\r?\n)\* OK/i.test(greeting)) {
    throw new Error(`IMAP no disponible: ${greeting.trim()}`)
  }
  return socket
}

async function appendToMailbox(socket: net.Socket, tag: string, mailbox: string, rawMessage: string) {
  const normalized = rawMessage.replace(/\r?\n/g, '\r\n')
  const bytes = Buffer.byteLength(normalized, 'utf8')
  const date = formatImapDate(new Date())
  socket.write(`${tag} APPEND ${quote(mailbox)} (\\Seen) ${quote(date)} {${bytes}}\r\n`)
  const continuation = await readUntil(socket, (buffer) => /(?:^|\r?\n)\+/.test(buffer) || new RegExp(`(?:^|\\r?\\n)${tag} (NO|BAD)`, 'i').test(buffer))
  if (!/(?:^|\r?\n)\+/.test(continuation)) {
    throw new Error(`IMAP APPEND rechazado: ${continuation.trim()}`)
  }
  socket.write(`${normalized}\r\n`)
  const response = await readTagged(socket, tag)
  if (!new RegExp(`(?:^|\\r?\\n)${tag} OK`, 'i').test(response)) {
    throw new Error(`IMAP APPEND falló en ${mailbox}: ${response.trim()}`)
  }
}

export async function appendMailToSent(rawMessage: string) {
  const config = getImapConfig()
  if (!config) return { ok: false as const, skipped: true as const, error: 'IMAP no configurado.' }

  const socket = await connect(config)
  const candidates = [
    config.sentMailbox,
    'Sent',
    'Enviados',
    'Sent Messages',
    'INBOX.Sent',
    'INBOX.Enviados',
  ].filter((value, index, list): value is string => Boolean(value) && list.indexOf(value) === index)

  try {
    await command(socket, 'A001', `LOGIN ${quote(config.user)} ${quote(config.pass)}`)
    let lastError = ''
    for (let i = 0; i < candidates.length; i += 1) {
      try {
        await appendToMailbox(socket, `A${String(i + 2).padStart(3, '0')}`, candidates[i]!, rawMessage)
        await command(socket, 'A999', 'LOGOUT').catch(() => undefined)
        return { ok: true as const, mailbox: candidates[i]! }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'No se pudo guardar en Enviados.'
      }
    }
    throw new Error(lastError || 'No se encontró una carpeta Enviados compatible.')
  } finally {
    socket.destroy()
  }
}
function repairMojibake(value: string) {
  if (!/[ÃÂ]/.test(value)) return value
  try {
    const repaired = Buffer.from(value, 'latin1').toString('utf8')
    return repaired.includes('�') ? value : repaired
  } catch {
    return value
  }
}

function decodeMimeWord(value: string) {
  return value.replace(/=\?([^?]+)\?([bqBQ])\?([^?]+)\?=/g, (_match, charset: string, encoding: string, text: string) => {
    const normalizedCharset = charset.toLowerCase()
    if (normalizedCharset !== 'utf-8' && normalizedCharset !== 'us-ascii' && normalizedCharset !== 'iso-8859-1') return text
    if (encoding.toUpperCase() === 'B') {
      const buffer = Buffer.from(text, 'base64')
      return normalizedCharset === 'iso-8859-1' ? buffer.toString('latin1') : buffer.toString('utf8')
    }
    const qp = text.replace(/_/g, ' ').replace(/=([A-Fa-f0-9]{2})/g, (_: string, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    return normalizedCharset === 'iso-8859-1' ? Buffer.from(qp, 'binary').toString('latin1') : Buffer.from(qp, 'binary').toString('utf8')
  })
}

function unfoldHeaders(headers: string) {
  return headers.replace(/\r?\n[ \t]+/g, ' ')
}

function getHeader(headers: string, name: string) {
  const match = unfoldHeaders(headers).match(new RegExp(`^${name}:\\s*(.*)$`, 'im'))
  return match?.[1]?.trim() ? decodeMimeWord(match[1].trim()) : null
}

function parseAddress(value: string | null) {
  if (!value) return { email: null, name: null }
  const angle = value.match(/^(.*)<([^>]+)>/) 
  if (angle) {
    return { email: angle[2]!.trim().toLowerCase(), name: angle[1]!.replace(/"/g, '').trim() || null }
  }
  const email = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null
  return { email: email?.toLowerCase() ?? null, name: email ? value.replace(email, '').replace(/[<>"(),]/g, '').trim() || null : null }
}

function decodeQuotedPrintable(value: string) {
  const soft = value.replace(/=\r?\n/g, '')
  return Buffer.from(
    soft.replace(/=([A-Fa-f0-9]{2})/g, (_match, hex: string) => String.fromCharCode(parseInt(hex, 16))),
    'binary',
  ).toString('utf8')
}

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
}

function extractBody(raw: string) {
  const separator = raw.indexOf('\r\n\r\n') >= 0 ? '\r\n\r\n' : '\n\n'
  const body = raw.slice(raw.indexOf(separator) + separator.length)
  const contentType = getHeader(raw.slice(0, raw.indexOf(separator)), 'Content-Type') ?? ''
  const transfer = (getHeader(raw.slice(0, raw.indexOf(separator)), 'Content-Transfer-Encoding') ?? '').toLowerCase()

  if (/multipart\//i.test(contentType)) {
    const boundary = contentType.match(/boundary="?([^";]+)"?/i)?.[1]
    if (boundary) {
      const parts = body.split(`--${boundary}`)
      const textPart = parts.find((part) => /Content-Type:\s*text\/plain/i.test(part)) ?? parts.find((part) => /Content-Type:\s*text\/html/i.test(part))
      if (textPart) return extractBody(textPart.trim())
    }
  }

  let decoded = body
  if (transfer.includes('base64')) {
    decoded = Buffer.from(body.replace(/\s+/g, ''), 'base64').toString('utf8')
  } else if (transfer.includes('quoted-printable')) {
    decoded = decodeQuotedPrintable(body)
  }
  if (/text\/html/i.test(contentType)) decoded = stripHtml(decoded)
  return repairMojibake(decoded).replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim()
}

function parseFetchedMessage(mailbox: string, uid: number, raw: string): ImapFetchedMessage {
  const separator = raw.indexOf('\r\n\r\n') >= 0 ? '\r\n\r\n' : '\n\n'
  const headers = separator ? raw.slice(0, raw.indexOf(separator)) : raw
  const from = parseAddress(getHeader(headers, 'From'))
  const to = parseAddress(getHeader(headers, 'To'))
  const dateRaw = getHeader(headers, 'Date')
  const date = dateRaw ? new Date(dateRaw) : null
  return {
    mailbox,
    uid,
    raw,
    headers,
    subject: repairMojibake(getHeader(headers, 'Subject') ?? '(sin asunto)'),
    fromEmail: from.email,
    fromName: from.name ? repairMojibake(from.name) : null,
    toEmail: to.email,
    messageId: getHeader(headers, 'Message-ID'),
    date: date && !Number.isNaN(date.getTime()) ? date : null,
    body: extractBody(raw),
  }
}

async function selectMailbox(socket: net.Socket, mailbox: string) {
  return command(socket, 'B002', `SELECT ${quote(mailbox)}`)
}

async function searchRecentUids(socket: net.Socket, limit: number) {
  socket.write('B003 UID SEARCH ALL\r\n')
  const response = await readTagged(socket, 'B003')
  if (!/(?:^|\r?\n)B003 OK/i.test(response)) {
    throw new Error(`IMAP SEARCH falló: ${response.trim()}`)
  }
  const line = response.split(/\r?\n/).find((value) => /^\* SEARCH/i.test(value)) ?? ''
  return line
    .replace(/^\* SEARCH\s*/i, '')
    .split(/\s+/)
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0)
    .slice(-limit)
}

function parseFetchBlocks(response: string) {
  const blocks: Array<{ uid: number; raw: string }> = []
  const regex = /\* \d+ FETCH \([^\n]*UID (\d+)[\s\S]*?BODY\[\]\s*\{\d+\}\r?\n([\s\S]*?)\r?\n\)\r?\n/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(response)) !== null) {
    blocks.push({ uid: Number(match[1]), raw: match[2] ?? '' })
  }
  return blocks
}

export async function fetchInboxMessages(limit = 25): Promise<ImapFetchedMessage[]> {
  const config = getImapConfig()
  if (!config) return []

  const socket = await connect(config)
  try {
    await command(socket, 'B001', `LOGIN ${quote(config.user)} ${quote(config.pass)}`)
    await selectMailbox(socket, config.inboxMailbox)
    const uids = await searchRecentUids(socket, limit)
    if (uids.length === 0) {
      await command(socket, 'B999', 'LOGOUT').catch(() => undefined)
      return []
    }
    socket.write(`B004 UID FETCH ${uids.join(',')} (UID BODY.PEEK[])\r\n`)
    const response = await readTagged(socket, 'B004')
    const messages = parseFetchBlocks(response).map((message) => parseFetchedMessage(config.inboxMailbox, message.uid, message.raw))
    await command(socket, 'B999', 'LOGOUT').catch(() => undefined)
    return messages
  } finally {
    socket.destroy()
  }
}
