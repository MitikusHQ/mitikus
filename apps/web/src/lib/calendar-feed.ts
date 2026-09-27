import { createHmac, timingSafeEqual } from 'node:crypto'

const TOKEN_VERSION = 'v1'

export interface CalendarFeedTokenPayload {
  workspaceId: string
  userId: string
}

function getCalendarFeedSecret() {
  return process.env.CALENDAR_FEED_SECRET ?? process.env.MITIKUS_LICENSE_SECRET ?? null
}

function b64url(input: string | Buffer) {
  return Buffer.from(input).toString('base64url')
}

function signPayload(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function createCalendarFeedToken(input: CalendarFeedTokenPayload) {
  const secret = getCalendarFeedSecret()
  if (!secret) return null

  const payload = b64url(JSON.stringify({
    v: TOKEN_VERSION,
    wid: input.workspaceId,
    uid: input.userId,
  }))
  const signature = signPayload(payload, secret)
  return `${payload}.${signature}`
}

export function verifyCalendarFeedToken(token: string | null): CalendarFeedTokenPayload | null {
  const secret = getCalendarFeedSecret()
  if (!secret || !token) return null

  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const expected = signPayload(payload, secret)
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (actualBuffer.length !== expectedBuffer.length) return null
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      v?: unknown
      wid?: unknown
      uid?: unknown
    }
    if (parsed.v !== TOKEN_VERSION) return null
    if (typeof parsed.wid !== 'string' || typeof parsed.uid !== 'string') return null
    return { workspaceId: parsed.wid, userId: parsed.uid }
  } catch {
    return null
  }
}

export function buildCalendarFeedUrl(workspaceId: string, token: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mitikus.com').replace(/\/$/, '')
  const params = new URLSearchParams({ token })
  return `${baseUrl}/api/calendar/feed/${workspaceId}.ics?${params.toString()}`
}

export interface IcsEvent {
  uid: string
  title: string
  description?: string | null
  startsAt: Date
  endsAt?: Date | null
  allDay?: boolean
  url?: string | null
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function formatDateTime(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '')
}

function foldLine(line: string) {
  const chunks: string[] = []
  let rest = line
  while (rest.length > 73) {
    chunks.push(rest.slice(0, 73))
    rest = ` ${rest.slice(73)}`
  }
  chunks.push(rest)
  return chunks.join('\r\n')
}

export function buildIcsCalendar(input: {
  calendarName: string
  productId?: string
  events: IcsEvent[]
}) {
  const now = formatDateTime(new Date())
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${input.productId ?? '-//MITIKUS//Workspace Calendar//ES'}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(input.calendarName)}`,
    'X-WR-TIMEZONE:Europe/Madrid',
  ]

  for (const event of input.events) {
    const uid = `${event.uid}@mitikus.com`
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${escapeIcsText(uid)}`)
    lines.push(`DTSTAMP:${now}`)
    if (event.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${formatDate(event.startsAt)}`)
      lines.push(`DTEND;VALUE=DATE:${formatDate(event.endsAt ?? new Date(event.startsAt.getTime() + 86_400_000))}`)
    } else {
      lines.push(`DTSTART:${formatDateTime(event.startsAt)}`)
      lines.push(`DTEND:${formatDateTime(event.endsAt ?? new Date(event.startsAt.getTime() + 60 * 60_000))}`)
    }
    lines.push(`SUMMARY:${escapeIcsText(event.title)}`)
    if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`)
    if (event.url) lines.push(`URL:${escapeIcsText(event.url)}`)
    lines.push('BEGIN:VALARM')
    lines.push('ACTION:DISPLAY')
    lines.push(`DESCRIPTION:${escapeIcsText(event.title)}`)
    lines.push('TRIGGER:-PT30M')
    lines.push('END:VALARM')
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return `${lines.map(foldLine).join('\r\n')}\r\n`
}
