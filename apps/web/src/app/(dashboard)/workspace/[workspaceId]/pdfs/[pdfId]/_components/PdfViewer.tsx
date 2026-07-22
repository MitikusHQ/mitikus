'use client'

import { useState, useMemo, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { PdfThumbnailSidebar } from './PdfThumbnailSidebar'
import { PdfSearchBar } from './PdfSearchBar'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

// Tipo del proxy de documento pdfjs expuesto por react-pdf v10
// eslint-disable-next-line
type PdfDocProxy = any

interface Props {
  dataArray: number[]
  title:     string
}

export function PdfViewer({ dataArray, title }: Props) {
  const [numPages, setNumPages]         = useState<number | null>(null)
  const [pageNumber, setPageNumber]     = useState(1)
  const [scale, setScale]               = useState(1.0)
  const [showSidebar, setShowSidebar]   = useState(false)
  const [pdfDoc, setPdfDoc]             = useState<PdfDocProxy>(null)

  const pdfData = useMemo(() => {
    const bytes = new Uint8Array(dataArray)
    return { data: bytes }
  }, [dataArray])

  function onDocumentLoadSuccess(pdf: PdfDocProxy) {
    setNumPages(pdf.numPages as number)
    setPageNumber(1)
    setPdfDoc(pdf)
  }

  function prevPage() {
    setPageNumber((p) => Math.max(1, p - 1))
  }

  function nextPage() {
    setPageNumber((p) => Math.min(numPages ?? 1, p + 1))
  }

  function zoomIn() {
    setScale((s) => Math.min(2.0, parseFloat((s + 0.2).toFixed(1))))
  }

  function zoomOut() {
    setScale((s) => Math.max(0.5, parseFloat((s - 0.2).toFixed(1))))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2 w-full justify-between flex-wrap gap-y-2">
        {/* Toggle sidebar */}
        <button
          onClick={() => setShowSidebar((s) => !s)}
          className={[
            'text-sm px-2 py-1 rounded border transition-colors',
            showSidebar
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border hover:bg-muted',
          ].join(' ')}
          aria-label={showSidebar ? 'Ocultar miniaturas' : 'Mostrar miniaturas'}
          title={showSidebar ? 'Ocultar miniaturas' : 'Mostrar miniaturas'}
        >
          ⊞
        </button>

        {/* Navegación páginas */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevPage}
            disabled={pageNumber <= 1}
            className="text-sm px-2 py-1 rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Página anterior"
          >
            ←
          </button>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Pág {pageNumber} / {numPages ?? '…'}
          </span>
          <button
            onClick={nextPage}
            disabled={pageNumber >= (numPages ?? 1)}
            className="text-sm px-2 py-1 rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Página siguiente"
          >
            →
          </button>
        </div>

        {/* Búsqueda */}
        <PdfSearchBar pdfDoc={pdfDoc} onMatchPage={setPageNumber} />

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="text-sm px-2 py-1 rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Reducir zoom"
          >
            −
          </button>
          <span className="text-xs text-muted-foreground w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= 2.0}
            className="text-sm px-2 py-1 rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Aumentar zoom"
          >
            +
          </button>
        </div>
      </div>

      {/* Zona principal: sidebar + canvas */}
      <div className="flex gap-3 overflow-auto w-full">
        {showSidebar && numPages !== null && (
          <PdfThumbnailSidebar
            pdfData={pdfData}
            numPages={numPages}
            currentPage={pageNumber}
            onPageSelect={setPageNumber}
          />
        )}

        <div className="flex-1 flex justify-center overflow-auto">
          <Document
            file={pdfData}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-muted-foreground">Cargando PDF…</p>
              </div>
            }
            error={
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-destructive">Error al cargar el PDF.</p>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>
      </div>
    </div>
  )
}
