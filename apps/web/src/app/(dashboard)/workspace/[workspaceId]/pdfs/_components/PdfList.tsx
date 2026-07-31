'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PdfData } from '@/app/actions/pdfs'
import { PdfUploadZone } from './PdfUploadZone'
import { CommentBadge } from '@/components/resource-drawer'

const CATEGORIES = ['Contratos', 'Informes', 'Propuestas', 'Facturas', 'Otro']

interface Props {
  workspaceId:   string
  initial:       PdfData[]
  currentUserId: string
}

export function PdfList({ workspaceId, initial, currentUserId }: Props) {
  const [pdfs, setPdfs]              = useState(initial)
  const [activeCategory, setActive]  = useState<string | null>(null)

  const visible = activeCategory
    ? pdfs.filter((p) => p.category === activeCategory)
    : pdfs

  function handleUploaded(pdf: PdfData) {
    setPdfs((prev) => [pdf, ...prev])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActive(null)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              activeCategory === null
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            Todas
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat === activeCategory ? null : cat)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <PdfUploadZone workspaceId={workspaceId} onUploaded={handleUploaded} />

      {visible.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl mx-auto">📑</div>
          <div className="space-y-1">
            <p className="font-semibold text-sm">
              {activeCategory ? `Sin PDFs en "${activeCategory}"` : 'Sin PDFs todavía'}
            </p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {activeCategory ? 'Prueba otra categoría o sube un PDF nuevo.' : 'Arrastra un PDF en la zona de carga superior para empezar.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border">
          {visible.map((pdf) => (
            <Link
              key={pdf.id}
              href={`/workspace/${workspaceId}/pdfs/${pdf.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {pdf.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pdf.pageCount} {pdf.pageCount === 1 ? 'página' : 'páginas'} ·{' '}
                  {new Date(pdf.createdAt).toLocaleDateString('es-ES')}
                  {pdf.uploaderName ? ` · ${pdf.uploaderName}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <CommentBadge
                  workspaceId={workspaceId}
                  resourceType="pdf"
                  resourceId={pdf.id}
                  resourceTitle={pdf.title}
                  currentUserId={currentUserId}
                />
                <span className="text-xs text-muted-foreground">
                  {Math.round(pdf.fileSize / 1024)} KB
                </span>
                {pdf.category && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {pdf.category}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
