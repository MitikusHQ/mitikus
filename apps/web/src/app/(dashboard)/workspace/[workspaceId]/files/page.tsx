import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { getStorageStatus } from '@/lib/storage/check-storage-limit'
import { FilesClient } from './_components/FilesClient'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export const metadata = { title: 'Archivos' }

export default async function FilesPage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) return null

  const [files, storage] = await Promise.all([
    db.workspaceFile.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, size: true, mimeType: true, url: true, createdAt: true },
    }),
    getStorageStatus(workspaceId),
  ])

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Archivos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sube y gestiona los archivos de este workspace
        </p>
      </div>
      <FilesClient
        workspaceId={workspaceId}
        initialFiles={files.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() }))}
        initialStorage={storage}
      />
    </div>
  )
}
