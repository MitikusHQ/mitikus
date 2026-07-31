'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export type ResourceType = 'document' | 'contract' | 'notebook' | 'presentation' | 'pdf'

export interface CommentData {
  id:         string
  content:    string
  authorId:   string
  authorName: string
  parentId:   string | null
  createdAt:  string
  replies:    CommentData[]
}

async function getAuthUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('User not found')
  return user
}

export async function getComments(
  workspaceId: string,
  resourceType: ResourceType,
  resourceId: string
): Promise<CommentData[]> {
  await getAuthUser()
  const rows = await db.comment.findMany({
    where:   { workspaceId, resourceType, resourceId, parentId: null },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { name: true } },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { name: true } } },
      },
    },
  })
  return rows.map(mapComment)
}

function mapComment(r: {
  id: string; content: string; authorId: string; parentId: string | null; createdAt: Date
  author: { name: string | null }
  replies?: Array<{ id: string; content: string; authorId: string; parentId: string | null; createdAt: Date; author: { name: string | null }; replies?: never[] }>
}): CommentData {
  return {
    id:         r.id,
    content:    r.content,
    authorId:   r.authorId,
    authorName: r.author.name ?? 'Usuario',
    parentId:   r.parentId,
    createdAt:  r.createdAt.toISOString(),
    replies:    (r.replies ?? []).map((rep) => mapComment({ ...rep, replies: [] })),
  }
}

export async function addComment(
  workspaceId: string,
  resourceType: ResourceType,
  resourceId: string,
  content: string,
  parentId?: string
): Promise<CommentData> {
  const user = await getAuthUser()

  const comment = await db.comment.create({
    data: {
      workspaceId,
      resourceType,
      resourceId,
      authorId: user.id,
      content,
      parentId: parentId ?? null,
    },
    include: {
      author: { select: { name: true } },
      replies: { include: { author: { select: { name: true } } } },
    },
  })

  // Procesar @menciones
  const mentions = content.match(/@([\w\s]+?)(?=\s|$|[,.])/g)
  if (mentions) {
    const names = mentions.map((m) => m.slice(1).trim())
    const ws = await db.workspace.findUnique({ where: { id: workspaceId }, select: { orgId: true } })
    const mentionedUsers = ws
      ? await db.user.findMany({
          where: { orgId: ws.orgId, name: { in: names } },
          select: { id: true, email: true, name: true },
        })
      : []
    if (mentionedUsers.length > 0) {
      const { sendMentionEmail } = await import('@/lib/email')
      const resourceUrl = buildResourceUrl(workspaceId, resourceType, resourceId)
      await Promise.all(
        mentionedUsers.map((u) =>
          sendMentionEmail({
            to:           u.email,
            mentionedName: u.name ?? 'Usuario',
            authorName:   user.name ?? 'Un compañero',
            content,
            resourceUrl,
            resourceType,
          })
        )
      )
    }
  }

  revalidatePath(`/workspace/${workspaceId}`)
  return mapComment(comment)
}

export async function deleteComment(commentId: string): Promise<void> {
  const user = await getAuthUser()
  await db.comment.deleteMany({ where: { id: commentId, authorId: user.id } })
}

export async function getCommentCount(
  workspaceId: string,
  resourceType: ResourceType,
  resourceId: string
): Promise<number> {
  await getAuthUser()
  return db.comment.count({ where: { workspaceId, resourceType, resourceId } })
}

function buildResourceUrl(workspaceId: string, resourceType: ResourceType, resourceId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mitikus.com'
  const paths: Record<ResourceType, string> = {
    document:     `docs/${resourceId}`,
    contract:     `contracts/${resourceId}`,
    notebook:     `notebooks/${resourceId}`,
    presentation: `presentations/${resourceId}`,
    pdf:          `pdfs/${resourceId}`,
  }
  return `${base}/workspace/${workspaceId}/${paths[resourceType]}`
}
