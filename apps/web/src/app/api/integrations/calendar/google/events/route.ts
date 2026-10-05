import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { parseWorkspaceIntegrations, getCalendarAccessToken } from '@/lib/integrations/calendar'

interface GoogleEvent {
  id: string
  summary?: string
  description?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  htmlLink?: string
}

interface GoogleEventsResponse {
  items?: GoogleEvent[]
  error?: { message?: string }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const workspaceId = searchParams.get('workspaceId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!workspaceId || !from || !to) {
    return NextResponse.json({ error: 'Faltan parámetros.' }, { status: 400 })
  }

  const user = await requireUser()
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { companyProfile: { select: { integrations: true } } },
  })
  if (!workspace) return NextResponse.json({ error: 'Workspace no encontrado.' }, { status: 404 })

  const integrations = parseWorkspaceIntegrations(workspace.companyProfile?.integrations)
  if (integrations.calendar?.provider !== 'google') {
    return NextResponse.json({ items: [] })
  }

  const accessToken = getCalendarAccessToken(integrations.calendar)
  if (!accessToken) return NextResponse.json({ items: [] })

  const params = new URLSearchParams({
    timeMin: from,
    timeMax: to,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  })

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    { headers: { authorization: `Bearer ${accessToken}` } },
  )

  const data = await res.json() as GoogleEventsResponse
  if (!res.ok) {
    return NextResponse.json({ error: data.error?.message ?? 'Error Google Calendar.' }, { status: res.status })
  }

  const items = (data.items ?? []).map((ev) => ({
    id: `google-${ev.id}`,
    source: 'google' as const,
    title: ev.summary ?? '(Sin título)',
    description: ev.description ?? null,
    type: 'google_event',
    startsAt: ev.start?.dateTime ?? ev.start?.date ?? '',
    endsAt: ev.end?.dateTime ?? ev.end?.date ?? null,
    allDay: !ev.start?.dateTime,
    clientName: null,
    href: ev.htmlLink ?? null,
  }))

  return NextResponse.json({ items })
}
