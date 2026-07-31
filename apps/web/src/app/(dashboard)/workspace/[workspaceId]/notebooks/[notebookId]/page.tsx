import { notFound } from 'next/navigation'
import Link from 'next/link'
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
    <>
      <div className="px-6 py-2.5 border-b bg-background">
        <Link href={`/workspace/${workspaceId}/notebooks`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Notebooks
        </Link>
      </div>
      <NotebookClient
        notebook={notebook}
        workspaceId={workspaceId}
        workspaceDocs={docs}
        workspacePdfs={pdfs}
      />
    </>
  )
}
