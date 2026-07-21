'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { DocumentData } from '@/app/actions/documents'
import { UploadZone } from './UploadZone'

interface Props {
  workspaceId:  string
  initialDocs:  DocumentData[]
}

const CATEGORY_COLORS: Record<string, string> = {
  DNA:          'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  Producto:     'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  Arquitectura: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  Operaciones:  'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
}

function categoryColor(cat: string | null): string {
  if (!cat) return 'bg-muted text-muted-foreground'
  return CATEGORY_COLORS[cat] ?? 'bg-muted text-muted-foreground'
}

function formatWords(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k palabras` : `${n} palabras`
}

export function DocList({ workspaceId, initialDocs }: Props) {
  const [docs, setDocs]     = useState<DocumentData[]>(initialDocs)
  const [filter, setFilter] = useState<string | null>(null)

  const categories = Array.from(new Set(docs.map((d) => d.category).filter(Boolean))) as string[]
  const filtered   = filter ? docs.filter((d) => d.category === filter) : docs

  function handleUploaded(doc: DocumentData) {
    setDocs((prev) => [doc, ...prev])
  }

  return (
    <div className="space-y-4">
      {/* Nuevo documento */}
      <div className="flex justify-end">
        <Link
          href={`/workspace/${workspaceId}/docs/new`}
          className="text-xs border border-border px-3 py-1.5 rounded-full hover:bg-muted transition-colors inline-flex items-center gap-1"
        >
          <span aria-hidden>+</span> Nuevo documento
        </Link>
      </div>

      {/* Filtros */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter(null)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              !filter
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-foreground'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat === filter ? null : cat)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                filter === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No hay documentos todavía. Sube el primero.
          </div>
        ) : (
          filtered.map((doc) => (
            <Link
              key={doc.id}
              href={`/workspace/${workspaceId}/docs/${doc.id}`}
              className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/40 transition-colors"
            >
              <span className="text-lg shrink-0">📄</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatWords(doc.wordCount)} ·{' '}
                  {new Date(doc.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              {doc.category && (
                <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded font-medium ${categoryColor(doc.category)}`}>
                  {doc.category}
                </span>
              )}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground/40" aria-hidden>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          ))
        )}
      </div>

      <UploadZone workspaceId={workspaceId} onUploaded={handleUploaded} />
    </div>
  )
}
