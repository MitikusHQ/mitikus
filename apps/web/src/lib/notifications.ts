import { db } from '@/lib/db'

export interface CreateNotificationInput {
  userId: string
  type: string
  message: string
  link?: string
  workspaceId?: string
  taskId?: string
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  await db.notification.create({
    data: {
      userId:      input.userId,
      type:        input.type,
      message:     input.message,
      link:        input.link ?? null,
      workspaceId: input.workspaceId ?? null,
      taskId:      input.taskId ?? null,
    },
  })
}

// Notificar a todos los miembros de una org excepto al autor
export async function notifyOrgMembers(
  orgId: string,
  excludeUserId: string,
  input: Omit<CreateNotificationInput, 'userId'>,
): Promise<void> {
  const members = await db.user.findMany({
    where: { orgId, id: { not: excludeUserId } },
    select: { id: true },
  })
  if (members.length === 0) return
  await db.notification.createMany({
    data: members.map((m) => ({
      userId:      m.id,
      type:        input.type,
      message:     input.message,
      link:        input.link ?? null,
      workspaceId: input.workspaceId ?? null,
      taskId:      input.taskId ?? null,
    })),
  })
}
