'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import type { EventVisibility } from '@prisma/client'

// ─── Auth helpers ──────────────────────────────────────────────────────────

async function requireWorkspace(workspaceId: string) {
  const user = await requireUser()
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true, name: true },
  })
  if (!workspace) throw new Error('Workspace not found')
  return { user, workspace }
}

function isAdminOrAbove(role: string) {
  return role === 'OWNER' || role === 'ADMIN'
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface AvailabilitySettingsData {
  timezone: string
  workDays: number[]
  workStart: string
  workEnd: string
  slotDuration: number
  bufferMinutes: number
  minNotice: number
  maxHorizon: number
  publicEnabled: boolean
}

export interface TimeSlot {
  startsAt: string // ISO
  endsAt: string   // ISO
}

export interface FreeBusyEntry {
  userId: string
  name: string | null
  avatarUrl: string | null
  slots: Array<{ startsAt: string; endsAt: string }>
}

// ─── Availability Settings ─────────────────────────────────────────────────

export async function getAvailabilitySettings(workspaceId: string) {
  const { user } = await requireWorkspace(workspaceId)

  const settings = await db.availabilitySettings.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    include: { bookingPage: { select: { token: true, active: true } } },
  })

  return settings
}

export async function upsertAvailabilitySettings(
  workspaceId: string,
  data: AvailabilitySettingsData,
) {
  const { user } = await requireWorkspace(workspaceId)

  // Validate inputs
  const validDurations = [15, 30, 45, 60]
  if (!validDurations.includes(data.slotDuration)) throw new Error('Invalid slot duration')
  if (data.bufferMinutes < 0 || data.bufferMinutes > 120) throw new Error('Invalid buffer')
  if (data.minNotice < 0 || data.minNotice > 10080) throw new Error('Invalid min notice')
  if (data.maxHorizon < 1 || data.maxHorizon > 365) throw new Error('Invalid horizon')
  if (!data.workDays.every((d) => d >= 0 && d <= 6)) throw new Error('Invalid work days')
  if (!/^\d{2}:\d{2}$/.test(data.workStart) || !/^\d{2}:\d{2}$/.test(data.workEnd)) {
    throw new Error('Invalid time format')
  }

  const settings = await db.availabilitySettings.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    create: { userId: user.id, workspaceId, ...data },
    update: data,
  })

  revalidatePath(`/workspace/${workspaceId}/calendar`)
  return settings
}

// ─── Booking Page (public link) ────────────────────────────────────────────

export async function getOrCreateBookingPage(workspaceId: string) {
  const { user } = await requireWorkspace(workspaceId)

  const settings = await db.availabilitySettings.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    include: { bookingPage: true },
  })
  if (!settings) throw new Error('Configure availability settings first')

  if (settings.bookingPage) return settings.bookingPage

  // Create new booking page with crypto token
  const token = randomBytes(24).toString('base64url')
  const page = await db.bookingPage.create({
    data: { availabilityId: settings.id, token, active: true },
  })
  return page
}

export async function rotateBookingToken(workspaceId: string) {
  const { user } = await requireWorkspace(workspaceId)

  const settings = await db.availabilitySettings.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    select: { id: true, bookingPage: { select: { id: true } } },
  })
  if (!settings?.bookingPage) throw new Error('No booking page found')

  const token = randomBytes(24).toString('base64url')
  const page = await db.bookingPage.update({
    where: { id: settings.bookingPage.id },
    data: { token, active: true },
  })
  return page
}

export async function setBookingPageActive(workspaceId: string, active: boolean) {
  const { user } = await requireWorkspace(workspaceId)

  const settings = await db.availabilitySettings.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    select: { bookingPage: { select: { id: true } } },
  })
  if (!settings?.bookingPage) throw new Error('No booking page found')

  return db.bookingPage.update({
    where: { id: settings.bookingPage.id },
    data: { active },
  })
}

// ─── Free/busy calculation ─────────────────────────────────────────────────

/**
 * Calculates busy slots for a user given a date range.
 * Respects event visibility: only returns BUSY sentinel for PRIVATE events.
 */
