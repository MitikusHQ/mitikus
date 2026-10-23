import 'server-only'

import type { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

async function _cleanupAvailability(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  hostUserId: string,
) {
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
}

// Trusted server callers supply the workspace and internal user ID.
export async function deleteAvailabilityDataForWorkspace(
  workspaceId: string,
  hostUserId: string,
) {
  return db.$transaction((tx) => _cleanupAvailability(tx, workspaceId, hostUserId))
}

export async function deleteAvailabilityDataForUser(userId: string): Promise<void> {
  const settings = await db.availabilitySettings.findMany({
    where: { userId },
    select: { workspaceId: true },
  })

  for (const { workspaceId } of settings) {
    await deleteAvailabilityDataForWorkspace(workspaceId, userId)
    revalidatePath(`/workspace/${workspaceId}/calendar`)
  }
}
