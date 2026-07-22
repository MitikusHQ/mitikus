import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file        = formData.get('file') as File | null
  const workspaceId = formData.get('workspaceId') as string | null

  if (!file || !workspaceId) {
    return NextResponse.json({ error: 'Missing file or workspaceId' }, { status: 400 })
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'Solo se admiten archivos .pdf' }, { status: 400 })
  }

  const workspace = await db.workspace.findFirst({
    where:  { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const arrayBuffer = await file.arrayBuffer()
  const buffer      = Buffer.from(arrayBuffer)

  let rawText   = ''
  let pageCount = 0
  try {
    // pdf-parse es un módulo CommonJS — require dinámico para evitar issues ESM
    const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string; numpages: number }>
    const result   = await pdfParse(buffer)
    rawText   = result.text.trim()
    pageCount = result.numpages
  } catch {
    // PDF sin texto (escaneado) — seguimos con rawText vacío
    rawText   = ''
    pageCount = 0
  }

  const title = file.name
    .replace(/\.pdf$/i, '')
    .replace(/[-_]/g, ' ')
    .trim()

  const pdf = await db.pdf.create({
    data: {
      workspaceId,
      title,
      data:       buffer,
      rawText,
      pageCount,
      fileSize:   buffer.length,
      uploadedBy: user.id,
    },
  })

  return NextResponse.json({ id: pdf.id, title: pdf.title, pageCount: pdf.pageCount })
}