async function getUserBusySlots(
  userId: string,
  workspaceId: string,
  from: Date,
  to: Date,
  viewerUserId: string,
): Promise<Array<{ startsAt: Date; endsAt: Date; title: string | null }>> {
  const events = await db.calendarEvent.findMany({
    where: {
      workspaceId,
      OR: [{ createdBy: userId }, { assignedTo: userId }],
      startsAt: { lte: to },
      AND: [
        {
          OR: [
            { endsAt: { gte: from } },
            { endsAt: null, startsAt: { gte: from } },
          ],
        },
      ],
    },
    select: {
      startsAt: true,
      endsAt: true,
      allDay: true,
      title: true,
      visibility: true,
      createdBy: true,
    },
    orderBy: { startsAt: 'asc' },
  })

  return events.map((e) => {
    const end = e.endsAt ?? e.startsAt
    // PRIVATE: only show title to owner
    const showTitle = e.visibility !== 'PRIVATE' || e.createdBy === viewerUserId
    return {
      startsAt: e.startsAt,
      endsAt: end,
      title: showTitle ? e.title : null,
    }
  })
}

/**
 * Returns team free/busy for multiple users.
 * Caller must be authenticated and in the same workspace.
 */
export async function getTeamFreeBusy(
  workspaceId: string,
  userIds: string[],
  fromIso: string,
  toIso: string,
): Promise<FreeBusyEntry[]> {
  const { user } = await requireWorkspace(workspaceId)
  if (userIds.length === 0 || userIds.length > 20) throw new Error('Invalid userIds count')

  const from = new Date(fromIso)
  const to = new Date(toIso)
  if (isNaN(from.getTime()) || isNaN(to.getTime())) throw new Error('Invalid date range')

  // Verify all requested users are in the same org
  const members = await db.user.findMany({
    where: { id: { in: userIds }, orgId: user.orgId },
    select: { id: true, name: true, avatarUrl: true },
  })
  const validIds = new Set(members.map((m) => m.id))

  const results: FreeBusyEntry[] = []
  for (const member of members) {
    if (!validIds.has(member.id)) continue
    const slots = await getUserBusySlots(member.id, workspaceId, from, to, user.id)
    results.push({
      userId: member.id,
      name: member.name,
      avatarUrl: member.avatarUrl,
      slots: slots.map((s) => ({
        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt.toISOString(),
      })),
    })
  }
  return results
}

// ─── Available slot computation ────────────────────────────────────────────

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000)
}

function rangesOverlap(
  aStart: Date, aEnd: Date,
  bStart: Date, bEnd: Date,
): boolean {
  return aStart < bEnd && aEnd > bStart
}

/**
 * Pure slot computation — no auth, no DB. Safe to call from public routes.
 * Respects the host's timezone via Intl.DateTimeFormat.
 */
export function computeAvailableSlots(
  settings: {
    timezone: string
    workDays: number[]
    workStart: string
    workEnd: string
    slotDuration: number
    bufferMinutes: number
    minNotice: number
    maxHorizon: number
    publicEnabled: boolean
  },
  busyPeriods: Array<{ start: Date; end: Date }>,
  fromDate: Date,
  toDate: Date,
): TimeSlot[] {
  if (!settings.publicEnabled) return []

  const now = new Date()
  const earliest = addMinutes(now, settings.minNotice)
  const horizon = addMinutes(now, settings.maxHorizon * 24 * 60)

  const rangeFrom = earliest > fromDate ? earliest : fromDate
  const rangeTo = horizon < toDate ? horizon : toDate
  if (rangeFrom >= rangeTo) return []

  // Walk day by day in the host's timezone
  const tz = settings.timezone || 'UTC'
  const slots: TimeSlot[] = []

  // Start at midnight of rangeFrom in host TZ — returned as UTC Date
  const tzMidnight = (d: Date): Date => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(d)
    const y = parts.find((p) => p.type === 'year')!.value
    const mo = parts.find((p) => p.type === 'month')!.value
    const dy = parts.find((p) => p.type === 'day')!.value
    // Parse as UTC midnight of that calendar date in the tz
    return new Date(`${y}-${mo}-${dy}T00:00:00Z`)
  }

  // Day-of-week (0=Sun…6=Sat) in host TZ — parse a Sunday-anchored date string
  const tzDow = (d: Date): number => {
    // 'en-US' numeric weekday: Sun=1, Mon=2, ... Sat=7  → subtract 1
    const dow = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' }).format(d)
    return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].indexOf(dow)
  }

  // Build a UTC Date representing HH:MM on a given calendar day in the host TZ
  const tzTime = (dayUTC: Date, hhmm: string): Date => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(dayUTC)
    const y = parts.find((p) => p.type === 'year')!.value
    const mo = parts.find((p) => p.type === 'month')!.value
    const dy = parts.find((p) => p.type === 'day')!.value
    const offset = tzOffset(tz, dayUTC)
    return new Date(`${y}-${mo}-${dy}T${hhmm}:00${offset}`)
  }

  const cursor = tzMidnight(rangeFrom)
  while (cursor <= rangeTo && slots.length < 200) {
    const dow = tzDow(cursor)
    if (settings.workDays.includes(dow)) {
      const dayStart = tzTime(cursor, settings.workStart ?? '09:00')
      const dayEnd = tzTime(cursor, settings.workEnd ?? '18:00')

      let slotStart = dayStart < rangeFrom ? rangeFrom : dayStart
      // Align to slot grid
      if (slotStart > dayStart) {
        const offsetMs = slotStart.getTime() - dayStart.getTime()
        const slotMs = settings.slotDuration * 60_000
        const remainder = offsetMs % slotMs
        if (remainder > 0) slotStart = new Date(slotStart.getTime() + (slotMs - remainder))
      }

      while (slotStart < dayEnd && slotStart < rangeTo) {
        const slotEnd = addMinutes(slotStart, settings.slotDuration)
        if (slotEnd > dayEnd) break

        const isBusy = busyPeriods.some((b) => rangesOverlap(slotStart, slotEnd, b.start, b.end))
        if (!isBusy) {
          slots.push({ startsAt: slotStart.toISOString(), endsAt: slotEnd.toISOString() })
        }

        slotStart = addMinutes(slotEnd, settings.bufferMinutes)
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return slots
}

/** Returns "+HH:MM" or "-HH:MM" offset string for a timezone at a given date */
function tzOffset(tz: string, date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, timeZoneName: 'shortOffset',
  }).formatToParts(date)
  const offset = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+0'
  const match = offset.match(/GMT([+-])(\d+)(?::(\d+))?/)
  if (!match) return '+00:00'
  const sign = match[1] ?? '+'
  const hours = (match[2] ?? '0').padStart(2, '0')
  const mins = (match[3] ?? '0').padStart(2, '0')
  return `${sign}${hours}:${mins}`
}

