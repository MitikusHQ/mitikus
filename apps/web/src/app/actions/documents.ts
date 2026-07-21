'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export interface DocumentData {
  id:           string
  title:        string
  category:     string | null
  wordCount:    number
  createdAt:    string
  uploaderName: string | null
}

export interface DocumentDetail extends DocumentData {
  content: string
}

async function getAuthUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('User not found')
  return user
}

export async function getDocuments(
  workspaceId: string,
  _userId: string,
): Promise<DocumentData[]> {
  const docs = await db.document.findMany({
    where:   { workspaceId },
    orderBy: { createdAt: 'desc' },
    select: {
      id:        true,
      title:     true,
      category:  true,
      wordCount: true,
      createdAt: true,
      uploader:  { select: { name: true } },
    },
  })

  return docs.map((d) => ({
    id:           d.id,
    title:        d.title,
    category:     d.category,
    wordCount:    d.wordCount,
    createdAt:    d.createdAt.toISOString(),
    uploaderName: d.uploader.name,
  }))
}

export async function getDocument(
  docId: string,
  workspaceId: string,
): Promise<DocumentDetail | null> {
  const doc = await db.document.findFirst({
    where:  { id: docId, workspaceId },
    select: {
      id:        true,
      title:     true,
      category:  true,
      wordCount: true,
      content:   true,
      createdAt: true,
      uploader:  { select: { name: true } },
    },
  })

  if (!doc) return null

  return {
    id:           doc.id,
    title:        doc.title,
    category:     doc.category,
    wordCount:    doc.wordCount,
    content:      doc.content,
    createdAt:    doc.createdAt.toISOString(),
    uploaderName: doc.uploader.name,
  }
}

export async function deleteDocument(
  docId: string,
  workspaceId: string,
): Promise<void> {
  await getAuthUser()
  await db.document.deleteMany({ where: { id: docId, workspaceId } })
  revalidatePath(`/workspace/${workspaceId}/docs`)
}

export async function updateDocument(
  docId: string,
  workspaceId: string,
  data: { title: string; category: string | null },
): Promise<void> {
  await getAuthUser()
  await db.document.updateMany({
    where: { id: docId, workspaceId },
    data:  { title: data.title.trim(), category: data.category || null },
  })
  revalidatePath(`/workspace/${workspaceId}/docs`)
  revalidatePath(`/workspace/${workspaceId}/docs/${docId}`)
}

export async function updateDocumentContent(
  docId: string,
  workspaceId: string,
  data: { content: string; rawText: string },
): Promise<void> {
  await getAuthUser()
  const wordCount = data.rawText.trim().split(/\s+/).filter(Boolean).length
  await db.document.updateMany({
    where: { id: docId, workspaceId },
    data:  { content: data.content, rawText: data.rawText, wordCount },
  })
  revalidatePath(`/workspace/${workspaceId}/docs`)
  revalidatePath(`/workspace/${workspaceId}/docs/${docId}`)
}

export async function createDocument(
  workspaceId: string,
  data: { title: string; content: string; rawText: string },
): Promise<string> {
  const user = await getAuthUser()
  const wordCount = data.rawText.trim().split(/\s+/).filter(Boolean).length
  const doc = await db.document.create({
    data: {
      workspaceId,
      title:      data.title.trim() || 'Sin título',
      content:    data.content,
      rawText:    data.rawText,
      wordCount,
      uploadedBy: user.id,
    },
  })
  revalidatePath(`/workspace/${workspaceId}/docs`)
  return doc.id
}
