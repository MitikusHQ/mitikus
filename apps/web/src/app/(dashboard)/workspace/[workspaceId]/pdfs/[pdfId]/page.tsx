import { notFound } from 'next/navigation'
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
    <div className="flex flex-col min-h-screen">
      <PdfViewerClient pdf={pdf} workspaceId={workspaceId} />
    </div>
  )
}
