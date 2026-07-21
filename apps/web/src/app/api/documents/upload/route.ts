import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { convertDocx } from '@/lib/docx-convert'

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

  if (!file.name.toLowerCase().endsWith('.docx')) {
    return NextResponse.json({ error: 'Only .docx files are supported' }, { status: 400 })
  }

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const buffer = Buffer.from(await file.arrayBuffer())

  let html: string, rawText: string, wordCount: number
  try {
    ;({ html, rawText, wordCount } = await convertDocx(buffer))
  } catch {
    return NextResponse.json({ error: 'Failed to convert document' }, { status: 422 })
  }

  const title = file.name
    .replace(/\.docx$/i, '')
    .replace(/[-_]/g, ' ')
    .trim()

  const doc = await db.document.create({
    data: { workspaceId, title, content: html, rawText, wordCount, uploadedBy: user.id },
  })

  return NextResponse.json({ id: doc.id, title: doc.title, wordCount: doc.wordCount })
}
