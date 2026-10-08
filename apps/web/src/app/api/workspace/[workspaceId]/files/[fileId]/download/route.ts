import { NextRequest, NextResponse } from 'next/server'
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

  // Redirige al blob URL (UUID unguessable, no expuesto en el frontend)
  return NextResponse.redirect(file.url)
}
