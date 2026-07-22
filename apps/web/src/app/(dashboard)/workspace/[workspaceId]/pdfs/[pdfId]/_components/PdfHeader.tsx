'use client'

import { useState, useTransition } from 'react'
import { updatePdfMeta } from '@/app/actions/pdfs'

const CATEGORIES = ['Contratos', 'Informes', 'Propuestas', 'Facturas', 'Otro']

interface Props {
  pdfId:       string
  workspaceId: string
  title:       string
  category:    string | null
  fileSize:    number
  pageCount:   number
  onDownload:  () => void
  onConvert:   () => void
  isConverting: boolean
}

export function PdfHeader({
  pdfId, workspaceId,
  title: initialTitle, category: initialCategory,
  fileSize, pageCount,
  onDownload, onConvert, isConverting,
}: Props) {
  const [title, setTitle]       = useState(initialTitle)
  const [category, setCategory] = useState(initialCategory ?? '')
  const [isDirty, setIsDirty]   = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value)
    setIsDirty(true)
  }

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setCategory(e.target.value)
    setIsDirty(true)
  }

  function handleSave() {
    startTransition(async () => {
      await updatePdfMeta(pdfId, workspaceId, { title, category: category || null })
      setIsDirty(false)
    })
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b bg-background flex-wrap">
      <input
        value={title}
        onChange={handleTitleChange}
        className="text-base font-semibold bg-transparent border-none outline-none flex-1 min-w-0"
        placeholder="Sin título"
        aria-label="Título del PDF"
      />
      <select
        value={category}
        onChange={handleCategoryChange}
        className="text-xs border rounded px-2 py-1 bg-background"
        aria-label="Categoría"
      >
        <option value="">Sin categoría</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      {isDirty && (
        <button
          onClick={handleSave}
          disabled={isPending}
          className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Guardar
        </button>
      )}
      <span className="text-xs text-muted-foreground">
        {pageCount} {pageCount === 1 ? 'pág.' : 'págs.'} · {Math.round(fileSize / 1024)} KB
      </span>
      <button
        onClick={onDownload}
        className="text-xs px-2 py-1 rounded border hover:bg-muted transition-colors"
      >
        ↓ Descargar
      </button>
      <button
        onClick={onConvert}
        disabled={isConverting}
        title="El resultado depende del contenido del PDF"
        className="text-xs px-2 py-1 rounded border hover:bg-muted transition-colors disabled:opacity-50"
      >
        {isConverting ? 'Convirtiendo…' : 'Abrir como Doc'}
      </button>
    </div>
  )
}
