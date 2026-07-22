'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'

interface Match {
  page:  number
  count: number
}

interface Props {
  pdfDoc:      PDFDocumentProxy | null
  onMatchPage: (page: number) => void
}

declare global { interface Window { find: (str: string, ...args: boolean[]) => boolean } }

export function PdfSearchBar({ pdfDoc, onMatchPage }: Props) {
  const [query, setQuery]             = useState('')
  const [matches, setMatches]         = useState<Match[]>([])
  const [currentIdx, setCurrentIdx]   = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef                   = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  const searchInPdf = useCallback(async (q: string) => {
    if (!pdfDoc || !q.trim()) {
      setMatches([])
      setCurrentIdx(0)
      return
    }

    setIsSearching(true)
    const found: Match[] = []
    const lower = q.toLowerCase()

    for (let p = 1; p <= pdfDoc.numPages; p++) {
      const page    = await pdfDoc.getPage(p)
      const content = await page.getTextContent()
      const text    = content.items
        .map((item) => ('str' in item ? (item as { str: string }).str : ''))
        .join(' ')
        .toLowerCase()

      let count = 0
      let pos   = text.indexOf(lower)
      while (pos !== -1) {
        count++
        pos = text.indexOf(lower, pos + 1)
      }

      if (count > 0) found.push({ page: p, count })
    }

    setMatches(found)
    setCurrentIdx(0)
    setIsSearching(false)

    if (found.length > 0) {
      onMatchPage(found[0]!.page)
      requestAnimationFrame(() => {
        try { window.find(q, false, false, true, false, false, false) } catch { /* no-op */ }
      })
    }
  }, [pdfDoc, onMatchPage])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchInPdf(val), 300)
  }

  function goNext() {
    if (matches.length === 0) return
    const next = (currentIdx + 1) % matches.length
    setCurrentIdx(next)
    onMatchPage(matches[next]!.page)
    requestAnimationFrame(() => {
      try { window.find(query, false, false, true, false, false, false) } catch { /* no-op */ }
    })
  }

  function goPrev() {
    if (matches.length === 0) return
    const prev = (currentIdx - 1 + matches.length) % matches.length
    setCurrentIdx(prev)
    onMatchPage(matches[prev]!.page)
    requestAnimationFrame(() => {
      try { window.find(query, false, false, false, false, false, false) } catch { /* no-op */ }
    })
  }

  const hasQuery  = query.trim().length > 0
  const noResults = hasQuery && !isSearching && matches.length === 0

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm" aria-hidden>🔍</span>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Buscar…"
        aria-label="Buscar en el PDF"
        className={[
          'text-xs border rounded px-2 py-0.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary w-28 transition-colors',
          noResults ? 'border-destructive/60' : 'border-border',
        ].join(' ')}
      />
      {hasQuery && (
        <>
          <span
            className={[
              'text-xs whitespace-nowrap',
              noResults ? 'text-destructive/70' : 'text-muted-foreground',
            ].join(' ')}
            aria-live="polite"
          >
            {isSearching ? '…' : `${currentIdx + (matches.length > 0 ? 1 : 0)} / ${matches.length}`}
          </span>
          <button
            onClick={goPrev}
            disabled={matches.length === 0 || isSearching}
            className="text-xs border border-border px-1.5 py-0.5 rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Coincidencia anterior"
          >
            ↑
          </button>
          <button
            onClick={goNext}
            disabled={matches.length === 0 || isSearching}
            className="text-xs border border-border px-1.5 py-0.5 rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Coincidencia siguiente"
          >
            ↓
          </button>
        </>
      )}
    </div>
  )
}