/**
 * Computes available slots for a single user — authenticated (internal use).
 * Public booking pages should use computeAvailableSlots directly.
 */
export async function getAvailableSlots(
  workspaceId: string,
  hostUserId: string,
  fromDate: Date,
  toDate: Date,
): Promise<TimeSlot[]> {
  await requireWorkspace(workspaceId)
  return getAvailableSlotsInternal(workspaceId, hostUserId, fromDate, toDate)
}

/**
 * Internal slot computation — no auth required. Used by public booking routes.
 */
export async function getAvailableSlotsInternal(
  workspaceId: string,
  hostUserId: string,
  fromDate: Date,
  toDate: Date,
): Promise<TimeSlot[]> {
  const settings = await db.availabilitySettings.findUnique({
    where: { userId_workspaceId: { userId: hostUserId, workspaceId } },
  })
  if (!settings || !settings.publicEnabled) return []

  const now = new Date()
  const earliest = addMinutes(now, settings.minNotice)
  const horizon = addMinutes(now, settings.maxHorizon * 24 * 60)
  const rangeFrom = earliest > fromDate ? earliest : fromDate
  const rangeTo = horizon < toDate ? horizon : toDate
  if (rangeFrom >= rangeTo) return []

  const busyCalendar = await getUserBusySlots(hostUserId, workspaceId, rangeFrom, rangeTo, hostUserId)
  const bookingPage = await db.bookingPage.findFirst({
    where: { availability: { userId: hostUserId, workspaceId }, active: true },
    include: {
      bookings: {
        where: { status: 'CONFIRMED', startsAt: { lte: rangeTo }, endsAt: { gte: rangeFrom } },
        select: { startsAt: true, endsAt: true },
      },
    },
  })

  const busyPeriods = [
    ...busyCalendar.map((s) => ({ start: s.startsAt, end: s.endsAt })),
    ...(bookingPage?.bookings ?? []).map((b) => ({ start: b.startsAt, end: b.endsAt })),
  ]

  return computeAvailableSlots(settings, busyPeriods, fromDate, toDate)
}

// ─── Overlap finder for team meetings ─────────────────────────────────────

