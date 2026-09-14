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

  const [files, folders, contracts] = await Promise.all([
    db.workspaceFile.findMany({
      where: { workspaceId },
      select: { id: true, name: true, url: true, folderId: true },
    }),
    db.folder.findMany({
      where: { workspaceId },
      select: { id: true, name: true, parentId: true },
    }),
    db.contract.findMany({
      where: { workspaceId },
      select: { id: true, title: true, status: true, signedPdfData: true, pdfData: true },
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

  // Añadir contratos al ZIP
  const contractsFolder = zip.folder('contratos')!
  for (const contract of contracts) {
    const safeName = safeExportName(contract.title)
    const pdfData = contract.signedPdfData ?? contract.pdfData
    if (pdfData) {
      const suffix = contract.signedPdfData ? '-firmado' : '-borrador'
      contractsFolder.file(`${safeName}${suffix}.pdf`, pdfData)
    }
  }

  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  return {
    buffer,
    filename: `MITIKUS-${safeExportName(workspace.name)}-export.zip`,
  }
}
