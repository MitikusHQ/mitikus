import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { getNotebook, getWorkspaceDocs, getWorkspacePdfs } from '@/app/actions/notebooks'
import { NotebookClient } from './_components/NotebookClient'

interface Props {
  params: Promise<{ workspaceId: string; notebookId: string }>
}

export default async function NotebookPage({ params }: Props) {
  const [{ workspaceId, notebookId }] = await Promise.all([params, requireUser()])

  const [notebook, docs, pdfs] = await Promise.all([
    getNotebook(workspaceId, notebookId).catch(() => null),
    getWorkspaceDocs(workspaceId),
    getWorkspacePdfs(workspaceId),
  ])

  if (!notebook) notFound()

  return (
    <NotebookClient
      notebook={notebook}
      workspaceId={workspaceId}
      workspaceDocs={docs}
      workspacePdfs={pdfs}
    />
  )
}
