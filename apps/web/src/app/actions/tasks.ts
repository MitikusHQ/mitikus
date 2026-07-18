'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { sendTagNotificationEmail } from '@/lib/email'
import { randomBytes } from 'crypto'

// ── Tipos exportados ──────────────────────────────────────────

export interface TaskTag {
  userId: string
  userName: string | null
  userEmail: string
}

export interface TaskData {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  objectiveId: string | null
  objectiveLabel: string | null
  clientId: string | null
  clientName: string | null
  shareToken: string | null
  createdBy: string
  createdByName: string | null
  createdAt: string
  tags: TaskTag[]
}

export interface NotificationData {
  id: string
  type: string
  taskId: string
  taskTitle: string
  message: string
  readAt: string | null
  createdAt: string
}

export interface TaskFormOptions {
  members: { id: string; name: string | null; email: string }[]
  objectives: { id: string; label: string }[]
  clients: { id: string; name: string }[]
}

// ── Auth helper ───────────────────────────────────────────────

async function getAuthUserId(): Promise<string> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('No autenticado')
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) throw new Error('Usuario no encontrado')
  return user.id
}

// ── Serialización ─────────────────────────────────────────────

function serializeTask(task: {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: Date | null
  objectiveId: string | null
  clientId: string | null
  shareToken: string | null
  createdBy: string
  createdAt: Date
  creator: { name: string | null }
  objective: { label: string } | null
  client: { name: string } | null
  tags: { userId: string; user: { name: string | null; email: string } }[]
}): TaskData {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate?.toISOString() ?? null,
    objectiveId: task.objectiveId,
    objectiveLabel: task.objective?.label ?? null,
    clientId: task.clientId,
    clientName: task.client?.name ?? null,
    shareToken: task.shareToken,
    createdBy: task.createdBy,
    createdByName: task.creator.name,
    createdAt: task.createdAt.toISOString(),
    tags: task.tags.map((t) => ({
      userId: t.userId,
      userName: t.user.name,
      userEmail: t.user.email,
    })),
  }
}

const taskInclude = {
  creator: { select: { name: true } },
  objective: { select: { label: true } },
  client: { select: { name: true } },
  tags: { include: { user: { select: { name: true, email: true } } } },
} as const

// ── Lectura ───────────────────────────────────────────────────

export async function getTasks(
  workspaceId: string,
  userId: string,
  filters: {
    status?: string
    mine?: boolean
    priority?: string
    clientId?: string
    objectiveId?: string
  } = {}
): Promise<TaskData[]> {
  const where: Record<string, unknown> = { workspaceId }

  if (filters.status && filters.status !== 'all') {
    where.status = filters.status.toUpperCase()
  }
  if (filters.priority) {
    where.priority = filters.priority.toUpperCase()
  }
  if (filters.clientId) {
    where.clientId = filters.clientId
  }
  if (filters.objectiveId) {
    where.objectiveId = filters.objectiveId
  }
  if (filters.mine) {
    where.OR = [
      { createdBy: userId },
      { tags: { some: { userId } } },
    ]
  }

  const tasks = await db.task.findMany({
    where,
    include: taskInclude,
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
  })

  return tasks.map(serializeTask)
}

export async function getMyPendingTaskCount(workspaceId: string, userId: string): Promise<number> {
  return db.task.count({
    where: {
      workspaceId,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      OR: [{ createdBy: userId }, { tags: { some: { userId } } }],
    },
  })
}

export async function getTask(taskId: string, workspaceId: string): Promise<TaskData | null> {
  const task = await db.task.findFirst({
    where: { id: taskId, workspaceId },
    include: taskInclude,
  })
  return task ? serializeTask(task) : null
}

