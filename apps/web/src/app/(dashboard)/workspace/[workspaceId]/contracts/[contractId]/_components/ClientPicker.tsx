'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { searchClients, createClientQuick } from '@/app/actions/clients'
import type { ClientSummary } from '@/app/actions/clients'

type Props = {
  workspaceId: string
  value:       ClientSummary | null
  onChange:    (client: ClientSummary | null) => void
}

export function ClientPicker({ workspaceId, value, onChange }: Props) {
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState<ClientSummary[]>([])
  const [open,      setOpen]      = useState(false)
  const [creating,  setCreating]  = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef    = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const data = await searchClients(workspaceId, query)
        setResults(data)
      })
    }, 200)
    return () => clearTimeout(timer)
  }, [query, workspaceId])

  function selectClient(client: ClientSummary) {
    onChange(client)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  async function handleCreateNew() {
    if (!query.trim()) return
    setCreating(true)
    try {
      const isEmail = query.includes('@')
      const client = await createClientQuick(workspaceId, {
        name:  isEmail ? (query.split('@')[0] ?? query) : query,
        email: isEmail ? query : undefined,
      })
      selectClient(client)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {value && !open ? (
        <div
          className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-muted/40"
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0) }}
        >
          <div className="min-w-0">
            <span className="font-medium">{value.name}</span>
            {value.email && (
              <span className="ml-2 text-muted-foreground text-xs">{value.email}</span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); setQuery('') }}
            className="text-muted-foreground hover:text-foreground text-base leading-none ml-2 shrink-0"
            aria-label="Quitar cliente"
          >
            ×
          </button>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar por nombre, email o NIF…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          autoComplete="off"
        />
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden">
          {isPending && (
            <div className="px-3 py-2 text-xs text-muted-foreground">Buscando…</div>
          )}

          {results.map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() => selectClient(client)}
              className="w-full flex flex-col items-start px-3 py-2 text-sm hover:bg-muted/40 text-left"
            >
              <span className="font-medium">{client.name}</span>
              {(client.email || client.taxId) && (
                <span className="text-xs text-muted-foreground">
                  {[client.email, client.taxId].filter(Boolean).join(' · ')}
                </span>
              )}
            </button>
          ))}

          {query.trim().length >= 2 && (
            <button
              type="button"
              onClick={handleCreateNew}
              disabled={creating}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-muted/40 border-t disabled:opacity-50"
            >
              <span className="text-base leading-none">+</span>
              <span>{creating ? 'Creando…' : `Crear "${query.trim()}"`}</span>
            </button>
          )}

          {results.length === 0 && !isPending && query.length >= 2 && !creating && (
            <div className="px-3 py-2 text-xs text-muted-foreground border-t">
              Sin resultados — pulsa "Crear" para añadirlo
            </div>
          )}

          {query.length < 2 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Escribe al menos 2 caracteres…
            </div>
          )}
        </div>
      )}
    </div>
  )
}
