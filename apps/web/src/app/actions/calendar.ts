'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'

export type CalendarItemSource = 'event' | 'task' | 'invoice'

export interface CalendarItem {
  id: string
  source: CalendarItemSource
  title: string
  description: string | null
  type: string
  startsAt: string
  endsAt: string | null
  allDay: boolean
  clientName: string | null
  href: string | null
}

export interface CalendarClientOption {
  id: string
  name: string
}

function toIso(date: Date | null | undefined) {
  return date ? date.toISOString() : null
}

function parseDateInput(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

async function requireWorkspace(workspaceId: string) {
  const user = await requireUser()
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) throw new Error('Workspace no encontrado.')
  return { user, workspace }
}

export async function getCalendarItems(workspaceId: string, fromIso: string, toIsoValue: string) {
  const { user } = await requireWorkspace(workspaceId)
  const from = parseDateInput(fromIso) ?? startOfDay(new Date())
  const to = parseDateInput(toIsoValue) ?? endOfDay(from)

  const [events, tasks, invoices] = await Promise.all([
    db.calendarEvent.findMany({
      where: {
        workspaceId,
        startsAt: { lte: to },
        OR: [
          { endsAt: { gte: from } },
          { endsAt: null, startsAt: { gte: from } },
        ],
      },
      include: { client: { select: { name: true } } },
      orderBy: { startsAt: 'asc' },
      take: 300,
    }),
    db.task.findMany({
      where: {
        workspaceId,
        dueDate: { gte: from, lte: to },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        OR: [{ createdBy: user.id }, { tags: { some: { userId: user.id } } }],
      },
      include: { client: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
      take: 300,
    }),
    db.invoice.findMany({
      where: {
        workspaceId,
        dueDate: { gte: from, lte: to },
        status: { notIn: ['pagada', 'cancelada'] },
      },
      include: { client: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
      take: 200,
    }),
  ])

  const items: CalendarItem[] = [
    ...events.map((event) => ({
      id: event.id,
      source: 'event' as const,
      title: event.title,
      description: event.description,
      type: event.type,
      startsAt: event.startsAt.toISOString(),
      endsAt: toIso(event.endsAt),
      allDay: event.allDay,
      clientName: event.client?.name ?? null,
      href: null,
    })),
    ...tasks
      .filter((task): task is typeof task & { dueDate: Date } => Boolean(task.dueDate))
      .map((task) => ({
        id: task.id,
        source: 'task' as const,
        title: task.title,
        description: task.description,
        type: 'task',
        startsAt: task.dueDate.toISOString(),
        endsAt: null,
        allDay: false,
        clientName: task.client?.name ?? null,
        href: `/workspace/${workspaceId}/tasks?task=${task.id}`,
      })),
    ...invoices
      .filter((invoice): invoice is typeof invoice & { dueDate: Date } => Boolean(invoice.dueDate))
      .map((invoice) => ({
        id: invoice.id,
        source: 'invoice' as const,
        title: `Factura ${invoice.number}`,
        description: `Vencimiento de factura (${invoice.status})`,
        type: 'invoice',
        startsAt: invoice.dueDate.toISOString(),
        endsAt: null,
        allDay: true,
        clientName: invoice.client?.name ?? null,
        href: `/workspace/${workspaceId}/invoices`,
      })),
  ]

  return items.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
}

export async function getCalendarClientOptions(workspaceId: string): Promise<CalendarClientOption[]> {
  await requireWorkspace(workspaceId)
  return db.client.findMany({
    where: { workspaceId, isArchived: false },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
    take: 200,
  })
}

export async function createCalendarEvent(workspaceId: string, formData: FormData) {
  const { user } = await requireWorkspace(workspaceId)

  const title = String(formData.get('title') ?? '').trim()
  const startsAt = parseDateInput(formData.get('startsAt'))
  const endsAt = parseDateInput(formData.get('endsAt'))
  const type = String(formData.get('type') ?? 'event')
  const description = String(formData.get('description') ?? '').trim()
  const location = String(formData.get('location') ?? '').trim()
  const clientId = String(formData.get('clientId') ?? '').trim()
  const allDay = formData.get('allDay') === 'on'

  if (!title) return { ok: false as const, error: 'Añade un título.' }
  if (!startsAt) return { ok: false as const, error: 'Añade una fecha válida.' }
  if (endsAt && endsAt < startsAt) return { ok: false as const, error: 'La hora de fin no puede ser anterior al inicio.' }

  const allowedTypes = new Set(['event', 'meeting', 'call', 'reminder'])
  const normalizedType = allowedTypes.has(type) ? type : 'event'

  if (clientId) {
    const client = await db.client.findFirst({ where: { id: clientId, workspaceId }, select: { id: true } })
    if (!client) return { ok: false as const, error: 'Cliente no válido.' }
  }

  await db.calendarEvent.create({
    data: {
      workspaceId,
      title,
      type: normalizedType,
      startsAt,
      endsAt,
      allDay,
      description: description || null,
      location: location || null,
      clientId: clientId || null,
      createdBy: user.id,
      assignedTo: user.id,
    },
  })

  revalidatePath(`/workspace/${workspaceId}/calendar`)
  return { ok: true as const }
}
