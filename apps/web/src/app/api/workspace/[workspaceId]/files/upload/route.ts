import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { FileType } from '@prisma/client'

const MIME_TO_TYPE: Record<string, FileType> = {
  'application/pdf': FileType.PDF,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileType.DOC,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileType.SHEET,
  'image/jpeg': FileType.IMAGE,
  'image/png': FileType.IMAGE,
  'image/webp': FileType.IMAGE,
  'image/gif': FileType.IMAGE,
}

const MAX_SIZE = 50 * 1024 * 1024 // 50 MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!workspace) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const folderId = formData.get('folderId') as string | null

  if (!file) return NextResponse.json({ error: 'Fichero requerido' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Máximo 50 MB' }, { status: 400 })

  const fileType = MIME_TO_TYPE[file.type]
  if (!fileType) return NextResponse.json({ error: 'Tipo de archivo no soportado' }, { status: 400 })

  const blob = await put(`files/${workspaceId}/${Date.now()}-${file.name}`, file, {
    access: 'public',
  })

  const saved = await db.workspaceFile.create({
    data: {
      workspaceId,
      folderId: folderId || null,
      name: file.name,
      type: fileType,
      url: blob.url,
      size: file.size,
      mimeType: file.type,
    },
  })

  return NextResponse.json(saved)
}
