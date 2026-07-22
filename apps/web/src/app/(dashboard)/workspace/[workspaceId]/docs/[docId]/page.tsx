import { requireUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDocument } from '@/app/actions/documents'
import { DeleteDocButton } from './_components/DeleteDocButton'
import { EditableDocHeader } from './_components/EditableDocHeader'
import { DocViewerClient } from './_components/DocViewerClient'

interface Props {
  params: Promise<{ workspaceId: string; docId: string }>
}

export default async function DocViewerPage({ params }: Props) {
  const [{ workspaceId, docId }] = await Promise.all([params, requireUser()])

  const doc = await getDocument(docId, workspaceId)
  if (!doc) notFound()

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #doc-print-zone, #doc-print-zone * { visibility: visible; }
          #doc-print-zone {
            position: absolute;
            left: 0; top: 0;
            width: 100%;
            padding: 40px;
          }
        }
      `}</style>

      <Link
        href={`/workspace/${workspaceId}/docs`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Documentación
      </Link>

      <div id="doc-print-zone" className="space-y-6">
        <EditableDocHeader doc={doc} workspaceId={workspaceId} />
        <DocViewerClient doc={doc} workspaceId={workspaceId} />
      </div>

      <div className="flex justify-end">
        <DeleteDocButton docId={docId} workspaceId={workspaceId} />
      </div>
    </div>
  )
}
