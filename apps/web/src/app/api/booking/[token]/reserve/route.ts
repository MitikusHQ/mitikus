import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'

// Public route — no Clerk auth required
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  // Strict rate limit for booking: 5 attempts per 5 minutes per IP
  const limited = await rateLimit(req, 'booking:reserve', 5, 300)
  if (limited) return limited

  // Resolve page
  const page = await db.bookingPage.findUnique({
    where: { token },
    select: {
      id: true,
      active: true,
      availability: {
        select: {
          userId: true,
          workspaceId: true,
          slotDuration: true,
          publicEnabled: true,
          bufferMinutes: true,
        },
      },
    },
  })

  if (!page || !page.active || !page.availability.publicEnabled) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { guestName, guestEmail, guestNote, startsAt: startsAtRaw } = body as Record<string, unknown>

  // Server-side validation
  if (typeof guestName !== 'string' || !guestName.trim() || guestName.length > 100) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 422 })
  }
  if (typeof guestEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 422 })
  }
  if (guestNote !== undefined && (typeof guestNote !== 'string' || guestNote.length > 500)) {
    return NextResponse.json({ error: 'Note too long' }, { status: 422 })
  }
  if (typeof startsAtRaw !== 'string') {
    return NextResponse.json({ error: 'Invalid start time' }, { status: 422 })
  }

  const startsAt = new Date(startsAtRaw)
  if (isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: 'Invalid start time' }, { status: 422 })
  }
  if (startsAt < new Date()) {
    return NextResponse.json({ error: 'Slot is in the past' }, { status: 422 })
  }

  const endsAt = new Date(startsAt.getTime() + page.availability.slotDuration * 60_000)

  const { userId, workspaceId } = page.availability

  // Atomic conflict check + create
  // We use a Prisma transaction to re-verify availability before inserting
  try {
    const result = await db.$transaction(async (tx) => {
      // Check no existing CalendarEvent overlaps
      const conflict = await tx.calendarEvent.findFirst({
        where: {
          workspaceId,
          OR: [{ createdBy: userId }, { assignedTo: userId }],
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
        select: { id: true },
      })
      if (conflict) throw new Error('SLOT_TAKEN')

      // Check no existing confirmed booking overlaps
      const bookingConflict = await tx.bookingRequest.findFirst({
        where: {
          bookingPageId: page.id,
          status: 'CONFIRMED',
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
        select: { id: true },
      })
      if (bookingConflict) throw new Error('SLOT_TAKEN')

      // Create the CalendarEvent for the host
      const event = await tx.calendarEvent.create({
        data: {
          workspaceId,
          title: `Reserva: ${guestName.trim()}`,
          type: 'meeting',
          startsAt,
          endsAt,
          createdBy: userId,
          assignedTo: userId,
          visibility: 'PRIVATE', // external bookings are private
          participants: {
            create: {
              guestName: guestName.trim(),
              guestEmail: guestEmail.toLowerCase().trim(),
              role: 'ATTENDEE',
              status: 'ACCEPTED',
            },
          },
        },
      })

      // Create the BookingRequest record
      const cancelToken = randomBytes(24).toString('base64url')
      const booking = await tx.bookingRequest.create({
        data: {
          bookingPageId: page.id,
          eventId: event.id,
          guestName: guestName.trim(),
          guestEmail: guestEmail.toLowerCase().trim(),
          guestNote: typeof guestNote === 'string' ? guestNote.trim() || null : null,
          startsAt,
          endsAt,
          status: 'CONFIRMED',
          cancelToken,
        },
      })

      return { bookingId: booking.id, startsAt: booking.startsAt, endsAt: booking.endsAt }
    })

    return NextResponse.json({
      ok: true,
      startsAt: result.startsAt,
      endsAt: result.endsAt,
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'SLOT_TAKEN') {
      return NextResponse.json({ error: 'slot_taken' }, { status: 409 })
    }
    console.error('[booking:reserve]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
