'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type ResultType =
  | 'doc' | 'pdf' | 'contract' | 'notebook'
  | 'sheet' | 'presentation' | 'task' | 'mission'
  | 'client' | 'tool'

interface SearchResult {
  id:        string
  type:      ResultType
  label:     string
  sub?:      string
  href:      string
  createdAt: string
  updatedAt: string
}

const TYPE_LABEL: Record<ResultType, string> = {
  doc:          'Documento',
  pdf:          'PDF',
  contract:     'Contrato',
  notebook:     'Notebook',
  sheet:        'Hoja de cálculo',
  presentation: 'Presentación',
  task:         'Tarea',
  mission:      'Misión',
  client:       'Cliente',
  tool:         'Herramienta',
}

const TYPE_ICON: Record<ResultType, string> = {
  doc:          '📄',
  pdf:          '📑',
  contract:     '✍️',
  notebook:     '🧠',
  sheet:        '📊',
  presentation: '🎯',
  task:         '✅',
  mission:      '🎪',
  client:       '🏢',
  tool:         '🔧',
}

const ALL_TYPES: ResultType[] = [
  'doc', 'pdf', 'contract', 'notebook',
  'sheet', 'presentation', 'task', 'mission', 'client', 'tool',
]

function relativeDate(iso: string): string {
  const d    = new Date(iso)
  const now  = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'hoy'
  if (days === 1) return 'ayer'
  if (days < 7)  return `hace ${days} días`
  if (days < 30) return `hace ${Math.floor(days / 7)} sem.`
  if (days < 365) return `hace ${Math.floor(days / 30)} meses`
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface Props { workspaceId: string }

export function GlobalSearch({ workspaceId }: Props) {
  const router = useRouter()
  const [open,       setOpen]       = useState(false)
  const [query,      setQuery]      = useState('')
  const [results,    setResults]    = useState<SearchResult[]>([])
  const [loading,    setLoading]    = useState(false)
  const [active,     setActive]     = useState(0)
  const [showFilters,setShowFilters]= useState(false)
  const [from,       setFrom]       = useState('')
  const [to,         setTo]         = useState('')
  const [modifiedFrom, setModifiedFrom] = useState('')
  const [modifiedTo,   setModifiedTo]   = useState('')
  const [activeTypes,  setActiveTypes]  = useState<ResultType[]>([])

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

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery(''); setResults([]); setActive(0)
    }
  }, [open])

  const buildUrl = useCallback((q: string) => {
    const url = new URL(`/api/workspace/${workspaceId}/search`, location.origin)
    url.searchParams.set('q', q)
    if (from)         url.searchParams.set('from', from)
    if (to)           url.searchParams.set('to', to)
    if (modifiedFrom) url.searchParams.set('modifiedFrom', modifiedFrom)
    if (modifiedTo)   url.searchParams.set('modifiedTo', modifiedTo)
    if (activeTypes.length > 0) url.searchParams.set('types', activeTypes.join(','))
    return url.toString()
  }, [workspaceId, from, to, modifiedFrom, modifiedTo, activeTypes])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res  = await fetch(buildUrl(q))
      const data = await res.json()
      setResults(data.results ?? [])
      setActive(0)
    } finally {
      setLoading(false)
    }
  }, [buildUrl])

  // Re-search when filters change
  useEffect(() => {
    if (query.length >= 2) void search(query)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, modifiedFrom, modifiedTo, activeTypes])

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

  function toggleType(t: ResultType) {
    setActiveTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    )
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

  const hasFilters = from || to || modifiedFrom || modifiedTo || activeTypes.length > 0

  const groups = ALL_TYPES
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
        <kbd className="ml-1 text-[10px] font-mono bg-muted border rounded px-1 py-0.5 leading-none">⌘K</kbd>
      </button>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />

      <div
        role="dialog"
        aria-modal
        aria-label="Búsqueda global"
        className="fixed top-[8%] left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl bg-card border rounded-xl shadow-2xl overflow-hidden"
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
            placeholder="Buscar en todos los documentos, clientes, contratos…"
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          {loading && <LoadingDots />}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`text-xs px-2 py-1 rounded border transition-colors shrink-0 ${
              hasFilters
                ? 'border-primary text-primary bg-primary/5'
                : 'border-input text-muted-foreground hover:bg-muted'
            }`}
          >
            Filtros{hasFilters ? ' ●' : ''}
          </button>
          <kbd
            className="text-[10px] font-mono text-muted-foreground bg-muted border rounded px-1.5 py-0.5 leading-none shrink-0 cursor-pointer"
            onClick={() => setOpen(false)}
          >
            Esc
          </kbd>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="border-b bg-muted/30 px-4 py-3 space-y-3">
            {/* Type chips */}
            <div className="flex flex-wrap gap-1.5">
              {ALL_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                    activeTypes.includes(t)
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-input text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {TYPE_ICON[t]} {TYPE_LABEL[t]}
                </button>
              ))}
              {activeTypes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTypes([])}
                  className="text-[11px] px-2 py-0.5 text-muted-foreground hover:text-foreground"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Date filters */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Creado entre</p>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="flex-1 text-xs rounded border border-input bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <span className="text-muted-foreground text-xs">–</span>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="flex-1 text-xs rounded border border-input bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Modificado entre</p>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={modifiedFrom}
                    onChange={(e) => setModifiedFrom(e.target.value)}
                    className="flex-1 text-xs rounded border border-input bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <span className="text-muted-foreground text-xs">–</span>
                  <input
                    type="date"
                    value={modifiedTo}
                    onChange={(e) => setModifiedTo(e.target.value)}
                    className="flex-1 text-xs rounded border border-input bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
            {(from || to || modifiedFrom || modifiedTo) && (
              <button
                type="button"
                onClick={() => { setFrom(''); setTo(''); setModifiedFrom(''); setModifiedTo('') }}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Limpiar fechas
              </button>
            )}
          </div>
        )}

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.length >= 2 && !loading && results.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Sin resultados para &ldquo;{query}&rdquo;
              {hasFilters && <span className="block text-xs mt-1">Prueba a ampliar los filtros de fecha o tipo</span>}
            </p>
          )}

          {query.length < 2 && !hasFilters && (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              Escribe al menos 2 caracteres · Busca en documentos, PDFs, contratos, hojas, presentaciones, tareas, misiones, clientes y herramientas
            </p>
          )}

          {query.length < 2 && hasFilters && (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">
              Escribe al menos 2 caracteres para buscar con los filtros aplicados
            </p>
          )}

          {groups.map((group) => (
            <div key={group.type}>
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted/40 flex items-center gap-1.5">
                <span>{TYPE_ICON[group.type]}</span>
                <span>{TYPE_LABEL[group.type]}</span>
                <span className="ml-auto font-normal normal-case tracking-normal">{group.items.length}</span>
              </p>
              {group.items.map((item) => {
                const idx = results.findIndex((r) => r.id === item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.href)}
                    onMouseEnter={() => setActive(idx)}
                    className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                      active === idx ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-base shrink-0 mt-0.5">{TYPE_ICON[item.type]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      {item.sub && (
                        <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        Creado {relativeDate(item.createdAt)}
                        {item.updatedAt !== item.createdAt && (
                          <> · Modificado {relativeDate(item.updatedAt)}</>
                        )}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 mt-0.5">↵</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {results.length > 0 && (
          <div className="px-4 py-2 border-t bg-muted/20 flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>↑↓ navegar</span>
            <span>↵ abrir</span>
            <span>Esc cerrar</span>
            <span className="ml-auto">{results.length} resultado{results.length !== 1 ? 's' : ''}</span>
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
