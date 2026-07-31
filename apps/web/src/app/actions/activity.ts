'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import type { ResourceType } from './comments'

export interface ActivityData {
  id:         string
  userId:     string
  userName:   string
  action:     string
  metadata:   Record<string, string>
  createdAt:  string
}

async function getAuthUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('User not found')
  return user
}

export async function getActivity(
  workspaceId: string,
  resourceType: ResourceType,
  resourceId: string
): Promise<ActivityData[]> {
  await getAuthUser()
  const rows = await db.resourceActivity.findMany({
    where:   { workspaceId, resourceType, resourceId },
    orderBy: { createdAt: 'desc' },
    take:    50,
    include: { user: { select: { name: true } } },
  })
  return rows.map((r) => ({
    id:        r.id,
    userId:    r.userId,
    userName:  r.user.name ?? 'Usuario',
    action:    r.action,
    metadata:  JSON.parse(r.metadata) as Record<string, string>,
    createdAt: r.createdAt.toISOString(),
  }))
}

export async function logActivity(
  workspaceId: string,
  resourceType: ResourceType,
  resourceId: string,
  userId: string,
  action: string,
  metadata: Record<string, string> = {}
): Promise<void> {
  await db.resourceActivity.create({
    data: {
      workspaceId,
      resourceType,
      resourceId,
      userId,
      action,
      metadata: JSON.stringify(metadata),
    },
  })
}
