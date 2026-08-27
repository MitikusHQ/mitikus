'use client'

import { useState, useRef } from 'react'
import type { BrainFragment } from '@/lib/brain/brain-search'

interface BrainResult {
  answer: string
  sources: BrainFragment[]
}

interface Props {
  workspaceId: string
  compact?: boolean
  onNavigateToFull?: () => void
  onOpenMemorySource?: (memoryId: string) => void
}

const QUICK_ACTIONS = [
  { label: '¿Qué hago ahora?', query: '¿Cuáles son las tareas y objetivos más urgentes actualmente?' },
  { label: 'Decisiones recientes', query: 'Decisiones importantes tomadas recientemente en el workspace' },
  { label: 'Objetivos activos', query: 'Objetivos y misiones activas en este momento' },
  { label: 'Fricciones', query: 'Problemas, riesgos o fricciones identificadas en el workspace' },
]

const SOURCE_TYPE_LABELS: Record<BrainFragment['type'], string> = {
  document:     'Documento',
  memory:       'Memoria',
  conversation: 'Conversación',
  tool:         'Herramienta',
}

const SOURCE_TYPE_COLORS: Record<BrainFragment['type'], string> = {
  document:     'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  memory:       'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  conversation: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  tool:         'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

export function BrainPanel({ workspaceId, compact = false, onNavigateToFull, onOpenMemorySource }: Props) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BrainResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(q: string) {
    const trimmed = q.trim()
    if (!trimmed || loading) return
    setQuery(trimmed)
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/brain/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, query: trimmed }),
      })
      const data = (await res.json()) as BrainResult | { error: string }
      if (!res.ok) {
        setError((data as { error: string }).error ?? 'Error al consultar el Brain')
      } else {
        setResult(data as BrainResult)
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit(query)
  }

  async function handleCopy() {
    if (!result?.answer) return
    await navigator.clipboard.writeText(result.answer)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleClear() {
    setQuery('')
    setResult(null)
    setError(null)
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="¿Qué quieres consultar?"
          className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={loading}
          autoFocus
        />
        <button
          type="button"
          onClick={() => handleSubmit(query)}
          disabled={loading || !query.trim()}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            '✦'
          )}
        </button>
      </div>

      {!result && !loading && (
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => handleSubmit(action.query)}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3">
          {error}
        </p>
      )}

      {result && (
        <div className="flex flex-col gap-4 flex-1 overflow-y-auto min-h-0">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">
                Respuesta · {result.sources.length} fuente{result.sources.length !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
                >
                  {copied ? '✓ Copiado' : 'Copiar'}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
                >
                  Limpiar
                </button>
              </div>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.answer}</p>
          </div>

          {result.sources.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Fuentes</p>
              {result.sources.map((source, i) => (
                <div
                  key={`${source.type}-${source.id}`}
                  className="rounded-lg border border-border bg-card/50 px-3 py-2.5 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${SOURCE_TYPE_COLORS[source.type]}`}>
                      {SOURCE_TYPE_LABELS[source.type]}
                    </span>
                    <span className="text-xs font-medium truncate flex-1">{source.title}</span>
                    <span className="text-[10px] text-muted-foreground/40 shrink-0">[{i + 1}]</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{source.excerpt}</p>
                  {source.type === 'memory' && onOpenMemorySource && (
                    <button
                      type="button"
                      onClick={() => onOpenMemorySource(source.id)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Ver memoria
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {compact && onNavigateToFull && (
            <button
              type="button"
              onClick={onNavigateToFull}
              className="mt-auto text-xs text-primary hover:underline self-end"
            >
              Ver en Brain →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
