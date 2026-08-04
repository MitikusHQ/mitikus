import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { getFolderTree, getFiles } from '@/app/actions/files'
import { FilesClient } from './_components/FilesClient'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function FilesPage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) notFound()

  const [folders, files] = await Promise.all([
    getFolderTree(workspaceId),
    getFiles(workspaceId, null),
  ])

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="px-6 py-4 border-b border-border shrink-0">
        <h1 className="text-xl font-semibold">Archivos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Organiza documentos, imágenes y hojas de cálculo en carpetas</p>
      </div>
      <FilesClient
        workspaceId={workspaceId}
        initialFolders={folders}
        initialFiles={files}
      />
    </div>
  )
}
