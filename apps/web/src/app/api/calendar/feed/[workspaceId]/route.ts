import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buildIcsCalendar, verifyCalendarFeedToken, type IcsEvent } from '@/lib/calendar-feed'

interface RouteContext {
  params: Promise<{ workspaceId: string }>
}

function appUrl(path: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mitikus.com').replace(/\/$/, '')
  return `${baseUrl}${path}`
}

function nextAllDayEnd(date: Date) {
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  end.setUTCDate(end.getUTCDate() + 1)
  return end
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { workspaceId: rawWorkspaceId } = await context.params
  const workspaceId = rawWorkspaceId.replace(/\.ics$/, '')
  const payload = verifyCalendarFeedToken(request.nextUrl.searchParams.get('token'))

  if (!payload || payload.workspaceId !== workspaceId) {
    return new NextResponse('Invalid calendar feed token', { status: 401 })
  }

  const workspace = await db.workspace.findFirst({
    where: {
      id: workspaceId,
      org: { users: { some: { id: payload.userId } } },
    },
    select: { id: true, name: true },
  })
  if (!workspace) return new NextResponse('Calendar feed not found', { status: 404 })

  const now = new Date()
  const horizon = new Date(now)
  horizon.setDate(horizon.getDate() + 180)

  const [calendarEvents, tasks, invoices] = await Promise.all([
    db.calendarEvent.findMany({
      where: {
        workspaceId,
        startsAt: { gte: now, lte: horizon },
        OR: [{ assignedTo: payload.userId }, { createdBy: payload.userId }],
      },
      select: { id: true, title: true, description: true, startsAt: true, endsAt: true, allDay: true, updatedAt: true },
      orderBy: { startsAt: 'asc' },
      take: 150,
    }),
    db.task.findMany({
      where: {
        workspaceId,
        dueDate: { gte: now, lte: horizon },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        OR: [{ createdBy: payload.userId }, { tags: { some: { userId: payload.userId } } }],
      },
      select: { id: true, dueDate: true, updatedAt: true },
      orderBy: { dueDate: 'asc' },
      take: 150,
    }),
    db.invoice.findMany({
      where: {
        workspaceId,
        dueDate: { gte: now, lte: horizon },
        status: { notIn: ['pagada', 'cancelada'] },
      },
      select: { id: true, dueDate: true, updatedAt: true },
      orderBy: { dueDate: 'asc' },
      take: 100,
    }),
  ])

  const events: IcsEvent[] = [
    ...calendarEvents.map((event) => ({
      uid: `calendar-${event.id}-${event.updatedAt.getTime()}`,
      title: event.title,
      description: event.description ?? 'Evento de MITIKUS.',
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      allDay: event.allDay,
      url: appUrl(`/workspace/${workspaceId}/calendar`),
    })),
    ...tasks
      .filter((task): task is typeof task & { dueDate: Date } => Boolean(task.dueDate))
      .map((task) => ({
        uid: `task-${task.id}-${task.updatedAt.getTime()}`,
        title: 'MITIKUS · Tarea pendiente',
        description: 'Abre MITIKUS para ver el detalle de la tarea.',
        startsAt: task.dueDate,
        endsAt: new Date(task.dueDate.getTime() + 60 * 60_000),
        url: appUrl(`/workspace/${workspaceId}/tasks?task=${task.id}`),
      })),
    ...invoices
      .filter((invoice): invoice is typeof invoice & { dueDate: Date } => Boolean(invoice.dueDate))
      .map((invoice) => ({
        uid: `invoice-${invoice.id}-${invoice.updatedAt.getTime()}`,
        title: 'MITIKUS · Vence factura',
        description: 'Abre MITIKUS para ver el detalle de la factura.',
        startsAt: invoice.dueDate,
        endsAt: nextAllDayEnd(invoice.dueDate),
        allDay: true,
        url: appUrl(`/workspace/${workspaceId}/invoices`),
      })),
  ]

  const ics = buildIcsCalendar({
    calendarName: `MITIKUS · ${workspace.name}`,
    events,
  })

  return new NextResponse(ics, {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `inline; filename="mitikus-${workspace.id}.ics"`,
      'cache-control': 'private, max-age=600',
    },
  })
}
