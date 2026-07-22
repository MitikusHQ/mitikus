'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export interface PdfData {
  id:           string
  title:        string
  category:     string | null
  pageCount:    number
  fileSize:     number
  createdAt:    string
  uploaderName: string | null
}

export interface PdfDetail extends PdfData {
  dataArray: number[]
}

async function getAuthUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('User not found')
  return user
}

export async function getPdfs(workspaceId: string): Promise<PdfData[]> {
  await getAuthUser()
  const pdfs = await db.pdf.findMany({
    where:   { workspaceId },
    orderBy: { createdAt: 'desc' },
    select: {
      id:        true,
      title:     true,
      category:  true,
      pageCount: true,
      fileSize:  true,
      createdAt: true,
      uploader:  { select: { name: true } },
    },
  })

  return pdfs.map((p) => ({
    id:           p.id,
    title:        p.title,
    category:     p.category,
    pageCount:    p.pageCount,
    fileSize:     p.fileSize,
    createdAt:    p.createdAt.toISOString(),
    uploaderName: p.uploader.name,
  }))
}

export async function getPdf(
  pdfId: string,
  workspaceId: string,
): Promise<PdfDetail | null> {
  await getAuthUser()
  const pdf = await db.pdf.findFirst({
    where:  { id: pdfId, workspaceId },
    select: {
      id:        true,
      title:     true,
      category:  true,
      pageCount: true,
      fileSize:  true,
      data:      true,
      createdAt: true,
      uploader:  { select: { name: true } },
    },
  })

  if (!pdf) return null

  return {
    id:           pdf.id,
    title:        pdf.title,
    category:     pdf.category,
    pageCount:    pdf.pageCount,
    fileSize:     pdf.fileSize,
    dataArray:    Array.from(Buffer.from(pdf.data)),
    createdAt:    pdf.createdAt.toISOString(),
    uploaderName: pdf.uploader.name,
  }
}

export async function updatePdfMeta(
  pdfId: string,
  workspaceId: string,
  input: { title: string; category: string | null },
): Promise<void> {
  await getAuthUser()
  await db.pdf.updateMany({
    where: { id: pdfId, workspaceId },
    data:  { title: input.title.trim() || 'Sin título', category: input.category || null },
  })
  revalidatePath(`/workspace/${workspaceId}/pdfs`)
  revalidatePath(`/workspace/${workspaceId}/pdfs/${pdfId}`)
}

export async function deletePdf(
  pdfId: string,
  workspaceId: string,
): Promise<void> {
  await getAuthUser()
  await db.pdf.deleteMany({ where: { id: pdfId, workspaceId } })
  revalidatePath(`/workspace/${workspaceId}/pdfs`)
}

export async function convertPdfToDoc(
  pdfId: string,
  workspaceId: string,
): Promise<string> {
  const user = await getAuthUser()
  const pdf = await db.pdf.findFirst({
    where:  { id: pdfId, workspaceId },
    select: { title: true, rawText: true },
  })
  if (!pdf) throw new Error('PDF not found')

  const content   = `<p>${pdf.rawText.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>')}</p>`
  const wordCount = pdf.rawText.trim().split(/\s+/).filter(Boolean).length

  const doc = await db.document.create({
    data: {
      workspaceId,
      title:      pdf.title,
      content,
      rawText:    pdf.rawText,
      wordCount,
      uploadedBy: user.id,
    },
  })
  revalidatePath(`/workspace/${workspaceId}/docs`)
  return doc.id
}
