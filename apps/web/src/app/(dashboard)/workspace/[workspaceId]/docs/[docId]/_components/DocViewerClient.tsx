'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { DocumentDetail } from '@/app/actions/documents'
import { updateDocumentContent } from '@/app/actions/documents'
import { TiptapEditor } from '../../_components/TiptapEditor'
import { EditableDocHeader } from './EditableDocHeader'

interface Props {
  doc:         DocumentDetail
  workspaceId: string
}

export function DocViewerClient({ doc, workspaceId }: Props) {
  const [isEditing, setIsEditing]       = useState(false)
  const [html, setHtml]                 = useState(doc.content)
  const [rawText, setRawText]           = useState(doc.rawText ?? '')
  const [isDirty, setIsDirty]           = useState(false)
  const [isPending, startTransition]    = useTransition()
  const [isExportingPdf, setExportingPdf]   = useState(false)
  const [isExportingDocx, setExportingDocx] = useState(false)
  const router = useRouter()

  async function handleExportPdf() {
    setExportingPdf(true)
    try {
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
      const margin    = 20
      const pageW     = pdf.internal.pageSize.getWidth() - margin * 2
      const pageH     = pdf.internal.pageSize.getHeight()
      const lineH     = 6
      let y = margin

      // Título
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      const titleLines = pdf.splitTextToSize(doc.title, pageW)
      pdf.text(titleLines, margin, y)
      y += (titleLines.length * 8) + 4

      // Metadatos
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(120, 120, 120)
      const meta = `${doc.wordCount.toLocaleString()} palabras · ${new Date(doc.createdAt).toLocaleDateString('es-ES')}`
      pdf.text(meta, margin, y)
      y += 10
      pdf.setTextColor(0, 0, 0)

      // Línea separadora
      pdf.setDrawColor(200, 200, 200)
      pdf.line(margin, y, margin + pageW, y)
      y += 6

      // Contenido
      pdf.setFontSize(11)
      const text = rawText || doc.rawText || ''
      const paragraphs = text.split('\n').filter((l: string) => l.trim())
      for (const para of paragraphs) {
        const lines = pdf.splitTextToSize(para, pageW)
        if (y + lines.length * lineH > pageH - margin) {
          pdf.addPage()
          y = margin
        }
        pdf.text(lines, margin, y)
        y += lines.length * lineH + 3
      }

      pdf.save(`${doc.title}.pdf`)
    } finally {
      setExportingPdf(false)
    }
  }

  async function handleExportDocx() {
    setExportingDocx(true)
    try {
      const { downloadAsDocx } = await import('@/lib/docx-export')
      await downloadAsDocx(html, doc.title, doc.uploaderName, doc.wordCount, doc.createdAt)
    } finally {
      setExportingDocx(false)
    }
  }

  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (isDirty) {
      e.preventDefault()
      e.returnValue = ''
    }
  }, [isDirty])

  useEffect(() => {
    if (isEditing) {
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isEditing, handleBeforeUnload])

  function handleChange(newHtml: string, newText: string) {
    setHtml(newHtml)
    setRawText(newText)
    setIsDirty(true)
  }

  function handleCancel() {
    setHtml(doc.content)
    setIsDirty(false)
    setIsEditing(false)
  }

  function handleSave() {
    startTransition(async () => {
      await updateDocumentContent(doc.id, workspaceId, { content: html, rawText })
      setIsDirty(false)
      setIsEditing(false)
      router.refresh()
    })
  }

  return (
    <>
      <EditableDocHeader
        doc={doc}
        workspaceId={workspaceId}
        onExportPdf={handleExportPdf}
        onExportDocx={handleExportDocx}
        isExportingPdf={isExportingPdf}
        isExportingDocx={isExportingDocx}
      />

      {/* Acciones — visibles solo en modo lectura */}
      {!isEditing && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs border border-border px-3 py-1.5 rounded-full hover:bg-muted transition-colors"
          >
            Editar contenido
          </button>
        </div>
      )}

      {/* Contenido */}
      {isEditing ? (
        <>
          <TiptapEditor initialContent={doc.content} onChange={handleChange} />

          {/* Barra de acciones */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="text-xs border border-border px-4 py-1.5 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="text-xs bg-primary text-primary-foreground px-4 py-1.5 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </>
      ) : (
        <div
          className="prose prose-sm dark:prose-invert max-w-none border border-border rounded-lg bg-card px-6 py-5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </>
  )
}
