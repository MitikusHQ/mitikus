'use client'

import { useState } from 'react'
import { addSource } from '@/app/actions/notebooks'
import type { NotebookSourceData } from '@/app/actions/notebooks'

type Tab = 'doc' | 'pdf' | 'text' | 'url'

interface Props {
  notebookId:    string
  workspaceDocs: { id: string; title: string }[]
  workspacePdfs: { id: string; title: string }[]
  onClose:       () => void
  onAdded:       (source: NotebookSourceData) => void
}

export function AddSourceModal({ notebookId, workspaceDocs, workspacePdfs, onClose, onAdded }: Props) {
  const [tab,       setTab]       = useState<Tab>('doc')
  const [docId,     setDocId]     = useState('')
  const [pdfId,     setPdfId]     = useState('')
  const [text,      setText]      = useState('')
  const [textTitle, setTextTitle] = useState('')
  const [url,       setUrl]       = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  async function handleAdd() {
    setLoading(true)
    setError('')
    try {
      let input: Parameters<typeof addSource>[1]
      if (tab === 'doc')       input = { type: 'doc',  docId }
      else if (tab === 'pdf')  input = { type: 'pdf',  pdfId }
      else if (tab === 'text') input = { type: 'text', text, title: textTitle }
      else                     input = { type: 'url',  url }

      const source = await addSource(notebookId, input)
      onAdded(source)
      onClose()
    } catch (e) {
      const msg = 'No se pudo añadir la fuente. Inténtalo de nuevo.'
      if (msg.startsWith('LIMIT_EXCEEDED')) {
        setError('Has alcanzado el límite de contexto. Elimina alguna fuente para añadir una nueva.')
      } else if (tab === 'url') {
        setError('No se pudo cargar el contenido de esa URL. Verifica que sea accesible públicamente.')
      } else {
        setError('Error al añadir la fuente. Inténtalo de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const canAdd =
    (tab === 'doc'  && !!docId) ||
    (tab === 'pdf'  && !!pdfId) ||
    (tab === 'text' && !!text.trim()) ||
    (tab === 'url'  && !!url.trim())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg border shadow-lg w-full max-w-lg mx-4 p-6">
        <h2 className="text-base font-semibold mb-4">Añadir fuente</h2>

        <div className="flex gap-1 mb-4 border-b">
          {(['doc', 'pdf', 'text', 'url'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
                tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'doc' ? '📄 Documento' : t === 'pdf' ? '📑 PDF' : t === 'text' ? '📝 Texto' : '🔗 URL'}
            </button>
          ))}
        </div>

        <div className="space-y-3 min-h-[120px]">
          {tab === 'doc' && (
            workspaceDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No hay documentos en este workspace.
              </p>
            ) : (
              <select
                value={docId}
                onChange={(e) => setDocId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecciona un documento...</option>
                {workspaceDocs.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            )
          )}

          {tab === 'pdf' && (
            workspacePdfs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No hay PDFs en este workspace.
              </p>
            ) : (
              <select
                value={pdfId}
                onChange={(e) => setPdfId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecciona un PDF...</option>
                {workspacePdfs.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            )
          )}

          {tab === 'text' && (
            <>
              <input
                type="text"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                placeholder="Título (opcional)"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Pega el texto aquí..."
                rows={6}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </>
          )}

          {tab === 'url' && (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          )}
        </div>

        {error && <p className="text-xs text-destructive mt-2">{error}</p>}

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-md border border-input px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            disabled={loading || !canAdd}
            className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (tab === 'url' ? 'Extrayendo...' : 'Añadiendo...') : 'Añadir fuente'}
          </button>
        </div>
      </div>
    </div>
  )
}
