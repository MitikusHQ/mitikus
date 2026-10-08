import { NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/blob'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; fileId: string }> },
) {
  const user = await requireUser()
  const { workspaceId, fileId } = await params

  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!workspace) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const file = await db.workspaceFile.findFirst({ where: { id: fileId, workspaceId } })
  if (!file) return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })

  // Stream the private blob — blob URL is never exposed to the client
  const result = await get(file.url, { access: 'private' })
  if (!result || result.stream === null) {
    return new NextResponse(null, { status: 304 })
  }

  const headers = new Headers()
  headers.set('Content-Type', result.blob.contentType ?? file.mimeType ?? 'application/octet-stream')
  headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`)
  if (result.blob.size) headers.set('Content-Length', String(result.blob.size))
  headers.set('Cache-Control', 'private, no-store')

  return new NextResponse(result.stream, { headers })
}
