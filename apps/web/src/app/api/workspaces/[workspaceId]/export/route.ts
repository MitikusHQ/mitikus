import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import JSZip from 'jszip'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const user = await db.user.findFirst({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  // Solo OWNER y ADMIN pueden exportar
  if (!['OWNER', 'ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Sin permisos para exportar' }, { status: 403 })
  }

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })

  // Cargar todos los datos en paralelo
  const [toolInstances, workspaceFiles, clients] = await Promise.all([
    db.toolInstance.findMany({
      where: { workspaceId },
      include: {
        toolDefinition: true,
        toolRecords: { where: { isDeleted: false } },
      },
    }),
    db.workspaceFile.findMany({ where: { workspaceId } }),
    db.client.findMany({ where: { workspaceId, isArchived: false } }),
  ])

  const zip = new JSZip()

  // workspace-info.json
  zip.file(
    'workspace-info.json',
    JSON.stringify(
      {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        exportedAt: new Date().toISOString(),
        exportedBy: user.email,
      },
      null,
      2,
    ),
  )

  // clients/clients.json
  zip.file('clients/clients.json', JSON.stringify(clients, null, 2))

  // tools/<slug>.json + records/<slug>.json
  const toolsFolder = zip.folder('tools')!
  const recordsFolder = zip.folder('records')!

  for (const instance of toolInstances) {
    const slug = instance.toolDefinition.slug
    toolsFolder.file(
      `${slug}.json`,
      JSON.stringify(
        {
          id: instance.id,
          name: instance.name,
          toolDefinitionId: instance.toolDefinitionId,
          schema: instance.toolDefinition.schema,
          createdAt: instance.createdAt,
        },
        null,
        2,
      ),
    )
    recordsFolder.file(
      `${slug}.json`,
      JSON.stringify(
        instance.toolRecords.map((r) => ({ id: r.id, data: r.data, createdAt: r.createdAt })),
        null,
        2,
      ),
    )
  }

  // files/ — descarga desde Supabase y adjunta al ZIP
  if (workspaceFiles.length > 0) {
    const filesFolder = zip.folder('files')!
    await Promise.all(
      workspaceFiles.map(async (f) => {
        try {
          const res = await fetch(f.url)
          if (!res.ok) return
          const buf = await res.arrayBuffer()
          filesFolder.file(f.name, buf)
        } catch {
          // si falla un archivo concreto, continúa
        }
      }),
    )
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  const filename = `${workspace.slug}-export-${new Date().toISOString().slice(0, 10)}.zip`

  return new NextResponse(zipBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(zipBuffer.length),
    },
  })
}
