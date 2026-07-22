'use client'

import { useRef, useState, useEffect } from 'react'
import { Document, Page } from 'react-pdf'

interface Props {
  pdfData:      { data: Uint8Array }
  numPages:     number
  currentPage:  number
  onPageSelect: (page: number) => void
}

const THUMB_W = 71
const THUMB_H = 101

function LazyThumbnail({
  pdfData,
  pageNumber,
  isActive,
  onSelect,
}: {
  pdfData:    { data: Uint8Array }
  pageNumber: number
  isActive:   boolean
  onSelect:   () => void
}) {
  const ref                   = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      onClick={onSelect}
      className={[
        'flex flex-col items-center gap-1 cursor-pointer rounded p-1 transition-colors',
        isActive
          ? 'border-2 border-primary bg-primary/5'
          : 'border border-border hover:border-primary/40',
      ].join(' ')}
      style={{ width: THUMB_W + 8 }}
    >
      {visible ? (
        <Document file={pdfData} loading={null} error={null}>
          <Page
            pageNumber={pageNumber}
            scale={0.12}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            width={THUMB_W}
          />
        </Document>
      ) : (
        <div
          style={{ width: THUMB_W, height: THUMB_H }}
          className="bg-muted rounded animate-pulse"
        />
      )}
      <span
        className={[
          'text-[9px] font-medium',
          isActive ? 'text-primary' : 'text-muted-foreground',
        ].join(' ')}
      >
        {pageNumber}
      </span>
    </div>
  )
}

export function PdfThumbnailSidebar({ pdfData, numPages, currentPage, onPageSelect }: Props) {
  return (
    <div className="flex flex-col gap-2 overflow-y-auto pr-1" style={{ width: 88, maxHeight: '70vh' }}>
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground text-center">Págs</p>
      {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
        <LazyThumbnail
          key={n}
          pdfData={pdfData}
          pageNumber={n}
          isActive={n === currentPage}
          onSelect={() => onPageSelect(n)}
        />
      ))}
    </div>
  )
}
