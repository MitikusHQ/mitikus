'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { extractDocHtml, extractPdf, extractUrl, checkLimit, CHAR_LIMIT } from '@/lib/notebook-extract'

export interface NotebookData {
  id:          string
  title:       string
  sourceCount: number
  createdAt:   string
}

export interface NotebookSourceData {
  id:        string
  type:      string
  title:     string
  charCount: number
  docId:     string | null
  pdfId:     string | null
  url:       string | null
  createdAt: string
}

export interface NotebookMessageData {
  id:        string
  role:      string
  content:   string
  createdAt: string
}

export interface SynthesisCache {
  summary:            string
  keyPoints:          string[]
  suggestedQuestions: string[]
}

export interface NotebookDetail {
  id:             string
  title:          string
  synthesisCache: SynthesisCache | null
  synthesisDirty: boolean
  totalChars:     number
  sources:        NotebookSourceData[]
  messages:       NotebookMessageData[]
}

export interface AddSourceInput {
  type:   'doc' | 'pdf' | 'text' | 'url'
  docId?: string
  pdfId?: string
  text?:  string
  title?: string
  url?:   string
}

async function getAuthUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('User not found')
  return user
}

export async function getNotebooks(workspaceId: string): Promise<NotebookData[]> {
  await getAuthUser()
  const rows = await db.notebook.findMany({
    where:   { workspaceId },
    orderBy: { createdAt: 'desc' },
    select: {
      id:        true,
      title:     true,
      createdAt: true,
      _count:    { select: { sources: true } },
    },
  })
  return rows.map((r) => ({
    id:          r.id,
    title:       r.title,
    sourceCount: r._count.sources,
    createdAt:   r.createdAt.toISOString(),
  }))
}

export async function getNotebook(workspaceId: string, notebookId: string): Promise<NotebookDetail> {
  await getAuthUser()
  const n = await db.notebook.findFirst({
    where:   { id: notebookId, workspaceId },
    include: {
      sources:  { orderBy: { createdAt: 'asc' } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!n) throw new Error('Notebook not found')

  const totalChars = n.sources.reduce((acc, s) => acc + s.charCount, 0)

  let parsedCache: SynthesisCache | null = null
  if (n.synthesisCache) {
    try { parsedCache = JSON.parse(n.synthesisCache) } catch {}
  }

  return {
    id:             n.id,
    title:          n.title,
    synthesisCache: parsedCache,
    synthesisDirty: n.synthesisDirty,
    totalChars,
    sources:        n.sources.map((s) => ({
      id:        s.id,
      type:      s.type,
      title:     s.title,
      charCount: s.charCount,
      docId:     s.docId,
      pdfId:     s.pdfId,
      url:       s.url,
      createdAt: s.createdAt.toISOString(),
    })),
    messages: n.messages.map((m) => ({
      id:        m.id,
      role:      m.role,
      content:   m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  }
}

export async function createNotebook(workspaceId: string): Promise<{ id: string }> {
  const user = await getAuthUser()
  const n = await db.notebook.create({
    data: { workspaceId, createdBy: user.id },
  })
  revalidatePath(`/workspace/${workspaceId}/notebooks`)
  return { id: n.id }
}

export async function updateNotebook(notebookId: string, title: string): Promise<void> {
  await getAuthUser()
  await db.notebook.update({ where: { id: notebookId }, data: { title } })
}

export async function updateNotebookTitle(notebookId: string, title: string): Promise<void> {
  await getAuthUser()
  await db.notebook.update({ where: { id: notebookId }, data: { title } })
}

export async function addSource(notebookId: string, input: AddSourceInput): Promise<NotebookSourceData> {
  await getAuthUser()

  const agg = await db.notebookSource.aggregate({
    where: { notebookId },
    _sum:  { charCount: true },
  })
  const currentTotal = agg._sum.charCount ?? 0

  let content = ''
  let title   = input.title ?? ''

  if (input.type === 'doc' && input.docId) {
    const doc = await db.document.findUnique({
      where:  { id: input.docId },
      select: { title: true, content: true },
    })
    if (!doc) throw new Error('Documento no encontrado')
    title   = doc.title
    content = extractDocHtml(doc.content ?? '')
  } else if (input.type === 'pdf' && input.pdfId) {
    const pdf = await db.pdf.findUnique({
      where:  { id: input.pdfId },
      select: { title: true, data: true },
    })
    if (!pdf) throw new Error('PDF no encontrado')
    title   = pdf.title
    content = await extractPdf(Buffer.from(pdf.data))
  } else if (input.type === 'text' && input.text) {
    content = input.text.trim()
    title   = title || content.slice(0, 60)
  } else if (input.type === 'url' && input.url) {
    const extracted = await extractUrl(input.url)
    content = extracted.content
    title   = title || extracted.title
  } else {
    throw new Error('Input inválido para el tipo de fuente')
  }

  const charCount = content.length
  if (!checkLimit(currentTotal, charCount)) {
    throw new Error(`LIMIT_EXCEEDED:${currentTotal}:${CHAR_LIMIT}`)
  }

  const source = await db.notebookSource.create({
    data: {
      notebookId,
      type:  input.type,
      title,
      content,
      charCount,
      docId: input.docId ?? null,
      pdfId: input.pdfId ?? null,
      url:   input.url ?? null,
    },
  })

  await db.notebook.update({
    where: { id: notebookId },
    data:  { synthesisDirty: true },
  })

  return {
    id:        source.id,
    type:      source.type,
    title:     source.title,
    charCount: source.charCount,
    docId:     source.docId,
    pdfId:     source.pdfId,
    url:       source.url,
    createdAt: source.createdAt.toISOString(),
  }
}

export async function deleteSource(sourceId: string, notebookId: string): Promise<void> {
  await getAuthUser()
  await db.notebookSource.delete({ where: { id: sourceId } })
  await db.notebook.update({
    where: { id: notebookId },
    data:  { synthesisDirty: true },
  })
}

export async function deleteNotebook(notebookId: string, workspaceId: string): Promise<void> {
  await getAuthUser()
  await db.notebook.delete({ where: { id: notebookId } })
  revalidatePath(`/workspace/${workspaceId}/notebooks`)
}

export async function saveMessage(
  notebookId:      string,
  role:            'user' | 'assistant',
  content:         string,
  sourcesSnapshot: string[],
): Promise<void> {
  await db.notebookMessage.create({
    data: {
      notebookId,
      role,
      content,
      sourcesSnapshot: JSON.stringify(sourcesSnapshot),
    },
  })
}

export async function saveSynthesis(notebookId: string, synthesisJson: string): Promise<void> {
  await db.notebook.update({
    where: { id: notebookId },
    data:  { synthesisCache: synthesisJson, synthesisDirty: false },
  })
}

export async function getWorkspaceDocs(workspaceId: string): Promise<{ id: string; title: string }[]> {
  await getAuthUser()
  const docs = await db.document.findMany({
    where:   { workspaceId },
    orderBy: { createdAt: 'desc' },
    select:  { id: true, title: true },
  })
  return docs
}

export async function getWorkspacePdfs(workspaceId: string): Promise<{ id: string; title: string }[]> {
  await getAuthUser()
  const pdfs = await db.pdf.findMany({
    where:   { workspaceId },
    orderBy: { createdAt: 'desc' },
    select:  { id: true, title: true },
  })
  return pdfs
}
