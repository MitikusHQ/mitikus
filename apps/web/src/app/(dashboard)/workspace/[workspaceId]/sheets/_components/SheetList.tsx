'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { SpreadsheetData } from '@/app/actions/spreadsheets'
import { SheetUploadZone } from './SheetUploadZone'

const CATEGORIES = ['Finanzas', 'Operaciones', 'RRHH', 'Ventas', 'Otro']

interface Props {
  workspaceId: string
  initial:     SpreadsheetData[]
}

export function SheetList({ workspaceId, initial }: Props) {
  const [sheets, setSheets]         = useState(initial)
  const [activeCategory, setActive] = useState<string | null>(null)

  const visible = activeCategory
    ? sheets.filter((s) => s.category === activeCategory)
    : sheets

  function handleUploaded(sheet: SpreadsheetData) {
    setSheets((prev) => [sheet, ...prev])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
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
        <Link
          href={`/workspace/${workspaceId}/sheets/new`}
          className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          + Nueva hoja
        </Link>
      </div>

      <SheetUploadZone workspaceId={workspaceId} onUploaded={handleUploaded} />

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {activeCategory ? `No hay hojas en "${activeCategory}"` : 'Aún no hay hojas de cálculo'}
        </p>
      ) : (
        <div className="divide-y divide-border rounded-lg border">
          {visible.map((sheet) => (
            <Link
              key={sheet.id}
              href={`/workspace/${workspaceId}/sheets/${sheet.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {sheet.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {sheet.sheetCount} {sheet.sheetCount === 1 ? 'pestaña' : 'pestañas'} ·{' '}
                  {new Date(sheet.createdAt).toLocaleDateString('es-ES')}
                  {sheet.uploaderName ? ` · ${sheet.uploaderName}` : ''}
                </p>
              </div>
              {sheet.category && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground ml-3 shrink-0">
                  {sheet.category}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
