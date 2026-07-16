'use server'

import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

// ── Tipos exportados ──────────────────────────────────────────

export interface TimeEntryData {
  id: string
  date: string
  clockIn: string
  clockOut: string | null
  note: string | null
  editReason: string | null
  editedAt: string | null
  imputations: ImputationData[]
}

export interface ImputationData {
  id: string
  timeEntryId: string
  objectiveId: string | null
  objectiveLabel: string | null
  clientId: string | null
  clientName: string | null
  hours: number
  description: string | null
}

export interface ImputationOption {
  objectives: { id: string; label: string; clientName: string | null }[]
  clients: { id: string; name: string }[]
}

// ── Helpers internos ──────────────────────────────────────────

async function getAuthUserId(): Promise<string> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('No autenticado')
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) throw new Error('Usuario no encontrado')
  return user.id
}

function todayMidnight(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

// ── Serialización ─────────────────────────────────────────────

type RawEntry = {
  id: string
  date: Date
  clockIn: Date
  clockOut: Date | null
  note: string | null
  editReason: string | null
  editedAt: Date | null
  imputations: RawImputation[]
}

type RawImputation = {
  id: string
  timeEntryId: string
  objectiveId: string | null
  clientId: string | null
  hours: { toNumber(): number }
  description: string | null
  objective?: { id: string; label: string } | null
  client?: { id: string; name: string } | null
}

function serializeEntry(entry: RawEntry): TimeEntryData {
  return {
    id: entry.id,
    date: entry.date.toISOString().slice(0, 10),
    clockIn: entry.clockIn.toISOString(),
    clockOut: entry.clockOut?.toISOString() ?? null,
    note: entry.note,
    editReason: entry.editReason,
    editedAt: entry.editedAt?.toISOString() ?? null,
    imputations: entry.imputations.map(serializeImputation),
  }
}

function serializeImputation(imp: RawImputation): ImputationData {
  return {
    id: imp.id,
    timeEntryId: imp.timeEntryId,
    objectiveId: imp.objectiveId,
    objectiveLabel: imp.objective?.label ?? null,
    clientId: imp.clientId,
    clientName: imp.client?.name ?? null,
    hours: imp.hours.toNumber(),
    description: imp.description,
  }
}

const IMPUTATION_INCLUDE = {
  imputations: {
    include: {
      objective: { select: { id: true, label: true } },
      client: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
}

// ── Server actions ────────────────────────────────────────────

export async function getTodayEntry(
  workspaceId: string,
  userId: string
): Promise<TimeEntryData | null> {
  const entry = await db.timeEntry.findFirst({
    where: { workspaceId, userId, date: todayMidnight() },
    include: IMPUTATION_INCLUDE,
  })
  return entry ? serializeEntry(entry as unknown as RawEntry) : null
}

export async function clockIn(workspaceId: string): Promise<TimeEntryData> {
  const userId = await getAuthUserId()
  const today = todayMidnight()

  const existing = await db.timeEntry.findFirst({
    where: { workspaceId, userId, date: today },
  })
  if (existing) throw new Error('Ya existe un fichaje para hoy')

  const entry = await db.timeEntry.create({
    data: { workspaceId, userId, date: today, clockIn: new Date() },
    include: IMPUTATION_INCLUDE,
  })

  revalidatePath(`/workspace/${workspaceId}/today`)
  revalidatePath(`/workspace/${workspaceId}/timelog`)
  return serializeEntry(entry as unknown as RawEntry)
}

export async function clockOut(workspaceId: string): Promise<TimeEntryData> {
  const userId = await getAuthUserId()

  const entry = await db.timeEntry.findFirst({
    where: { workspaceId, userId, date: todayMidnight(), clockOut: null },
  })
  if (!entry) throw new Error('No hay fichaje abierto hoy')

  const updated = await db.timeEntry.update({
    where: { id: entry.id },
    data: { clockOut: new Date() },
    include: IMPUTATION_INCLUDE,
  })

  revalidatePath(`/workspace/${workspaceId}/today`)
  revalidatePath(`/workspace/${workspaceId}/timelog`)
  return serializeEntry(updated as unknown as RawEntry)
}

export async function getWeekEntries(
  workspaceId: string,
  weekStart: Date
): Promise<TimeEntryData[]> {
  const userId = await getAuthUserId()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const entries = await db.timeEntry.findMany({
    where: { workspaceId, userId, date: { gte: weekStart, lte: weekEnd } },
    include: IMPUTATION_INCLUDE,
    orderBy: { date: 'asc' },
  })

  return entries.map(e => serializeEntry(e as unknown as RawEntry))
}

export async function updateEntry(
  entryId: string,
  workspaceId: string,
  data: { clockIn: string; clockOut: string; editReason: string }
): Promise<TimeEntryData> {
  const editorId = await getAuthUserId()
  const clockIn = new Date(data.clockIn)
  const clockOut = new Date(data.clockOut)

  if (clockOut <= clockIn) throw new Error('La hora de salida debe ser posterior a la entrada')

  const updated = await db.timeEntry.update({
    where: { id: entryId },
    data: { clockIn, clockOut, editReason: data.editReason, editedAt: new Date(), editedBy: editorId },
    include: IMPUTATION_INCLUDE,
  })

  revalidatePath(`/workspace/${workspaceId}/timelog`)
  revalidatePath(`/workspace/${workspaceId}/today`)
  return serializeEntry(updated as unknown as RawEntry)
}

export async function deleteEntry(entryId: string, workspaceId: string): Promise<void> {
  await db.timeEntry.delete({ where: { id: entryId } })
  revalidatePath(`/workspace/${workspaceId}/timelog`)
  revalidatePath(`/workspace/${workspaceId}/today`)
}

export async function addImputation(data: {
  timeEntryId: string
  workspaceId: string
  objectiveId?: string
  clientId?: string
  hours: number
  description?: string
}): Promise<ImputationData> {
  const imp = await db.timeImputation.create({
    data: {
      timeEntryId: data.timeEntryId,
      objectiveId: data.objectiveId ?? null,
      clientId: data.clientId ?? null,
      hours: data.hours,
      description: data.description ?? null,
    },
    include: {
      objective: { select: { id: true, label: true } },
      client: { select: { id: true, name: true } },
    },
  })

  revalidatePath(`/workspace/${data.workspaceId}/timelog`)
  return serializeImputation(imp as unknown as RawImputation)
}

export async function deleteImputation(imputationId: string, workspaceId: string): Promise<void> {
  await db.timeImputation.delete({ where: { id: imputationId } })
  revalidatePath(`/workspace/${workspaceId}/timelog`)
}

export async function getImputationOptions(workspaceId: string): Promise<ImputationOption> {
  const [objectives, clients] = await Promise.all([
    db.companyObjective.findMany({
      where: { workspaceId, status: 'active' },
      select: { id: true, label: true, client: { select: { name: true } } },
      orderBy: { label: 'asc' },
      take: 50,
    }),
    db.client.findMany({
      where: { workspaceId, isArchived: false },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: 50,
    }),
  ])

  return {
    objectives: objectives.map(o => ({ id: o.id, label: o.label, clientName: o.client?.name ?? null })),
    clients: clients.map(c => ({ id: c.id, name: c.name })),
  }
}
