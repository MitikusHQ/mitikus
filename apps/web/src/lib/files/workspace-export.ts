import JSZip from 'jszip'
import { db } from '@/lib/db'

function safeExportName(name: string) {
  return name.replace(/[^a-z0-9áéíóúñ_\- ]/gi, '_').trim() || 'workspace'
}

export async function buildWorkspaceFilesZip(workspaceId: string) {
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true, name: true },
  })
  if (!workspace) throw new Error('Workspace no encontrado')

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
        // File export should continue even if one remote file is temporarily unavailable.
      }
    }),
  )

  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  return {
    buffer,
    filename: `MITIKUS-${safeExportName(workspace.name)}-archivos.zip`,
  }
}
