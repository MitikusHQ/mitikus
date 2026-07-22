# PDF Viewer Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir miniaturas de página con toggle lateral y búsqueda de texto con navegación entre coincidencias al visor PDF de MITIKUS.

**Architecture:** Se crean dos componentes nuevos (`PdfThumbnailSidebar` y `PdfSearchBar`) que se integran en el `PdfViewer` existente. Las miniaturas usan `<Page scale={0.12}>` de react-pdf con lazy loading via `IntersectionObserver`. La búsqueda usa la API nativa de pdfjs-dist (`PDFDocumentProxy`) que react-pdf ya expone en el callback `onLoadSuccess`. El resaltado usa `window.find()` tras el render de cada página.

**Tech Stack:** react-pdf v10, pdfjs-dist (ya instalado), TypeScript, Tailwind CSS. Sin nuevas dependencias.

---

## Archivos

| Acción | Archivo | Responsabilidad |
|--------|---------|----------------|
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/[pdfId]/_components/PdfThumbnailSidebar.tsx` | Panel lateral con miniaturas lazy, resalta página activa |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/[pdfId]/_components/PdfSearchBar.tsx` | Input búsqueda + contador N/total + botones ↑↓ |
| Modify | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/[pdfId]/_components/PdfViewer.tsx` | Integra sidebar (toggle) y SearchBar en toolbar, expone PDFDocumentProxy |

---

### Task 1: Crear `PdfThumbnailSidebar.tsx`

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/[pdfId]/_components/PdfThumbnailSidebar.tsx`

- [ ] **Step 1: Crear el archivo completo**

```typescript
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/[pdfId]/_components/PdfThumbnailSidebar.tsx
'use client'

import { useRef, useState, useEffect } from 'react'
import { Document, Page } from 'react-pdf'

interface Props {
  pdfData:      { data: Uint8Array }
  numPages:     number
  currentPage:  number
  onPageSelect: (page: number) => void
}

// Tamaño aproximado de una miniatura A4 a scale=0.12 (595*0.12 x 842*0.12 = 71x101px)
const THUMB_W = 71
const THUMB_H = 101

function LazyThumbnail({
  pdfData,
  pageNumber,
  isActive,
  onSelect,
}: {
  pdfData:    { data: Uint8Array }
  pageNumber: number
  isActive:   boolean
  onSelect:   () => void
}) {
  const ref                     = useRef<HTMLDivElement>(null)
  const [visible, setVisible]   = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      onClick={onSelect}
      className={[
        'flex flex-col items-center gap-1 cursor-pointer rounded p-1 transition-colors',
        isActive
          ? 'border-2 border-primary bg-primary/5'
          : 'border border-border hover:border-primary/40',
      ].join(' ')}
      style={{ width: THUMB_W + 8 }}
    >
      {visible ? (
        <Document file={pdfData} loading={null} error={null}>
          <Page
            pageNumber={pageNumber}
            scale={0.12}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            width={THUMB_W}
          />
        </Document>
      ) : (
        <div
          style={{ width: THUMB_W, height: THUMB_H }}
          className="bg-muted rounded animate-pulse"
        />
      )}
      <span
        className={[
          'text-[9px] font-medium',
          isActive ? 'text-primary' : 'text-muted-foreground',
        ].join(' ')}
      >
        {pageNumber}
      </span>
    </div>
  )
}

export function PdfThumbnailSidebar({ pdfData, numPages, currentPage, onPageSelect }: Props) {
  return (
    <div className="flex flex-col gap-2 overflow-y-auto pr-1" style={{ width: 88, maxHeight: '70vh' }}>
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground text-center">Págs</p>
      {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
        <LazyThumbnail
          key={n}
          pdfData={pdfData}
          pageNumber={n}
          isActive={n === currentPage}
          onSelect={() => onPageSelect(n)}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check del archivo**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | Select-String "PdfThumbnailSidebar" | Select-Object -First 10
```

Expected: sin output (sin errores en ese archivo).

- [ ] **Step 3: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/[pdfId]/_components/PdfThumbnailSidebar.tsx"
git commit -m "feat: add lazy thumbnail sidebar for PDF viewer"
```

---

### Task 2: Crear `PdfSearchBar.tsx`

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/[pdfId]/_components/PdfSearchBar.tsx`

**Nota técnica:** `PDFDocumentProxy` es el tipo de pdfjs-dist. En react-pdf v10 el callback `onLoadSuccess` recibe directamente el `PDFDocumentProxy`. El tipo se importa de `pdfjs-dist/types/src/display/api`.

- [ ] **Step 1: Crear el archivo completo**

