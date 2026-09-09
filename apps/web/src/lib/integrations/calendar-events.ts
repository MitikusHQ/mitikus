import type { CalendarProvider } from '@/lib/integrations/calendar'

export interface CalendarEventInput {
  provider: CalendarProvider
  accessToken: string
  title: string
  description?: string | null
  startsAt: Date
  durationMinutes?: number
}

export interface CalendarEventResult {
  providerEventId?: string | null
  webUrl?: string | null
}

export async function createExternalCalendarEvent(input: CalendarEventInput): Promise<CalendarEventResult> {
  if (input.provider === 'google') return createGoogleCalendarEvent(input)
  return createOutlookCalendarEvent(input)
}

function eventDates(input: CalendarEventInput) {
  const startsAt = input.startsAt
  const endsAt = new Date(startsAt.getTime() + (input.durationMinutes ?? 60) * 60_000)
  return { startsAt, endsAt }
}

async function createGoogleCalendarEvent(input: CalendarEventInput): Promise<CalendarEventResult> {
  const { startsAt, endsAt } = eventDates(input)
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${input.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      summary: input.title,
      description: input.description ?? undefined,
      start: { dateTime: startsAt.toISOString() },
      end: { dateTime: endsAt.toISOString() },
    }),
  })
  const data = await res.json() as { id?: string; htmlLink?: string; error?: { message?: string } }
  if (!res.ok) throw new Error(data.error?.message ?? 'No se pudo crear el evento en Google Calendar.')
  return { providerEventId: data.id ?? null, webUrl: data.htmlLink ?? null }
}

async function createOutlookCalendarEvent(input: CalendarEventInput): Promise<CalendarEventResult> {
  const { startsAt, endsAt } = eventDates(input)
  const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${input.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      subject: input.title,
      body: {
        contentType: 'Text',
        content: input.description ?? '',
      },
      start: {
        dateTime: startsAt.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endsAt.toISOString(),
        timeZone: 'UTC',
      },
    }),
  })
  const data = await res.json() as { id?: string; webLink?: string; error?: { message?: string } }
  if (!res.ok) throw new Error(data.error?.message ?? 'No se pudo crear el evento en Outlook Calendar.')
  return { providerEventId: data.id ?? null, webUrl: data.webLink ?? null }
}
