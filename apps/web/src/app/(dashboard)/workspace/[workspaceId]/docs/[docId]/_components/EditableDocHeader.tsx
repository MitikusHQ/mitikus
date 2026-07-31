'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { DocumentDetail } from '@/app/actions/documents'
import { updateDocument } from '@/app/actions/documents'

const CATEGORIES = ['DNA', 'Producto', 'Arquitectura', 'Operaciones'] as const

interface Props {
  doc:               DocumentDetail
  workspaceId:       string
  onExportPdf:       () => void
  onExportDocx:      () => void
  onSendToClient:    () => void
  isExportingPdf:    boolean
  isExportingDocx:   boolean
}

export function EditableDocHeader({
  doc,
  workspaceId,
  onExportPdf,
  onExportDocx,
  onSendToClient,
  isExportingPdf,
  isExportingDocx,
}: Props) {
  const [title, setTitle]       = useState(doc.title)
  const [category, setCategory] = useState<string>(doc.category ?? '')
  const [saved, setSaved]       = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const isDirty = title !== doc.title || (category || null) !== doc.category

  function handleSave() {
    if (!title.trim()) return
    startTransition(async () => {
      await updateDocument(doc.id, workspaceId, {
        title,
        category: category || null,
      })
      router.refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-2 min-w-0">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-xl font-semibold bg-transparent border-0 border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors pb-0.5"
          aria-label="Título del documento"
        />
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground shrink-0">
            {doc.wordCount.toLocaleString()} palabras ·{' '}
            {new Date(doc.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            {doc.uploaderName ? ` · ${doc.uploaderName}` : ''}
          </p>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-xs border border-border rounded px-2 py-0.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Categoría"
          >
            <option value="">Sin categoría</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs border border-primary/30 text-primary px-2.5 py-1 rounded-full">
          Arkos usa este doc ✓
        </span>
        <button
          onClick={onExportPdf}
          disabled={isExportingPdf}
          className="text-xs border border-border px-2.5 py-1 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
          title="Descargar como PDF"
        >
          {isExportingPdf ? 'Generando…' : '↓ PDF'}
        </button>
        <button
          onClick={onExportDocx}
          disabled={isExportingDocx}
          className="text-xs border border-border px-2.5 py-1 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
          title="Descargar como Word (.docx)"
        >
          {isExportingDocx ? 'Generando…' : '↓ .docx'}
        </button>
        <button
          onClick={onSendToClient}
          className="text-xs border border-border px-2.5 py-1 rounded-full hover:bg-muted transition-colors"
          title="Enviar al cliente por email"
        >
          ✉ Enviar
        </button>
        {isDirty && (
          <button
            onClick={handleSave}
            disabled={isPending || !title.trim()}
            className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Guardando…' : 'Guardar'}
          </button>
        )}
        {saved && !isDirty && (
          <span className="text-xs text-green-600 dark:text-green-400">Guardado ✓</span>
        )}
      </div>
    </div>
  )
}
