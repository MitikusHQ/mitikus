'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { DocumentDetail, ClientShareData } from '@/app/actions/documents'
import { updateDocumentContent } from '@/app/actions/documents'
import { TiptapEditor } from '../../_components/TiptapEditor'
import { EditableDocHeader } from './EditableDocHeader'
import { SendDocModal } from './SendDocModal'

interface Props {
  doc:           DocumentDetail
  workspaceId:   string
  workspaceName: string
  shares:        ClientShareData[]
}

export function DocViewerClient({ doc, workspaceId, workspaceName, shares }: Props) {
  const [isEditing, setIsEditing]       = useState(false)
  const [html, setHtml]                 = useState(doc.content)
  const [rawText, setRawText]           = useState(doc.rawText ?? '')
  const [isDirty, setIsDirty]           = useState(false)
  const [isPending, startTransition]    = useTransition()
  const [isExportingPdf, setExportingPdf]   = useState(false)
  const [isExportingDocx, setExportingDocx] = useState(false)
  const [showSendModal, setShowSendModal]   = useState(false)
  const router = useRouter()

  async function handleExportPdf() {
    setExportingPdf(true)
    try {
      const { jsPDF } = await import('jspdf')
      const pdf       = new jsPDF({ unit: 'mm', format: 'a4' })
      const fullW     = pdf.internal.pageSize.getWidth()
      const pageH     = pdf.internal.pageSize.getHeight()
      const margin    = 20
      const pageW     = fullW - margin * 2
      const lineH     = 6

      // ── Cabecera de marca ────────────────────────────────────
      pdf.setFillColor(15, 23, 42)         // slate-900
      pdf.rect(0, 0, fullW, 14, 'F')
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      pdf.text(workspaceName.toUpperCase(), margin, 9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(148, 163, 184)      // slate-400
      pdf.text('mitikus.com', fullW - margin, 9, { align: 'right' })

      let y = 26

      // ── Título ───────────────────────────────────────────────
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(15, 23, 42)
      const titleLines = pdf.splitTextToSize(doc.title, pageW)
      pdf.text(titleLines, margin, y)
      y += (titleLines.length * 8) + 4

      // ── Metadatos ────────────────────────────────────────────
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 116, 139)      // slate-500
      const meta = [
        doc.uploaderName ? `Elaborado por ${doc.uploaderName}` : null,
        `${doc.wordCount.toLocaleString()} palabras`,
        new Date(doc.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
      ].filter(Boolean).join(' · ')
      pdf.text(meta, margin, y)
      y += 9
      pdf.setTextColor(0, 0, 0)

      // ── Separador ────────────────────────────────────────────
      pdf.setDrawColor(226, 232, 240)
      pdf.line(margin, y, margin + pageW, y)
      y += 7

      // ── Contenido ────────────────────────────────────────────
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(30, 41, 59)
      const text       = rawText || doc.rawText || ''
      const paragraphs = text.split('\n').filter((l: string) => l.trim())

      for (const para of paragraphs) {
        const lines = pdf.splitTextToSize(para, pageW)
        if (y + lines.length * lineH > pageH - margin - 10) {
          pdf.addPage()
          // Repite la cabecera en páginas siguientes
          pdf.setFillColor(15, 23, 42)
          pdf.rect(0, 0, fullW, 14, 'F')
          pdf.setFontSize(9)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(255, 255, 255)
          pdf.text(workspaceName.toUpperCase(), margin, 9)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(148, 163, 184)
          pdf.text('mitikus.com', fullW - margin, 9, { align: 'right' })
          pdf.setFontSize(11)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(30, 41, 59)
          y = 26
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
      {showSendModal && (
        <SendDocModal
          docId={doc.id}
          workspaceId={workspaceId}
          docTitle={doc.title}
          onClose={() => setShowSendModal(false)}
        />
      )}
      <EditableDocHeader
        doc={doc}
        workspaceId={workspaceId}
        onExportPdf={handleExportPdf}
        onExportDocx={handleExportDocx}
        onSendToClient={() => setShowSendModal(true)}
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

      {/* Historial de envíos al cliente */}
      {shares.length > 0 && (
        <div className="border border-border rounded-lg bg-card px-5 py-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Enviado al cliente
          </p>
          <ul className="space-y-2">
            {shares.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <span className="font-medium truncate block">
                    {s.recipientName ?? s.recipientEmail}
                  </span>
                  {s.recipientName && (
                    <span className="text-xs text-muted-foreground">{s.recipientEmail}</span>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {s.viewedAt ? (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Visto · {new Date(s.viewedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Enviado · {new Date(s.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