```typescript
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/[pdfId]/_components/PdfSearchBar.tsx
'use client'

import { useState, useCallback, useRef } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'

interface Match {
  page:  number
  count: number  // número de ocurrencias en esa página (para informar, no para indexar)
}

interface Props {
  pdfDoc:      PDFDocumentProxy | null
  onMatchPage: (page: number) => void
}

export function PdfSearchBar({ pdfDoc, onMatchPage }: Props) {
  const [query, setQuery]               = useState('')
  const [matches, setMatches]           = useState<Match[]>([])
  const [currentIdx, setCurrentIdx]     = useState(0)
  const [isSearching, setIsSearching]   = useState(false)
  const debounceRef                     = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        .map((item) => ('str' in item ? item.str : ''))
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
      onMatchPage(found[0].page)
      // Intentar resaltar con window.find tras un tick para que el DOM esté listo
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
    onMatchPage(matches[next].page)
    requestAnimationFrame(() => {
      try { window.find(query, false, false, true, false, false, false) } catch { /* no-op */ }
    })
  }

  function goPrev() {
    if (matches.length === 0) return
    const prev = (currentIdx - 1 + matches.length) % matches.length
    setCurrentIdx(prev)
    onMatchPage(matches[prev].page)
    requestAnimationFrame(() => {
      try { window.find(query, false, false, false, false, false, false) } catch { /* no-op */ }
    })
  }

  const totalMatches = matches.reduce((acc, m) => acc + m.count, 0)
  const hasQuery     = query.trim().length > 0
  const noResults    = hasQuery && !isSearching && totalMatches === 0

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm">🔍</span>
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
          <span className={['text-xs whitespace-nowrap', noResults ? 'text-destructive/70' : 'text-muted-foreground'].join(' ')}>
            {isSearching ? '…' : `${currentIdx + (totalMatches > 0 ? 1 : 0)} / ${totalMatches}`}
          </span>
          <button
            onClick={goPrev}
            disabled={totalMatches === 0 || isSearching}
            className="text-xs border border-border px-1.5 py-0.5 rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Coincidencia anterior"
          >
            ↑
          </button>
          <button
            onClick={goNext}
            disabled={totalMatches === 0 || isSearching}
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
```

- [ ] **Step 2: TypeScript check**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | Select-String "PdfSearchBar" | Select-Object -First 10
```

Expected: sin errores en ese archivo. Si el tipo `PDFDocumentProxy` no resuelve desde `pdfjs-dist`, prueba importarlo desde `pdfjs-dist/types/src/display/api` o usa `import type { PDFDocumentProxy } from 'react-pdf'` (react-pdf v10 re-exporta los tipos de pdfjs).

- [ ] **Step 3: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/[pdfId]/_components/PdfSearchBar.tsx"
git commit -m "feat: add text search bar with match navigation for PDF viewer"
```

---

### Task 3: Actualizar `PdfViewer.tsx` — integrar sidebar y búsqueda

**Files:**
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/[pdfId]/_components/PdfViewer.tsx`

Estado actual del archivo (léelo antes de modificar):
- Importa `{ useState, useMemo }` de react
- Tiene estados: `numPages`, `pageNumber`, `scale`
- Callback `onDocumentLoadSuccess({ numPages })`
- Toolbar con navegación (← →) y zoom (− + %)
- `<Document>` con `<Page renderTextLayer={true} renderAnnotationLayer={true} />`

- [ ] **Step 1: Reemplazar el archivo completo con la versión actualizada**

```typescript
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/[pdfId]/_components/PdfViewer.tsx
'use client'