export async function getTaskFormOptions(workspaceId: string): Promise<TaskFormOptions> {
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { orgId: true },
  })
  if (!workspace) throw new Error('Workspace no encontrado')

  const [members, objectives, clients] = await Promise.all([
    db.user.findMany({
      where: { orgId: workspace.orgId },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
    db.companyObjective.findMany({
      where: { workspaceId, status: 'active' },
      select: { id: true, label: true },
      orderBy: { label: 'asc' },
    }),
    db.client.findMany({
      where: { workspaceId, isArchived: false },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return { members, objectives, clients }
}

export async function getNotifications(workspaceId: string): Promise<NotificationData[]> {
  const userId = await getAuthUserId()
  const notifications = await db.notification.findMany({
    where: { userId, task: { workspaceId } },
    include: { task: { select: { title: true } } },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  return notifications.map((n) => ({
    id: n.id,
    type: n.type,
    taskId: n.taskId,
    taskTitle: n.task.title,
    message: n.message,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  }))
}

export async function getUnreadCount(workspaceId: string): Promise<number> {
  const userId = await getAuthUserId()
  return db.notification.count({
    where: { userId, readAt: null, task: { workspaceId } },
  })
}

// ── Mutaciones ────────────────────────────────────────────────

export async function createTask(
  workspaceId: string,
  data: {
    title: string
    description?: string
    status?: string
    priority?: string
    dueDate?: string | null
    objectiveId?: string | null
    clientId?: string | null
    tagUserIds?: string[]
  }
): Promise<TaskData> {
  const userId = await getAuthUserId()

  const task = await db.task.create({
    data: {
      workspaceId,
      title: data.title,
      description: data.description ?? null,
      status: (data.status as 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED') ?? 'PENDING',
      priority: (data.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') ?? 'MEDIUM',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      objectiveId: data.objectiveId ?? null,
      clientId: data.clientId ?? null,
      createdBy: userId,
    },
    include: taskInclude,
  })

  if (data.tagUserIds?.length) {
    await tagUsersOnTask(task.id, workspaceId, userId, data.tagUserIds)
  }

  const result = await db.task.findUnique({ where: { id: task.id }, include: taskInclude })
  revalidatePath(`/workspace/${workspaceId}/tasks`)
  revalidatePath(`/workspace/${workspaceId}/today`)
  return serializeTask(result!)
}

export async function updateTask(
  taskId: string,
  workspaceId: string,
  data: {
    title?: string
    description?: string | null
    status?: string
    priority?: string
    dueDate?: string | null
    objectiveId?: string | null
    clientId?: string | null
  }
): Promise<TaskData> {
  await getAuthUserId()

  const existing = await db.task.findFirst({ where: { id: taskId, workspaceId } })
  if (!existing) throw new Error('Tarea no encontrada')

  const updated = await db.task.update({
    where: { id: taskId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status as 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' }),
      ...(data.priority !== undefined && { priority: data.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }),
      ...('dueDate' in data && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      ...('objectiveId' in data && { objectiveId: data.objectiveId ?? null }),
      ...('clientId' in data && { clientId: data.clientId ?? null }),
    },
    include: taskInclude,
  })

  revalidatePath(`/workspace/${workspaceId}/tasks`)
  revalidatePath(`/workspace/${workspaceId}/today`)
  return serializeTask(updated)
}

export async function deleteTask(taskId: string, workspaceId: string): Promise<void> {
  const userId = await getAuthUserId()

  const task = await db.task.findFirst({
    where: { id: taskId, workspaceId },
    select: { createdBy: true },
  })
  if (!task) throw new Error('Tarea no encontrada')

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER'
  if (task.createdBy !== userId && !isAdmin) throw new Error('Sin permiso para eliminar esta tarea')

  await db.task.delete({ where: { id: taskId } })
  revalidatePath(`/workspace/${workspaceId}/tasks`)
  revalidatePath(`/workspace/${workspaceId}/today`)
}

export async function tagUser(taskId: string, workspaceId: string, targetUserId: string): Promise<void> {
  const userId = await getAuthUserId()
  await tagUsersOnTask(taskId, workspaceId, userId, [targetUserId])
  revalidatePath(`/workspace/${workspaceId}/tasks`)
}

export async function untagUser(taskId: string, workspaceId: string, targetUserId: string): Promise<void> {
  await getAuthUserId()
  const task = await db.task.findFirst({ where: { id: taskId, workspaceId } })
  if (!task) throw new Error('Tarea no encontrada')

  await db.taskTag.deleteMany({ where: { taskId, userId: targetUserId } })
  revalidatePath(`/workspace/${workspaceId}/tasks`)
}

async function tagUsersOnTask(
  taskId: string,
  workspaceId: string,
  taggerId: string,
  userIds: string[]
): Promise<void> {
  const task = await db.task.findFirst({
    where: { id: taskId, workspaceId },
    select: { title: true },
  })
  if (!task) throw new Error('Tarea no encontrada')

  const tagger = await db.user.findUnique({
    where: { id: taggerId },
    select: { name: true, email: true },
  })

  for (const targetUserId of userIds) {
    if (targetUserId === taggerId) continue

    await db.taskTag.upsert({
      where: { taskId_userId: { taskId, userId: targetUserId } },
      create: { taskId, userId: targetUserId, taggedBy: taggerId },
      update: {},
    })

    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: { email: true, name: true },
    })
    if (!targetUser) continue

    await db.notification.create({
      data: {
        userId: targetUserId,
        type: 'tagged',
        taskId,
        message: `${tagger?.name ?? tagger?.email ?? 'Alguien'} te ha etiquetado en: ${task.title}`,
      },
    })

    const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL}/workspace/${workspaceId}/tasks?task=${taskId}`
    sendTagNotificationEmail({
      to: targetUser.email,
      taggerName: tagger?.name ?? tagger?.email ?? 'Un compañero',
      taskTitle: task.title,
      taskUrl,
    }).catch(console.error)
  }
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const userId = await getAuthUserId()
  await db.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  })
}

export async function markAllNotificationsRead(workspaceId: string): Promise<void> {
  const userId = await getAuthUserId()
  await db.notification.updateMany({
    where: { userId, readAt: null, task: { workspaceId } },
    data: { readAt: new Date() },
  })
}

export async function generateShareToken(taskId: string, workspaceId: string): Promise<string> {
  await getAuthUserId()
  const task = await db.task.findFirst({ where: { id: taskId, workspaceId } })
  if (!task) throw new Error('Tarea no encontrada')

  if (task.shareToken) return task.shareToken

  const token = randomBytes(16).toString('hex')
  await db.task.update({ where: { id: taskId }, data: { shareToken: token } })
  return token
}

export async function getMyTasks(workspaceId: string, userId: string): Promise<TaskData[]> {
  const tasks = await db.task.findMany({
    where: {
      workspaceId,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      OR: [{ createdBy: userId }, { tags: { some: { userId } } }],
    },
    include: taskInclude,
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    take: 5,
  })
  return tasks.map(serializeTask)
}
