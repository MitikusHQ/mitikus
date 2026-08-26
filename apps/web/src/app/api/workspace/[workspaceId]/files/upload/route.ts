import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { FileType } from '@prisma/client'
import { checkPlanLimit } from '@/lib/billing/check-plan-limit'
import { checkStorageAlerts } from '@/lib/storage-alerts'
import { can } from '@/lib/permissions'

const MIME_TO_TYPE: Record<string, FileType> = {
  'application/pdf': FileType.PDF,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileType.DOC,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileType.SHEET,
  'image/jpeg': FileType.IMAGE,
  'image/png': FileType.IMAGE,
  'image/webp': FileType.IMAGE,
  'image/gif': FileType.IMAGE,
  'text/plain': FileType.OTHER,
  'text/markdown': FileType.OTHER,
  'application/json': FileType.OTHER,
  'application/zip': FileType.OTHER,
}

const MAX_SIZE = 50 * 1024 * 1024 // 50 MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!workspace) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!can(user, 'manage_files')) return NextResponse.json({ error: 'Sin permisos para subir archivos' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const folderId = formData.get('folderId') as string | null
  const clientId = formData.get('clientId') as string | null

  if (!file) return NextResponse.json({ error: 'Fichero requerido' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Máximo 50 MB' }, { status: 400 })

  const storageLimit = await checkPlanLimit(user.orgId, 'maxStorageGB', workspaceId)
  if (!storageLimit.allowed) {
    return NextResponse.json({ error: storageLimit.message }, { status: 413 })
  }

  const fileType = MIME_TO_TYPE[file.type] ?? FileType.OTHER

  if (clientId) {
    const client = await db.client.findFirst({
      where: { id: clientId, workspaceId },
      select: { id: true },
    })
    if (!client) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }
  if (folderId) {
    const folder = await db.folder.findFirst({
      where: { id: folderId, workspaceId },
      select: { id: true },
    })
    if (!folder) return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 })
  }

  const blob = await put(`files/${workspaceId}/${Date.now()}-${file.name}`, file, {
    access: 'public',
  })

  const saved = await db.workspaceFile.create({
    data: {
      workspaceId,
      folderId: folderId || null,
      clientId: clientId || null,
      name: file.name,
      type: fileType,
      url: blob.url,
      size: file.size,
      mimeType: file.type,
    },
    include: {
      folder: { select: { id: true, name: true } },
    },
  })

  // Fire-and-forget: check storage thresholds and email owner if needed
  void checkStorageAlerts(workspaceId, user.orgId)

  return NextResponse.json(saved)
}