import { useState, useMemo, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { PdfThumbnailSidebar } from './PdfThumbnailSidebar'
import { PdfSearchBar } from './PdfSearchBar'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

interface Props {
  dataArray: number[]
  title:     string
}

export function PdfViewer({ dataArray, title }: Props) {
  const [numPages, setNumPages]         = useState<number | null>(null)
  const [pageNumber, setPageNumber]     = useState(1)
  const [scale, setScale]               = useState(1.0)
  const [showSidebar, setShowSidebar]   = useState(false)
  const pdfDocRef                       = useRef<PDFDocumentProxy | null>(null)
  const [pdfDocState, setPdfDocState]   = useState<PDFDocumentProxy | null>(null)

  const pdfData = useMemo(() => {
    const bytes = new Uint8Array(dataArray)
    return { data: bytes }
  }, [dataArray])

  function onDocumentLoadSuccess(pdf: PDFDocumentProxy) {
    setNumPages(pdf.numPages)
    setPageNumber(1)
    pdfDocRef.current = pdf
    setPdfDocState(pdf)
  }

  function prevPage() {
    setPageNumber((p) => Math.max(1, p - 1))
  }

  function nextPage() {
    setPageNumber((p) => Math.min(numPages ?? 1, p + 1))
  }

  function zoomIn() {
    setScale((s) => Math.min(2.0, parseFloat((s + 0.2).toFixed(1))))
  }

  function zoomOut() {
    setScale((s) => Math.max(0.5, parseFloat((s - 0.2).toFixed(1))))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2 w-full justify-between flex-wrap gap-y-2">
        {/* Toggle sidebar */}
        <button
          onClick={() => setShowSidebar((s) => !s)}
          className={[
            'text-sm px-2 py-1 rounded border transition-colors',
            showSidebar
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border hover:bg-muted',
          ].join(' ')}
          aria-label={showSidebar ? 'Ocultar miniaturas' : 'Mostrar miniaturas'}
          title={showSidebar ? 'Ocultar miniaturas' : 'Mostrar miniaturas'}
        >
          ⊞
        </button>

        {/* Navegación páginas */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevPage}
            disabled={pageNumber <= 1}
            className="text-sm px-2 py-1 rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Página anterior"
          >
            ←
          </button>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Pág {pageNumber} / {numPages ?? '…'}
          </span>
          <button
            onClick={nextPage}
            disabled={pageNumber >= (numPages ?? 1)}
            className="text-sm px-2 py-1 rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Página siguiente"
          >
            →
          </button>
        </div>

        {/* Búsqueda */}
        <PdfSearchBar pdfDoc={pdfDocState} onMatchPage={setPageNumber} />

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="text-sm px-2 py-1 rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Reducir zoom"
          >
            −
          </button>
          <span className="text-xs text-muted-foreground w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= 2.0}
            className="text-sm px-2 py-1 rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Aumentar zoom"
          >
            +
          </button>
        </div>
      </div>

      {/* Zona principal: sidebar + canvas */}
      <div className="flex gap-3 overflow-auto w-full">
        {showSidebar && numPages !== null && (
          <PdfThumbnailSidebar
            pdfData={pdfData}
            numPages={numPages}
            currentPage={pageNumber}
            onPageSelect={setPageNumber}
          />
        )}

        <div className="flex-1 flex justify-center overflow-auto">
          <Document
            file={pdfData}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-muted-foreground">Cargando PDF…</p>
              </div>
            }
            error={
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-destructive">Error al cargar el PDF.</p>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>
      </div>
    </div>
  )
}
```

⚠️ **Nota sobre `onDocumentLoadSuccess`:** react-pdf v10 cambió la firma del callback. En v10, `onLoadSuccess` recibe directamente un `PDFDocumentProxy` (no `{ numPages }`). Si el TypeScript se queja de la firma, verifica el tipo exacto que espera react-pdf v10 mirando:
```powershell
cat C:\Users\priet\protools-hub\node_modules\react-pdf\dist\cjs\index.d.ts | Select-String "onLoadSuccess" | Select-Object -First 5
```
Y ajusta la firma del callback en consecuencia.

- [ ] **Step 2: TypeScript check completo**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | Select-Object -First 30
```

Expected: sin errores. Errores comunes a resolver:
- Si `PDFDocumentProxy` no se importa de `pdfjs-dist` directamente, usar `import type { PDFDocumentProxy } from 'react-pdf'`
- Si el callback `onLoadSuccess` tiene firma distinta en react-pdf v10, adaptar: puede ser `(pdf: PDFDocumentProxy) => void` o `({ numPages }: { numPages: number }) => void`

- [ ] **Step 3: Build**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx next build 2>&1 | Select-Object -Last 15
```

Expected: `✓ Compiled successfully`, sin errores.

- [ ] **Step 4: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/pdfs/[pdfId]/_components/PdfViewer.tsx"
git commit -m "feat: integrate thumbnail sidebar and search bar into PdfViewer"
```

---

### Task 4: Deploy y verificación

**Files:** ninguno

- [ ] **Step 1: Deploy a producción**

```powershell
cd C:\Users\priet\protools-hub
npx vercel --prod --scope mitikus 2>&1 | Select-Object -Last 10
```

Expected: `"message": "Deployment ... ready."`

- [ ] **Step 2: Verificación manual en www.mitikus.com**

1. Abrir un PDF desde el workspace
2. Verificar que la toolbar muestra: `⊞ | ← Pág 1/N → | 🔍 | − 100% +`
3. Hacer clic en ⊞ — debe aparecer el sidebar con miniaturas a la izquierda
4. Hacer clic en una miniatura — debe saltar a esa página
5. Hacer clic en ⊞ de nuevo — el sidebar debe desaparecer
6. Escribir una palabra en el buscador — debe aparecer "N / M" y navegar a la primera página con coincidencia
7. Usar ↑ ↓ para navegar entre coincidencias
8. Escribir algo que no exista — debe aparecer "0 / 0" en rojo tenue
