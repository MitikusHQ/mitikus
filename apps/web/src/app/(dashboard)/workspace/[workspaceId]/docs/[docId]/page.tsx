import { requireUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDocument } from '@/app/actions/documents'
import { DeleteDocButton } from './_components/DeleteDocButton'

interface Props {
  params: Promise<{ workspaceId: string; docId: string }>
}

export default async function DocViewerPage({ params }: Props) {
  const [{ workspaceId, docId }, user] = await Promise.all([params, requireUser()])

  const doc = await getDocument(docId, workspaceId)
  if (!doc) notFound()

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      {/* Volver */}
      <Link
        href={`/workspace/${workspaceId}/docs`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Documentación
      </Link>

      {/* Cabecera */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{doc.title}</h1>
          <p className="text-sm text-muted-foreground">
            {doc.wordCount.toLocaleString()} palabras ·{' '}
            {new Date(doc.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            {doc.uploaderName ? ` · ${doc.uploaderName}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs border border-primary/30 text-primary px-2.5 py-1 rounded-full">
            Arkos usa este doc ✓
          </span>
          <DeleteDocButton docId={docId} workspaceId={workspaceId} />
        </div>
      </div>

      {/* Contenido */}
      <div
        className="prose prose-sm dark:prose-invert max-w-none border border-border rounded-lg bg-card px-6 py-5"
        dangerouslySetInnerHTML={{ __html: doc.content }}
      />
    </div>
  )
}
