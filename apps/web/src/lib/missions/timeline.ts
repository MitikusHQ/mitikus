/**
 * Mission Timeline (MISSION-002, versión simple) — 4 eventos:
 * created | started | paused | completed.
 */

import { db } from '@/lib/db'
import type { MissionTimelineEventData, TimelineEventType } from './types'

function mapEvent(row: {
  id: string
  objectiveId: string
  workspaceId: string
  event: string
  note: string | null
  createdAt: Date
}): MissionTimelineEventData {
  return {
    id:          row.id,
    objectiveId: row.objectiveId,
    workspaceId: row.workspaceId,
    event:       row.event as TimelineEventType,
    note:        row.note,
    createdAt:   row.createdAt.toISOString(),
  }
}

export async function logTimelineEvent(
  objectiveId: string,
  workspaceId: string,
  event: TimelineEventType,
  note?: string,
): Promise<void> {
  // Evita duplicar el mismo evento consecutivo (ej. varios "started" seguidos)
  const last = await db.missionTimelineEvent.findFirst({
    where:   { objectiveId, workspaceId },
    orderBy: { createdAt: 'desc' },
  })
  if (last?.event === event) return

  await db.missionTimelineEvent.create({
    data: { objectiveId, workspaceId, event, note: note ?? null },
  })
}

export async function getTimeline(
  objectiveId: string,
  workspaceId: string,
): Promise<MissionTimelineEventData[]> {
  const rows = await db.missionTimelineEvent.findMany({
    where:   { objectiveId, workspaceId },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map(mapEvent)
}
