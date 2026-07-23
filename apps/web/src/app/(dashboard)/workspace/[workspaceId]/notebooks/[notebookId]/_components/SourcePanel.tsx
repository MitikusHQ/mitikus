'use client'

import { useState } from 'react'
import { deleteSource } from '@/app/actions/notebooks'
import { AddSourceModal } from './AddSourceModal'
import type { NotebookSourceData } from '@/app/actions/notebooks'

const TYPE_EMOJI: Record<string, string> = {
  doc:  '📄',
  pdf:  '📑',
  text: '📝',
  url:  '🔗',
}

const CHAR_LIMIT = 400_000

interface Props {
  notebookId:      string
  initialSources:  NotebookSourceData[]
  workspaceDocs:   { id: string; title: string }[]
  workspacePdfs:   { id: string; title: string }[]
  onSourcesChange: (sources: NotebookSourceData[]) => void
}

export function SourcePanel({
  notebookId,
  initialSources,
  workspaceDocs,
  workspacePdfs,
  onSourcesChange,
}: Props) {
  const [sources,    setSources]    = useState<NotebookSourceData[]>(initialSources)
  const [showModal,  setShowModal]  = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const totalChars = sources.reduce((acc, s) => acc + s.charCount, 0)

  async function handleDelete(sourceId: string) {
    setDeletingId(sourceId)
    await deleteSource(sourceId, notebookId)
    const next = sources.filter((s) => s.id !== sourceId)
    setSources(next)
    onSourcesChange(next)
    setDeletingId(null)
  }

  function handleAdded(source: NotebookSourceData) {
    const next = [...sources, source]
    setSources(next)
    onSourcesChange(next)
  }

  const pct = Math.round((totalChars / CHAR_LIMIT) * 100)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {sources.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Añade fuentes para empezar.
          </p>
        )}
        {sources.map((s) => (
          <div key={s.id} className="group flex items-center gap-2 rounded-md p-2 hover:bg-muted/50">
            <span className="text-base shrink-0">{TYPE_EMOJI[s.type] ?? '📎'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{s.title}</p>
              <p className="text-xs text-muted-foreground">{(s.charCount / 1000).toFixed(1)}k chars</p>
            </div>
            <button
              onClick={() => handleDelete(s.id)}
              disabled={deletingId === s.id}
              className="hidden group-hover:flex items-center justify-center w-4 h-4 rounded text-muted-foreground hover:text-destructive text-xs shrink-0"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="border-t p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Contexto</span>
          <span className={pct > 90 ? 'text-destructive font-medium' : ''}>{pct}%</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct > 90 ? 'bg-destructive' : 'bg-primary'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={pct >= 100}
          className="w-full rounded-md border border-dashed border-border py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Añadir fuente
        </button>
      </div>

      {showModal && (
        <AddSourceModal
          notebookId={notebookId}
          workspaceDocs={workspaceDocs}
          workspacePdfs={workspacePdfs}
          onClose={() => setShowModal(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  )
}
