'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { logActivity } from './activity'

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
  rawText: string
}

export interface ClientShareData {
  id:            string
  token:         string
  recipientEmail: string
  recipientName: string | null
  viewedAt:      string | null
  createdAt:     string
}

export async function getDocumentShares(
  docId: string,
  workspaceId: string,
): Promise<ClientShareData[]> {
  const shares = await db.clientShare.findMany({
    where:   { documentId: docId, workspaceId },
    orderBy: { createdAt: 'desc' },
    select: {
      id:             true,
      token:          true,
      recipientEmail: true,
      recipientName:  true,
      viewedAt:       true,
      createdAt:      true,
    },
  })
  return shares.map((s) => ({
    id:             s.id,
    token:          s.token,
    recipientEmail: s.recipientEmail,
    recipientName:  s.recipientName,
    viewedAt:       s.viewedAt?.toISOString() ?? null,
    createdAt:      s.createdAt.toISOString(),
  }))
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
      rawText:   true,
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
    rawText:      doc.rawText,
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
  const user = await getAuthUser()
  await db.document.updateMany({
    where: { id: docId, workspaceId },
    data:  { title: data.title.trim(), category: data.category || null },
  })
  await logActivity(workspaceId, 'document', docId, user.id, 'title_changed', { title: data.title ?? '' })
  revalidatePath(`/workspace/${workspaceId}/docs`)
  revalidatePath(`/workspace/${workspaceId}/docs/${docId}`)
}

export async function updateDocumentContent(
  docId: string,
  workspaceId: string,
  data: { content: string; rawText: string },
): Promise<void> {
  const user = await getAuthUser()
  const wordCount = data.rawText.trim().split(/\s+/).filter(Boolean).length
  await db.document.updateMany({
    where: { id: docId, workspaceId },
    data:  { content: data.content, rawText: data.rawText, wordCount },
  })
  await logActivity(workspaceId, 'document', docId, user.id, 'edited')
  revalidatePath(`/workspace/${workspaceId}/docs`)
  revalidatePath(`/workspace/${workspaceId}/docs/${docId}`)
}

export async function sendDocumentToClient(
  docId: string,
  workspaceId: string,
  recipientEmail: string,
  recipientName: string | null,
  note: string | null,
): Promise<{ success: true } | { error: string }> {
  const user = await getAuthUser()

  const [doc, workspace] = await Promise.all([
    db.document.findFirst({ where: { id: docId, workspaceId } }),
    db.workspace.findFirst({
      where:  { id: workspaceId, orgId: user.orgId },
      select: { name: true },
    }),
  ])

  if (!doc)       return { error: 'Documento no encontrado.' }
  if (!workspace) return { error: 'Workspace no encontrado.' }

  // Crear ClientShare para el portal público
  const share = await db.clientShare.create({
    data: {
      documentId:    docId,
      workspaceId,
      recipientEmail,
      recipientName: recipientName || null,
      note:          note || null,
    },
  })

  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mitikus.com'
  const portalUrl = `${appUrl}/c/${share.token}`

  const { sendDocumentEmail } = await import('@/lib/email')
  await sendDocumentEmail({
    to:            recipientEmail,
    recipientName,
    senderName:    user.name,
    workspaceName: workspace.name,
    docTitle:      doc.title,
    rawText:       doc.rawText,
    note,
    portalUrl,
  })

  await logActivity(workspaceId, 'document', docId, user.id, 'sent_to_client', {
    recipientEmail,
    shareToken: share.token,
  })

  return { success: true }
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
  await logActivity(workspaceId, 'document', doc.id, user.id, 'created')
  revalidatePath(`/workspace/${workspaceId}/docs`)
  return doc.id
}
