import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPdf } from '@/app/actions/pdfs'
import { requireUser } from '@/lib/auth'
import { PdfViewerClient } from './_components/PdfViewerClient'

interface Props {
  params: Promise<{ workspaceId: string; pdfId: string }>
}

export default async function PdfViewerPage({ params }: Props) {
  const [{ workspaceId, pdfId }] = await Promise.all([params, requireUser()])
  const pdf = await getPdf(pdfId, workspaceId)
  if (!pdf) notFound()

  return (
    <>
      <div className="px-6 py-2.5 border-b bg-background">
        <Link href={`/workspace/${workspaceId}/pdfs`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          PDFs
        </Link>
      </div>
      <div className="flex flex-col min-h-screen">
        <PdfViewerClient pdf={pdf} workspaceId={workspaceId} />
      </div>
    </>
  )
}
