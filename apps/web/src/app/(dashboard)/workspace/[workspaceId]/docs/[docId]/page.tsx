import { requireUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getDocument, getDocumentShares } from '@/app/actions/documents'
import { DeleteDocButton } from './_components/DeleteDocButton'
import { DocViewerClient } from './_components/DocViewerClient'

interface Props {
  params: Promise<{ workspaceId: string; docId: string }>
}

export default async function DocViewerPage({ params }: Props) {
  const [{ workspaceId, docId }, user] = await Promise.all([params, requireUser()])

  const [doc, workspace, shares] = await Promise.all([
    getDocument(docId, workspaceId),
    db.workspace.findFirst({
      where: { id: workspaceId, orgId: user.orgId },
      select: { name: true },
    }),
    getDocumentShares(docId, workspaceId),
  ])
  if (!doc) notFound()

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <Link
        href={`/workspace/${workspaceId}/docs`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Documentación
      </Link>

      <div className="flex justify-end">
        <DeleteDocButton docId={docId} workspaceId={workspaceId} />
      </div>

      <DocViewerClient
        doc={doc}
        workspaceId={workspaceId}
        workspaceName={workspace?.name ?? 'MITIKUS'}
        shares={shares}
      />
    </div>
  )
}