export async function findCommonSlots(
  workspaceId: string,
  userIds: string[],
  durationMinutes: number,
  fromIso: string,
  toIso: string,
): Promise<TimeSlot[]> {
  const { user } = await requireWorkspace(workspaceId)
  if (userIds.length < 2) throw new Error('Need at least 2 participants')

  const validDurations = [15, 30, 45, 60, 90, 120]
  if (!validDurations.includes(durationMinutes)) throw new Error('Invalid duration')

  const from = new Date(fromIso)
  const to = new Date(toIso)

  // Verify all users are in the org
  const members = await db.user.findMany({
    where: { id: { in: userIds }, orgId: user.orgId },
    select: { id: true },
  })
  if (members.length !== userIds.length) throw new Error('Invalid user selection')

  // Collect all busy slots per user
  const allBusy: Array<{ start: Date; end: Date }> = []
  for (const member of members) {
    const busy = await getUserBusySlots(member.id, workspaceId, from, to, user.id)
    allBusy.push(...busy.map((s) => ({ start: s.startsAt, end: s.endsAt })))
  }

  // Scan for free windows — use 15min resolution
  const STEP_MS = 15 * 60_000
  const durationMs = durationMinutes * 60_000
  const slots: TimeSlot[] = []

  let cursor = new Date(from)
  while (cursor.getTime() + durationMs <= to.getTime()) {
    const slotEnd = new Date(cursor.getTime() + durationMs)
    const isBusy = allBusy.some((b) => rangesOverlap(cursor, slotEnd, b.start, b.end))
    if (!isBusy) {
      slots.push({ startsAt: cursor.toISOString(), endsAt: slotEnd.toISOString() })
      if (slots.length >= 10) break // return first 10 common slots
      cursor = slotEnd // jump past this slot
    } else {
      cursor = new Date(cursor.getTime() + STEP_MS)
    }
  }

  return slots
}

// ─── Create internal meeting with participants ─────────────────────────────

export interface CreateMeetingInput {
  title: string
  startsAt: string
  endsAt: string
  participantIds: string[]
  description?: string
  location?: string
  visibility?: EventVisibility
}

export async function createMeetingWithParticipants(
  workspaceId: string,
  input: CreateMeetingInput,
) {
  const { user } = await requireWorkspace(workspaceId)

  const startsAt = new Date(input.startsAt)
  const endsAt = new Date(input.endsAt)
  if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) throw new Error('Invalid dates')
  if (endsAt <= startsAt) throw new Error('End must be after start')
  if (!input.title.trim()) throw new Error('Title required')

  // Verify participants are in the same org
  const participantIds = [...new Set([user.id, ...input.participantIds])]
  const members = await db.user.findMany({
    where: { id: { in: participantIds }, orgId: user.orgId },
    select: { id: true },
  })
  if (members.length !== participantIds.length) throw new Error('Invalid participants')

  // Re-check overlap for all participants (atomic guard)
  for (const memberId of participantIds) {
    const conflicts = await db.calendarEvent.findFirst({
      where: {
        workspaceId,
        OR: [{ createdBy: memberId }, { assignedTo: memberId }],
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
      select: { id: true },
    })
    if (conflicts) throw new Error(`Scheduling conflict for participant ${memberId}`)
  }

  const event = await db.calendarEvent.create({
    data: {
      workspaceId,
      title: input.title.trim(),
      type: 'meeting',
      startsAt,
      endsAt,
      description: input.description?.trim() || null,
      location: input.location?.trim() || null,
      createdBy: user.id,
      assignedTo: user.id,
      visibility: input.visibility ?? 'TEAM',
      participants: {
        create: participantIds.map((uid) => ({
          userId: uid,
          role: uid === user.id ? 'ORGANIZER' : 'ATTENDEE',
          status: uid === user.id ? 'ACCEPTED' : 'PENDING',
        })),
      },
    },
  })

  revalidatePath(`/workspace/${workspaceId}/calendar`)
  return event
}

// ─── Eliminación explícita y transaccional de datos de disponibilidad ────────
//
// POLÍTICA DE RETENCIÓN APROBADA:
//   Las FKs availability_settings→users, availability_settings→workspaces,
//   booking_pages→availability_settings y booking_requests→booking_pages usan
//   ON DELETE RESTRICT. Esto impide borrados accidentales desde cualquier flujo
//   normal de la UI.
//
//   Esta función es la ÚNICA vía para eliminar estos datos. Nunca debe ser
//   invocada desde la UI de configuración normal. Solo debe llamarse desde:
//     - La acción de cierre/eliminación de cuenta (account deletion flow).
//     - La acción de eliminación explícita de workspace (por owner o admin).
//
//   El flujo transaccional es:
//     1. Marcar BookingPage como inactiva (deja de aceptar nuevas reservas).
//     2. Cancelar las BookingRequest confirmadas futuras (startsAt > now).
//     3. Capturar los eventIds de las reservas que se van a borrar.
//     4. Borrar las reservas salvo las CONFIRMED con endsAt <= now.
//     5. Borrar solo los CalendarEvents vinculados a las reservas borradas.
//     6. Si quedan reservas históricas, conservar BookingPage inactiva y
//        AvailabilitySettings: ambas relaciones son obligatorias y RESTRICT.
//        En caso contrario, borrar BookingPage y AvailabilitySettings.
//   El borrado del usuario o workspace queda a cargo del flujo que invoca esta función.
//
//   Las reservas pasadas confirmadas (endsAt <= now) y sus eventos se conservan
//   con sus vínculos intactos. retainedPast indica cuántas reservas se conservan.
//   Si la política de conservación cambia, añadir aquí el archivado o anonimización.

