# Exportación .docx Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir exportación a .docx desde el visor de documentos Tiptap, con parser HTML→Word completo y botones de exportación reubicados en EditableDocHeader.

**Architecture:** Se crea `apps/web/src/lib/docx-export.ts` con un parser HTML→docx puro (sin side effects) y un builder de documento Word. `DocViewerClient` añade `handleExportDocx` y pasa ambos handlers (`onExportPdf`, `onExportDocx`) + estados a `EditableDocHeader`, que renderiza los botones. El import de `docx` es dinámico (solo carga en cliente bajo demanda).

**Tech Stack:** `docx` v9.7.1 (ya instalado), `DOMParser` (nativo browser), Next.js 15 App Router, TypeScript.

---

## Archivos

| Acción | Archivo | Responsabilidad |
|--------|---------|----------------|
| Create | `apps/web/src/lib/docx-export.ts` | Parser HTML→docx + buildWordDocument |
| Modify | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/DocViewerClient.tsx` | Añadir handleExportDocx, pasar props a EditableDocHeader, mover ↓PDF al header |
| Modify | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/EditableDocHeader.tsx` | Recibir onExportPdf/onExportDocx/isExportingPdf/isExportingDocx, renderizar botones |

---

### Task 1: Crear `docx-export.ts` — parser HTML→docx + builder

**Files:**
- Create: `apps/web/src/lib/docx-export.ts`

- [ ] **Step 1: Crear el archivo con parser y builder completos**

