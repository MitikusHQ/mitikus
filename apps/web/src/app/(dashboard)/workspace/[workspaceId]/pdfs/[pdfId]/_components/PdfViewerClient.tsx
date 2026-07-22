'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { PdfHeader } from './PdfHeader'
import { DeletePdfButton } from './DeletePdfButton'
import { convertPdfToDoc } from '@/app/actions/pdfs'
import type { PdfDetail } from '@/app/actions/pdfs'

const PdfViewer = dynamic(
  () => import('./PdfViewer').then((m) => m.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">Cargando visor…</p>
      </div>
    ),
  },
)

interface Props {
  pdf: PdfDetail
  workspaceId: string
}

export function PdfViewerClient({ pdf, workspaceId }: Props) {
  const router = useRouter()
  const [isConverting, startConvert] = useTransition()

  function handleDownload() {
    const bytes = new Uint8Array(pdf.dataArray)
    const blob  = new Blob([bytes], { type: 'application/pdf' })
    const url   = URL.createObjectURL(blob)
    const a     = document.createElement('a')
    a.href      = url
    a.download  = `${pdf.title}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleConvert() {
    startConvert(async () => {
      const docId = await convertPdfToDoc(pdf.id, workspaceId)
      router.push(`/workspace/${workspaceId}/docs/${docId}`)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <PdfHeader
        pdfId={pdf.id}
        workspaceId={workspaceId}
        title={pdf.title}
        category={pdf.category}
        fileSize={pdf.fileSize}
        pageCount={pdf.pageCount}
        onDownload={handleDownload}
        onConvert={handleConvert}
        isConverting={isConverting}
      />

      <div className="px-4">
        <PdfViewer dataArray={pdf.dataArray} title={pdf.title} />
      </div>

      <div className="px-4 pb-6">
        <DeletePdfButton pdfId={pdf.id} workspaceId={workspaceId} />
      </div>
    </div>
  )
}
