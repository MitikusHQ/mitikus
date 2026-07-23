'use client'

import { useState, useCallback } from 'react'
import { updateNotebook } from '@/app/actions/notebooks'
import { SourcePanel }    from './SourcePanel'
import { SynthesisPanel } from './SynthesisPanel'
import { ChatPanel }      from './ChatPanel'
import type { NotebookDetail, NotebookSourceData, SynthesisCache } from '@/app/actions/notebooks'

interface Props {
  notebook:      NotebookDetail
  workspaceId:   string
  workspaceDocs: { id: string; title: string }[]
  workspacePdfs: { id: string; title: string }[]
}

export function NotebookClient({ notebook, workspaceId, workspaceDocs, workspacePdfs }: Props) {
  const [title,             setTitle]             = useState(notebook.title)
  const [sources,           setSources]           = useState(notebook.sources)
  const [synthesis,         setSynthesis]         = useState(notebook.synthesisCache)
  const [isDirty,           setIsDirty]           = useState(notebook.synthesisDirty)
  const [suggestedQuestion, setSuggestedQuestion] = useState<string>('')

  async function handleTitleBlur() {
    if (title !== notebook.title) await updateNotebook(notebook.id, title)
  }

  const handleSourcesChange = useCallback((next: NotebookSourceData[]) => {
    setSources(next)
    setIsDirty(true)

    if (next.length === 1 && (notebook.title === 'Nuevo notebook' || !notebook.title)) {
      void fetch(`/api/notebooks/${notebook.id}/suggest-title`, { method: 'POST' })
        .then((r) => r.json())
        .then((data: { title?: string }) => { if (data.title) setTitle(data.title) })
        .catch(() => null)
    }
  }, [notebook.id, notebook.title])

  const handleSynthesisReady = useCallback((s: SynthesisCache) => {
    setSynthesis(s)
    setIsDirty(false)
  }, [])

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Panel izquierdo: fuentes */}
      <div className="w-64 border-r flex flex-col shrink-0">
        <div className="p-3 border-b">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="w-full bg-transparent text-sm font-medium focus:outline-none placeholder:text-muted-foreground truncate"
            placeholder="Nombre del notebook"
          />
        </div>
        <SourcePanel
          notebookId={notebook.id}
          initialSources={sources}
          workspaceDocs={workspaceDocs}
          workspacePdfs={workspacePdfs}
          onSourcesChange={handleSourcesChange}
        />
      </div>

      {/* Panel derecho: síntesis + chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <SynthesisPanel
          notebookId={notebook.id}
          initialSynthesis={synthesis}
          isDirty={isDirty}
          hasNoSources={sources.length === 0}
          onQuestionClick={(q) => setSuggestedQuestion(q)}
          onSynthesisReady={handleSynthesisReady}
        />
        <div className="flex-1 overflow-hidden">
          <ChatPanel
            notebookId={notebook.id}
            initialMessages={notebook.messages}
            sources={sources}
            suggestedQuestion={suggestedQuestion}
            onSuggestedQuestionUsed={() => setSuggestedQuestion('')}
          />
        </div>
      </div>
    </div>
  )
}
