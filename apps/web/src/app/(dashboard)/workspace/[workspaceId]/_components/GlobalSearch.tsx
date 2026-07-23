'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id:    string
  type:  'tool' | 'client' | 'mission' | 'execution' | 'doc' | 'pdf' | 'contract' | 'notebook'
  label: string
  sub?:  string
  href:  string
}

const TYPE_LABEL: Record<SearchResult['type'], string> = {
  tool:      'Herramienta',
  client:    'Cliente',
  mission:   'Misión',
  execution: 'Ejecución',
  doc:       'Documento',
  pdf:       'PDF',
  contract:  'Contrato',
  notebook:  'Notebook',
}

const TYPE_ICON: Record<SearchResult['type'], string> = {
  tool:      '🔧',
  client:    '🏢',
  mission:   '🎯',
  execution: '⚡',
  doc:       '📄',
  pdf:       '📑',
  contract:  '✍️',
  notebook:  '🧠',
}

interface Props {
  workspaceId: string
}

export function GlobalSearch({ workspaceId }: Props) {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [active, setActive]   = useState(0)
  const inputRef  = useRef<HTMLInputElement>(null)
  const debouncer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cmd+K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Focus input when open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults([])
      setActive(0)
    }
  }, [open])

  // Debounced search
  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/workspace/${workspaceId}/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results ?? [])
      setActive(0)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (debouncer.current) clearTimeout(debouncer.current)
    debouncer.current = setTimeout(() => void search(val), 220)
  }

  function navigate(href: string) {
    setOpen(false)
    router.push(href)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && results[active]) {
      navigate(results[active].href)
    }
  }

  // Group results by type
  const groups = (['tool', 'client', 'mission', 'execution', 'doc', 'pdf', 'contract', 'notebook'] as const)
    .map((type) => ({ type, items: results.filter((r) => r.type === type) }))
    .filter((g) => g.items.length > 0)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buscar"
        className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-md border bg-background text-muted-foreground text-xs hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <SearchIcon />
        <span>Buscar…</span>
        <kbd className="ml-1 text-[10px] font-mono bg-muted border rounded px-1 py-0.5 leading-none">
          ⌘K
        </kbd>
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal
        aria-label="Búsqueda global"
        className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-full max-w-xl bg-card border rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <SearchIcon className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Buscar documentos, PDFs, contratos, notebooks…"
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          {loading && <LoadingDots />}
          <kbd
            className="text-[10px] font-mono text-muted-foreground bg-muted border rounded px-1.5 py-0.5 leading-none shrink-0 cursor-pointer"
            onClick={() => setOpen(false)}
          >
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.length >= 2 && !loading && results.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Sin resultados para &ldquo;{query}&rdquo;
            </p>
          )}

          {query.length < 2 && (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              Escribe al menos 2 caracteres para buscar
            </p>
          )}

          {groups.map((group) => {
            // Compute flat index offset for active tracking
            const offset = results.findIndex((r) => r.id === group.items[0]?.id)
            return (
              <div key={group.type}>
                <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted/40">
                  {TYPE_LABEL[group.type]}
                </p>
                {group.items.map((item) => {
                  const idx = results.findIndex((r) => r.id === item.id)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setActive(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        active === idx ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                      }`}
                    >
                      <span className="text-base shrink-0">{TYPE_ICON[item.type]}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        {item.sub && (
                          <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">↵</span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        {results.length > 0 && (
          <div className="px-4 py-2 border-t bg-muted/20 flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>↑↓ navegar</span>
            <span>↵ abrir</span>
            <span>Esc cerrar</span>
          </div>
        )}
      </div>
    </>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function LoadingDots() {
  return (
    <span className="inline-flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  )
}