export async function deleteAvailabilityData(
  workspaceId: string,
  hostUserId: string,
): Promise<{ cancelledFuture: number; deletedTotal: number; retainedPast: number }> {
  const { user } = await requireWorkspace(workspaceId)
  if (!isAdminOrAbove(user.role) && user.id !== hostUserId) {
    throw new Error('Unauthorized: only admins or the account owner can delete availability data')
  }

  // La lectura inicial ocurre dentro de la transacción para evitar la race condition
  // entre el findUnique y los DELETEs: si otra petición crea BookingPage justo en
  // ese intervalo, la transacción opera sobre datos frescos y consistentes.
  const result = await db.$transaction(async (tx) => {
    const settings = await tx.availabilitySettings.findUnique({
      where: { userId_workspaceId: { userId: hostUserId, workspaceId } },
      select: { id: true, bookingPage: { select: { id: true } } },
    })
    if (!settings) return { cancelledFuture: 0, deletedTotal: 0, retainedPast: 0 }

    const now = new Date()
    let cancelledFuture = 0
    let deletedTotal = 0
    let retainedPast = 0

    if (settings.bookingPage) {
      const pageId = settings.bookingPage.id

      // 1. Marcar la página como inactiva
      await tx.bookingPage.update({
        where: { id: pageId },
        data: { active: false },
      })

      // 2. Cancelar reservas futuras
      const { count } = await tx.bookingRequest.updateMany({
        where: { bookingPageId: pageId, status: 'CONFIRMED', startsAt: { gt: now } },
        data: { status: 'CANCELLED' },
      })
      cancelledFuture = count

      const bookingsToDelete = {
        bookingPageId: pageId,
        NOT: { status: 'CONFIRMED' as const, endsAt: { lte: now } },
      }

      // 3. Capturar solo los eventIds de las reservas que se van a borrar
      const bookingsWithEvents = await tx.bookingRequest.findMany({
        where: { ...bookingsToDelete, eventId: { not: null } },
        select: { eventId: true },
      })
      const eventIds = bookingsWithEvents.map((b) => b.eventId as string)

      // 4. Conservar las reservas pasadas confirmadas y borrar el resto
      const del = await tx.bookingRequest.deleteMany({ where: bookingsToDelete })
      deletedTotal = del.count

      // 5. Borrar CalendarEvents de booking (EventParticipant se borra por cascade)
      if (eventIds.length > 0) {
        await tx.calendarEvent.deleteMany({
          where: { id: { in: eventIds }, workspaceId },
        })
      }

      // 6. Las reservas históricas requieren conservar la página y su configuración
      retainedPast = await tx.bookingRequest.count({
        where: { bookingPageId: pageId, status: 'CONFIRMED', endsAt: { lte: now } },
      })
      if (retainedPast === 0) {
        await tx.bookingPage.delete({ where: { id: pageId } })
      }
    }

    // 7. Borrar AvailabilitySettings solo si no sostiene reservas históricas
    if (retainedPast === 0) {
      await tx.availabilitySettings.delete({
        where: { userId_workspaceId: { userId: hostUserId, workspaceId } },
      })
    }

    return { cancelledFuture, deletedTotal, retainedPast }
  })

  // revalidatePath fuera de la transacción — solo se ejecuta tras commit exitoso
  revalidatePath(`/workspace/${workspaceId}/calendar`)
  return result
}

// ─── Workspace members list (for team pickers) ────────────────────────────

export async function getWorkspaceMembers(workspaceId: string) {
  const { user } = await requireWorkspace(workspaceId)
  return db.user.findMany({
    where: { orgId: user.orgId },
    select: { id: true, name: true, email: true, avatarUrl: true, jobTitle: true },
    orderBy: { name: 'asc' },
  })
}
