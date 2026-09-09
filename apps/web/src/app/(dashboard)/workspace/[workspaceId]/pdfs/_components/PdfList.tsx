'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PdfData } from '@/app/actions/pdfs'
import { PdfUploadZone } from './PdfUploadZone'
import { CommentBadge } from '@/components/resource-drawer'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'

interface Props {
  workspaceId:   string
  initial:       PdfData[]
  currentUserId: string
  locale:        Locale
}

export function PdfList({ workspaceId, initial, currentUserId, locale }: Props) {
  const t = getDashboardTranslations(locale)
  const categories = [
    { value: 'Contratos', label: t.pdfsCategoryContracts },
    { value: 'Informes', label: t.pdfsCategoryReports },
    { value: 'Propuestas', label: t.pdfsCategoryProposals },
    { value: 'Facturas', label: t.pdfsCategoryInvoices },
    { value: 'Otro', label: t.pdfsCategoryOther },
  ]
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
            {t.pdfsAll}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActive(cat.value === activeCategory ? null : cat.value)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                activeCategory === cat.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <PdfUploadZone workspaceId={workspaceId} onUploaded={handleUploaded} locale={locale} />

      {visible.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl mx-auto">📑</div>
          <div className="space-y-1">
            <p className="font-semibold text-sm">
              {activeCategory
                ? t.pdfsEmptyInCategory.replace('{category}', categories.find((cat) => cat.value === activeCategory)?.label ?? activeCategory)
                : t.pdfsEmpty}
            </p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {activeCategory ? t.pdfsEmptyFilteredHelp : t.pdfsEmptyHelp}
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
                  {pdf.pageCount} {pdf.pageCount === 1 ? t.pdfsPageSingular : t.pdfsPagePlural} ·{' '}
                  {new Date(pdf.createdAt).toLocaleDateString(locale)}
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
                    {categories.find((cat) => cat.value === pdf.category)?.label ?? pdf.category}
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