```typescript
// apps/web/src/lib/docx-export.ts
// Parser HTML (Tiptap) → elementos docx. Solo se importa dinámicamente desde DocViewerClient.

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  ExternalHyperlink,
  AlignmentType,
  BorderStyle,
  ShadingType,
  LevelFormat,
} from 'docx'

// ─── Tipos internos ───────────────────────────────────────────────────────────

type InlineRun = TextRun | ExternalHyperlink

interface DocxBuildOptions {
  title:        string
  uploaderName: string | null
  wordCount:    number
  createdAt:    string
  elements:     (Paragraph)[]
}

// ─── Parser de inlines ────────────────────────────────────────────────────────

function parseInlines(
  node: Node,
  opts: { bold?: boolean; italics?: boolean; code?: boolean } = {},
): InlineRun[] {
  const runs: InlineRun[] = []

  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent ?? ''
      if (!text) return
      runs.push(
        new TextRun({
          text,
          bold:    opts.bold,
          italics: opts.italics,
          font:    opts.code ? { name: 'Courier New' } : undefined,
          shading: opts.code
            ? { type: ShadingType.CLEAR, fill: 'F3F2EF', color: 'auto' }
            : undefined,
        }),
      )
      return
    }

    if (child.nodeType !== Node.ELEMENT_NODE) return
    const el = child as HTMLElement
    const tag = el.tagName.toLowerCase()

    if (tag === 'br') {
      runs.push(new TextRun({ text: '', break: 1 }))
      return
    }

    if (tag === 'strong' || tag === 'b') {
      runs.push(...parseInlines(el, { ...opts, bold: true }))
      return
    }

    if (tag === 'em' || tag === 'i') {
      runs.push(...parseInlines(el, { ...opts, italics: true }))
      return
    }

    if (tag === 'code') {
      runs.push(...parseInlines(el, { ...opts, code: true }))
      return
    }

    if (tag === 'a') {
      const href = el.getAttribute('href') ?? ''
      const linkRuns = parseInlines(el, { ...opts }).map((r) => {
        if (r instanceof TextRun) {
          return new TextRun({ ...r, style: 'Hyperlink' })
        }
        return r
      })
      if (href && linkRuns.length > 0) {
        runs.push(new ExternalHyperlink({ link: href, children: linkRuns as TextRun[] }))
      } else {
        runs.push(...linkRuns)
      }
      return
    }

    // Cualquier otro elemento — procesar sus hijos con las mismas opciones
    runs.push(...parseInlines(el, opts))
  })

  return runs
}

// ─── Parser de bloques ────────────────────────────────────────────────────────

function parseBlock(el: HTMLElement): Paragraph[] {
  const tag = el.tagName.toLowerCase()

  // Párrafo
  if (tag === 'p') {
    return [new Paragraph({ children: parseInlines(el) })]
  }

  // Headings
  const headingMap: Record<string, HeadingLevel> = {
    h1: HeadingLevel.HEADING_1,
    h2: HeadingLevel.HEADING_2,
    h3: HeadingLevel.HEADING_3,
  }
  if (headingMap[tag]) {
    return [new Paragraph({ heading: headingMap[tag], children: parseInlines(el) })]
  }

  // Lista sin ordenar
  if (tag === 'ul') {
    const items: Paragraph[] = []
    el.querySelectorAll(':scope > li').forEach((li) => {
      items.push(
        new Paragraph({
          bullet: { level: 0 },
          children: parseInlines(li as HTMLElement),
        }),
      )
    })
    return items
  }

  // Lista ordenada
  if (tag === 'ol') {
    const items: Paragraph[] = []
    el.querySelectorAll(':scope > li').forEach((li) => {
      items.push(
        new Paragraph({
          numbering: { reference: 'decimal-numbering', level: 0 },
          children:  parseInlines(li as HTMLElement),
        }),
      )
    })
    return items
  }

  // Blockquote
  if (tag === 'blockquote') {
    const inner = parseInlines(el)
    return [
      new Paragraph({
        children: inner,
        indent:   { left: 720 },
        border: {
          left: {
            color:   'AAAAAA',
            space:   10,
            style:   BorderStyle.SINGLE,
            size:    12,
          },
        },
      }),
    ]
  }

  // Fallback: tratar como párrafo
  return [new Paragraph({ children: parseInlines(el) })]
}

// ─── Entry point: HTML string → Paragraph[] ──────────────────────────────────

export function parseHtmlToDocx(html: string): Paragraph[] {
  const parser = new DOMParser()
  const parsed = parser.parseFromString(html, 'text/html')
  const result: Paragraph[] = []

  parsed.body.childNodes.forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return
    result.push(...parseBlock(node as HTMLElement))
  })

  return result
}

// ─── Builder: construye el Document Word completo ────────────────────────────

export function buildWordDocument(opts: DocxBuildOptions): Document {
  const { title, uploaderName, wordCount, createdAt, elements } = opts

  const metaText = `${wordCount.toLocaleString('es-ES')} palabras · ${new Date(createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}${uploaderName ? ` · ${uploaderName}` : ''}`

  return new Document({
    creator:     uploaderName ?? 'MITIKUS',
    title,
    description: `Exportado desde MITIKUS el ${new Date().toLocaleDateString('es-ES')}`,

    numbering: {
      config: [
        {
          reference: 'decimal-numbering',
          levels: [
            {
              level:  0,
              format: LevelFormat.DECIMAL,
              text:   '%1.',
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },

    sections: [
      {
        properties: {
          page: {
            size:   { width: 11906, height: 16838 },  // A4
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },  // 2.54 cm
          },
        },
        children: [
          // Título
          new Paragraph({
            heading:  HeadingLevel.TITLE,
            children: [new TextRun({ text: title, bold: true, size: 52 })],
          }),
          // Metadatos
          new Paragraph({
            children: [
              new TextRun({
                text:  metaText,
                color: '888888',
                size:  18,
              }),
            ],
            spacing: { after: 240 },
          }),
          // Cuerpo
          ...elements,
        ],
      },
    ],
  })
}

// ─── Descarga directa (helper para el cliente) ────────────────────────────────

export async function downloadAsDocx(
  html:         string,
  title:        string,
  uploaderName: string | null,
  wordCount:    number,
  createdAt:    string,
): Promise<void> {
  const elements = parseHtmlToDocx(html)
  const wordDoc  = buildWordDocument({ title, uploaderName, wordCount, createdAt, elements })
  const blob     = await Packer.toBlob(wordDoc)
  const url      = URL.createObjectURL(blob)
  const a        = document.createElement('a')
  a.href         = url
  a.download     = `${title}.docx`
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 2: TypeScript check**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | Select-String "docx-export" | Select-Object -First 10
```

Expected: sin output (sin errores en ese archivo).

- [ ] **Step 3: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add apps/web/src/lib/docx-export.ts
git commit -m "feat: add HTML-to-docx parser and Word document builder"
```

---

### Task 2: Actualizar `EditableDocHeader` — añadir props de exportación y botones

**Files:**
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/EditableDocHeader.tsx`

El archivo actual tiene esta interfaz Props:
```typescript
interface Props {
  doc:         DocumentDetail
  workspaceId: string
}
```

Y esta zona de botones (líneas 66-83):
```tsx
<div className="flex items-center gap-2 shrink-0">
  <span className="text-xs border border-primary/30 text-primary px-2.5 py-1 rounded-full">
    Arkos usa este doc ✓
  </span>
  {isDirty && (
    <button onClick={handleSave} ...>
      {isPending ? 'Guardando…' : 'Guardar'}
    </button>
  )}
  {saved && !isDirty && (
    <span className="text-xs text-green-600 dark:text-green-400">Guardado ✓</span>
  )}
</div>
```

- [ ] **Step 1: Reemplazar el archivo completo con la versión actualizada**

```typescript
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/EditableDocHeader.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { DocumentDetail } from '@/app/actions/documents'
import { updateDocument } from '@/app/actions/documents'

const CATEGORIES = ['DNA', 'Producto', 'Arquitectura', 'Operaciones'] as const

interface Props {
  doc:              DocumentDetail
  workspaceId:      string
  onExportPdf:      () => void
  onExportDocx:     () => void
  isExportingPdf:   boolean
  isExportingDocx:  boolean
}

export function EditableDocHeader({
  doc,
  workspaceId,
  onExportPdf,
  onExportDocx,
  isExportingPdf,
  isExportingDocx,
}: Props) {
  const [title, setTitle]       = useState(doc.title)
  const [category, setCategory] = useState<string>(doc.category ?? '')
  const [saved, setSaved]       = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const isDirty = title !== doc.title || (category || null) !== doc.category

  function handleSave() {
    if (!title.trim()) return
    startTransition(async () => {
      await updateDocument(doc.id, workspaceId, {
        title,
        category: category || null,
      })
      router.refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-2 min-w-0">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-xl font-semibold bg-transparent border-0 border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors pb-0.5"
          aria-label="Título del documento"
        />
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground shrink-0">
            {doc.wordCount.toLocaleString()} palabras ·{' '}
            {new Date(doc.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            {doc.uploaderName ? ` · ${doc.uploaderName}` : ''}
          </p>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-xs border border-border rounded px-2 py-0.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Categoría"
          >
            <option value="">Sin categoría</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0flex-wrap">
        <span className="text-xs border border-primary/30 text-primary px-2.5 py-1 rounded-full">
          Arkos usa este doc ✓
        </span>
        <button
          onClick={onExportPdf}
          disabled={isExportingPdf}
          className="text-xs border border-border px-2.5 py-1 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
          title="Descargar como PDF"
        >
          {isExportingPdf ? 'Generando…' : '↓ PDF'}
        </button>
        <button
          onClick={onExportDocx}
          disabled={isExportingDocx}
          className="text-xs border border-border px-2.5 py-1 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
          title="Descargar como Word (.docx)"
        >
          {isExportingDocx ? 'Generando…' : '↓ .docx'}
        </button>
        {isDirty && (
          <button
            onClick={handleSave}
            disabled={isPending || !title.trim()}
            className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Guardando…' : 'Guardar'}
          </button>
        )}
        {saved && !isDirty && (
          <span className="text-xs text-green-600 dark:text-green-400">Guardado ✓</span>
        )}
      </div>
    </div>
  )
}
```

⚠️ Nota: `shrink-0flex-wrap` es un error tipográfico en el className — debe ser `shrink-0 flex-wrap`. Corrígelo al escribir el archivo.

- [ ] **Step 2: TypeScript check**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | Select-String "EditableDocHeader" | Select-Object -First 10
```

Expected: errores de tipo en `DocViewerClient` porque todavía no pasa las nuevas props. Es normal — se resuelven en Task 3.

- [ ] **Step 3: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/EditableDocHeader.tsx"
git commit -m "feat: add export buttons to EditableDocHeader"
```

---

### Task 3: Actualizar `DocViewerClient` — añadir handleExportDocx y pasar props al header

**Files:**
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/DocViewerClient.tsx`

Cambios respecto al estado actual del archivo:
1. Añadir `isExportingDocx` state
2. Añadir `handleExportDocx` usando import dinámico de `docx-export.ts`
3. Mover botón "↓ PDF" de `DocViewerClient` a `EditableDocHeader` (eliminarlo del JSX de `DocViewerClient`)
4. Pasar `onExportPdf`, `onExportDocx`, `isExportingPdf`, `isExportingDocx` a `EditableDocHeader`

- [ ] **Step 1: Reemplazar el archivo completo con la versión actualizada**

```typescript
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/DocViewerClient.tsx
'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { DocumentDetail } from '@/app/actions/documents'
import { updateDocumentContent } from '@/app/actions/documents'
import { TiptapEditor } from '../../_components/TiptapEditor'
import { EditableDocHeader } from './EditableDocHeader'

interface Props {
  doc:         DocumentDetail
  workspaceId: string
}

export function DocViewerClient({ doc, workspaceId }: Props) {
  const [isEditing, setIsEditing]         = useState(false)
  const [html, setHtml]                   = useState(doc.content)
  const [rawText, setRawText]             = useState(doc.rawText ?? '')
  const [isDirty, setIsDirty]             = useState(false)
  const [isPending, startTransition]      = useTransition()
  const [isExportingPdf, setExportingPdf] = useState(false)
  const [isExportingDocx, setExportingDocx] = useState(false)
  const router = useRouter()

  async function handleExportPdf() {
    setExportingPdf(true)
    try {
      const { jsPDF } = await import('jspdf')
      const pdf    = new jsPDF({ unit: 'mm', format: 'a4' })
      const margin = 20
      const pageW  = pdf.internal.pageSize.getWidth() - margin * 2
      const pageH  = pdf.internal.pageSize.getHeight()
      const lineH  = 6
      let y = margin

      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      const titleLines = pdf.splitTextToSize(doc.title, pageW)
      pdf.text(titleLines, margin, y)
      y += (titleLines.length * 8) + 4

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(120, 120, 120)
      const meta = `${doc.wordCount.toLocaleString()} palabras · ${new Date(doc.createdAt).toLocaleDateString('es-ES')}`
      pdf.text(meta, margin, y)
      y += 10
      pdf.setTextColor(0, 0, 0)

      pdf.setDrawColor(200, 200, 200)
      pdf.line(margin, y, margin + pageW, y)
      y += 6

      pdf.setFontSize(11)
      const text = rawText || doc.rawText || ''
      const paragraphs = text.split('\n').filter((l: string) => l.trim())
      for (const para of paragraphs) {
        const lines = pdf.splitTextToSize(para, pageW)
        if (y + lines.length * lineH > pageH - margin) {
          pdf.addPage()
          y = margin
        }
        pdf.text(lines, margin, y)
        y += lines.length * lineH + 3
      }

      pdf.save(`${doc.title}.pdf`)
    } finally {
      setExportingPdf(false)
    }
  }

  async function handleExportDocx() {
    setExportingDocx(true)
    try {
      const { downloadAsDocx } = await import('@/lib/docx-export')
      await downloadAsDocx(
        html,
        doc.title,
        doc.uploaderName,
        doc.wordCount,
        doc.createdAt,
      )
    } finally {
      setExportingDocx(false)
    }
  }

  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (isDirty) {
      e.preventDefault()
      e.returnValue = ''
    }
  }, [isDirty])

  useEffect(() => {
    if (isEditing) {
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isEditing, handleBeforeUnload])

  function handleChange(newHtml: string, newText: string) {
    setHtml(newHtml)
    setRawText(newText)
    setIsDirty(true)
  }

  function handleCancel() {
    setHtml(doc.content)
    setIsDirty(false)
    setIsEditing(false)
  }

  function handleSave() {
    startTransition(async () => {
      await updateDocumentContent(doc.id, workspaceId, { content: html, rawText })
      setIsDirty(false)
      setIsEditing(false)
      router.refresh()
    })
  }

  return (
    <>
      <EditableDocHeader
        doc={doc}
        workspaceId={workspaceId}
        onExportPdf={handleExportPdf}
        onExportDocx={handleExportDocx}
        isExportingPdf={isExportingPdf}
        isExportingDocx={isExportingDocx}
      />

      {/* Botón editar — visible solo en modo lectura */}
      {!isEditing && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs border border-border px-3 py-1.5 rounded-full hover:bg-muted transition-colors"
          >
            Editar contenido
          </button>
        </div>
      )}

      {isEditing ? (
        <>
          <TiptapEditor initialContent={doc.content} onChange={handleChange} />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="text-xs border border-border px-4 py-1.5 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="text-xs bg-primary text-primary-foreground px-4 py-1.5 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </>
      ) : (
        <div
          className="prose prose-sm dark:prose-invert max-w-none border border-border rounded-lg bg-card px-6 py-5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </>
  )
}
```

⚠️ Nota: `DocViewerClient` ahora renderiza `EditableDocHeader` internamente. Esto significa que `page.tsx` **ya NO debe renderizar `EditableDocHeader`** — se eliminará de `page.tsx` en el Step 2.

- [ ] **Step 2: Actualizar `page.tsx` — eliminar `EditableDocHeader` del Server Component**

Archivo: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/page.tsx`

Estado actual:
```tsx
import { EditableDocHeader } from './_components/EditableDocHeader'
import { DocViewerClient } from './_components/DocViewerClient'

// ...en el return:
<EditableDocHeader doc={doc} workspaceId={workspaceId} />
<div className="flex justify-end">
  <DeleteDocButton docId={docId} workspaceId={workspaceId} />
</div>
<DocViewerClient doc={doc} workspaceId={workspaceId} />
```

Debe quedar:
```tsx
// Eliminar import de EditableDocHeader
import { DocViewerClient } from './_components/DocViewerClient'

// En el return — eliminar <EditableDocHeader> y reorganizar:
<DocViewerClient doc={doc} workspaceId={workspaceId} />
<div className="flex justify-end pt-2">
  <DeleteDocButton docId={docId} workspaceId={workspaceId} />
</div>
```

El archivo completo resultante:
```tsx
import { requireUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDocument } from '@/app/actions/documents'
import { DeleteDocButton } from './_components/DeleteDocButton'
import { DocViewerClient } from './_components/DocViewerClient'

interface Props {
  params: Promise<{ workspaceId: string; docId: string }>
}

export default async function DocViewerPage({ params }: Props) {
  const [{ workspaceId, docId }] = await Promise.all([params, requireUser()])

  const doc = await getDocument(docId, workspaceId)
  if (!doc) notFound()

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <Link
        href={`/workspace/${workspaceId}/docs`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Documentación
      </Link>

      <DocViewerClient doc={doc} workspaceId={workspaceId} />

      <div className="flex justify-end">
        <DeleteDocButton docId={docId} workspaceId={workspaceId} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript check completo**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | Select-Object -First 20
```

Expected: sin errores.

- [ ] **Step 4: Build**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx next build 2>&1 | Select-Object -Last 15
```

Expected: `✓ Compiled successfully`, sin errores.

- [ ] **Step 5: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/DocViewerClient.tsx"
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/page.tsx"
git commit -m "feat: wire docx export into DocViewerClient, move export buttons to header"
```

---

### Task 4: Deploy y verificación

**Files:** ninguno (solo comandos)

- [ ] **Step 1: Deploy a producción**

```powershell
cd C:\Users\priet\protools-hub
npx vercel --prod --scope mitikus 2>&1 | Select-Object -Last 10
```

Expected: `"message": "Deployment ... ready."`

- [ ] **Step 2: Verificación manual**

1. Abrir www.mitikus.com → workspace → Docs → cualquier documento
2. Comprobar que el header muestra: badge "Arkos ✓" + botón "↓ PDF" + botón "↓ .docx"
3. Pulsar "↓ PDF" — debe descargarse `<título>.pdf` sin diálogo de impresión
4. Pulsar "↓ .docx" — debe descargarse `<título>.docx`
5. Abrir el `.docx` en Word/LibreOffice y verificar: título en grande, metadatos en gris, cuerpo con párrafos, headings y formato

- [ ] **Step 3: Commit vacío si todo OK (para registrar verificación)**

```powershell
cd C:\Users\priet\protools-hub
git commit --allow-empty -m "chore: verify docx export in production"
```
