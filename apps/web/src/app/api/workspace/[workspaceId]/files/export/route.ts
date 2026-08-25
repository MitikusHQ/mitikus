import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import JSZip from 'jszip'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true, name: true },
  })
  if (!workspace) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const [files, folders] = await Promise.all([
    db.workspaceFile.findMany({
      where: { workspaceId },
      select: { id: true, name: true, url: true, folderId: true },
    }),
    db.folder.findMany({
      where: { workspaceId },
      select: { id: true, name: true, parentId: true },
    }),
  ])

  // Build folder path map
  function folderPath(folderId: string | null): string {
    if (!folderId) return ''
    const folder = folders.find((f) => f.id === folderId)
    if (!folder) return ''
    const parent = folderPath(folder.parentId)
    return parent ? `${parent}/${folder.name}` : folder.name
  }

  const zip = new JSZip()

  await Promise.all(
    files.map(async (file) => {
      try {
        const res = await fetch(file.url)
        if (!res.ok) return
        const buffer = await res.arrayBuffer()
        const path = folderPath(file.folderId)
        const zipPath = path ? `${path}/${file.name}` : file.name
        zip.file(zipPath, buffer)
      } catch {
        // skip files that can't be fetched
      }
    }),
  )

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })

  const safeName = workspace.name.replace(/[^a-z0-9áéíóúñ_\- ]/gi, '_').trim() || 'workspace'
  const filename = `MITIKUS-${safeName}-archivos.zip`

  return new NextResponse(zipBuffer.buffer as ArrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(zipBuffer.byteLength),
    },
  })
}
