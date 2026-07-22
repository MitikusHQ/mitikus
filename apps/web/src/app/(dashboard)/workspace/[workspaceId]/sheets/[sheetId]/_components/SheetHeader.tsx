'use client'

import { useState, useTransition } from 'react'
import { updateSpreadsheetMeta } from '@/app/actions/spreadsheets'

const CATEGORIES = ['Finanzas', 'Operaciones', 'RRHH', 'Ventas', 'Otro']

interface Props {
  sheetId:     string
  workspaceId: string
  title:       string
  category:    string | null
  saveStatus:  'idle' | 'saving' | 'saved' | 'error'
  onExport:    () => void
}

export function SheetHeader({
  sheetId,
  workspaceId,
  title: initialTitle,
  category: initialCategory,
  saveStatus,
  onExport,
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
      await updateSpreadsheetMeta(sheetId, workspaceId, {
        title,
        category: category || null,
      })
      setIsDirty(false)
    })
  }

  const statusText = {
    idle:   '',
    saving: 'Guardando…',
    saved:  'Guardado ✓',
    error:  'Error al guardar',
  }[saveStatus]

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b bg-background flex-wrap">
      <input
        value={title}
        onChange={handleTitleChange}
        className="text-base font-semibold bg-transparent border-none outline-none flex-1 min-w-0"
        placeholder="Sin título"
      />
      <select
        value={category}
        onChange={handleCategoryChange}
        className="text-xs border rounded px-2 py-1 bg-background"
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
      <span className={`text-xs ${saveStatus === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
        {statusText}
      </span>
      <button
        onClick={onExport}
        className="text-xs px-2 py-1 rounded border hover:bg-muted transition-colors"
      >
        ↓ .xlsx
      </button>
    </div>
  )
}
