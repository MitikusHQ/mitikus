import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkCronAuth } from '@/lib/cron-auth'
import { sendCalendarReminderPush } from '@/lib/web-push'

export async function GET(request: NextRequest) {
  const unauthorized = checkCronAuth(request)
  if (unauthorized) return unauthorized

  const now = new Date()
  const horizon = new Date(now.getTime() + 60 * 60_000)

  const events = await db.calendarEvent.findMany({
    where: {
      startsAt: { gte: now, lte: horizon },
      reminderSentAt: null,
      OR: [
        { assignedTo: { not: null } },
        { createdBy: { not: '' } },
      ],
    },
    select: {
      id: true,
      createdBy: true,
      assignedTo: true,
      startsAt: true,
      reminderMinutes: true,
    },
    take: 100,
  })

  let sent = 0
  const dueEvents = events.filter((event) => {
    const notifyAt = new Date(event.startsAt.getTime() - event.reminderMinutes * 60_000)
    return notifyAt <= now
  })

  for (const event of dueEvents) {
    const targetUserId = event.assignedTo ?? event.createdBy
    const result = await sendCalendarReminderPush(targetUserId)
    sent += result.sent
    await db.calendarEvent.update({
      where: { id: event.id },
      data: { reminderSentAt: now },
    })
  }

  return NextResponse.json({ ok: true, checked: events.length, due: dueEvents.length, sent })
}
