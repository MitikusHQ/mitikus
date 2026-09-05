import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { uploadFile, deleteFile } from '@/lib/storage/supabase-storage'
import { getStorageStatus } from '@/lib/storage/check-storage-limit'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'
export const maxDuration = 30

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB por archivo

function mimeToFileType(mime: string): 'DOC' | 'SHEET' | 'PDF' | 'IMAGE' | 'OTHER' {
  if (mime === 'application/pdf') return 'PDF'
  if (mime.startsWith('image/')) return 'IMAGE'
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime === 'text/csv') return 'SHEET'
  if (mime.includes('document') || mime.includes('word') || mime.includes('text')) return 'DOC'
  return 'OTHER'
}

// GET /api/workspaces/[workspaceId]/files — listar archivos del workspace
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const user = await db.user.findFirst({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })

  const [files, status] = await Promise.all([
    db.workspaceFile.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    }),
    getStorageStatus(workspaceId),
  ])

  return NextResponse.json({ files, storage: status })
}

// POST /api/workspaces/[workspaceId]/files — subir archivo
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const user = await db.user.findFirst({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const folderId = formData.get('folderId') as string | null

  if (!file) return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'El archivo supera el límite de 50 MB' }, { status: 413 })
  }

  const status = await getStorageStatus(workspaceId, file.size)
  if (!status.hasCapacity) {
    return NextResponse.json(
      {
        error: 'Has alcanzado el límite de almacenamiento de tu plan.',
        usedBytes: status.usedBytes,
        limitBytes: status.limitBytes,
      },
      { status: 507 },
    )
  }

  const fileId = randomUUID()
  const buffer = Buffer.from(await file.arrayBuffer())
  const { path, url } = await uploadFile(workspaceId, fileId, file.name, buffer, file.type)

  const record = await db.workspaceFile.create({
    data: {
      id: fileId,
      workspaceId,
      folderId: folderId ?? null,
      uploadedBy: user.id,
      name: file.name,
      type: mimeToFileType(file.type),
      storagePath: path,
      url,
      size: file.size,
      mimeType: file.type,
    },
  })

  return NextResponse.json({ file: record, storage: await getStorageStatus(workspaceId) }, { status: 201 })
}

// DELETE /api/workspaces/[workspaceId]/files?fileId=xxx
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const user = await db.user.findFirst({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const fileId = new URL(req.url).searchParams.get('fileId')
  if (!fileId) return NextResponse.json({ error: 'fileId requerido' }, { status: 400 })

  const fileRecord = await db.workspaceFile.findFirst({
    where: { id: fileId, workspaceId },
  })
  if (!fileRecord) return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })

  if (fileRecord.storagePath) {
    await deleteFile(fileRecord.storagePath)
  }
  await db.workspaceFile.delete({ where: { id: fileId } })

  return NextResponse.json({ ok: true })
}
