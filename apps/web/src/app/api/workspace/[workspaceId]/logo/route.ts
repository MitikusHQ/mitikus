import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!workspace) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Fichero requerido' }, { status: 400 })

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Solo se admiten imágenes' }, { status: 400 })
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'Máximo 2 MB' }, { status: 400 })
  }

  const blob = await put(`logos/${workspaceId}/${file.name}`, file, { access: 'public', allowOverwrite: true })

  await db.workspace.update({
    where: { id: workspaceId },
    data: { logoUrl: blob.url },
  })

  return NextResponse.json({ url: blob.url })
}
