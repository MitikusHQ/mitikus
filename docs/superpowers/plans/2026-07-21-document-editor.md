# Document Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir un editor de texto enriquecido (Tiptap) al visor de documentos y una página de creación de documentos nuevos desde cero.

**Architecture:** `DocViewerClient` es un Client Component que envuelve el área de contenido del visor; gestiona el estado `isEditing` y muestra el HTML en modo lectura o `TiptapEditor` en modo edición. La extensiones de Tiptap se definen en `src/lib/tiptap-extensions.ts` para poder reutilizarlas en el visor y en la página `/docs/new`. Las server actions `updateDocumentContent` y `createDocument` se añaden al archivo existente `documents.ts`.

**Tech Stack:** Next.js 15 App Router, Server Actions (`'use server'`), Clerk v6 (`auth()`), Prisma, Tiptap (`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-table`, `@tiptap/extension-table-row`, `@tiptap/extension-table-cell`, `@tiptap/extension-table-header`, `@tiptap/extension-link`), `useRouter`, `useTransition`, Tailwind CSS.

---

## File Structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `apps/web/src/lib/tiptap-extensions.ts` | Crear | Configuración reutilizable de extensiones Tiptap |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/_components/TiptapEditor.tsx` | Crear | Client Component: editor Tiptap + toolbar |
| `apps/web/src/app/actions/documents.ts` | Modificar | Añadir `updateDocumentContent` y `createDocument` |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/DocViewerClient.tsx` | Crear | Client Component: toggle vista/edición, `beforeunload` |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/EditableDocHeader.tsx` | Modificar | Añadir prop `isEditing` + botón "Editar" |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/page.tsx` | Modificar | Pasar `doc` a `DocViewerClient` en lugar de renderizar contenido inline |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/new/page.tsx` | Crear | Página "Nuevo documento" con `TiptapEditor` vacío |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/_components/DocList.tsx` | Modificar | Añadir botón "+ Nuevo documento" |

---

### Task 1: Instalar paquetes Tiptap

**Files:**
- No hay cambios en archivos fuente

- [ ] **Step 1: Instalar dependencias**

```powershell
cd C:\Users\priet\protools-hub; npm install --workspace=apps/web @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-link
```

Salida esperada: `added N packages` sin errores.

- [ ] **Step 2: Verificar que se resuelve el import**

```powershell
cd C:\Users\priet\protools-hub; node -e "require('@tiptap/react'); console.log('ok')"
```

Salida esperada: `ok`

- [ ] **Step 3: Commit**

```powershell
git add package.json package-lock.json apps/web/package.json
git commit -m "chore(deps): install tiptap packages"
```

---

### Task 2: Configuración de extensiones Tiptap

**Files:**
- Create: `apps/web/src/lib/tiptap-extensions.ts`

- [ ] **Step 1: Crear el archivo de extensiones**

Crea `apps/web/src/lib/tiptap-extensions.ts`:

```typescript
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Link } from '@tiptap/extension-link'

export const tiptapExtensions = [
  StarterKit,
  Table.configure({ resizable: false }),
  TableRow,
  TableCell,
  TableHeader,
  Link.configure({ openOnClick: false }),
]
```

StarterKit incluye: párrafos, H1-H6, negrita, cursiva, tachado, listas bullet y ordenada, código inline, bloque de código, cita, regla horizontal.

- [ ] **Step 2: Verificar TypeScript**

```powershell
cd C:\Users\priet\protools-hub; npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | Select-String "tiptap-extensions"
```

Salida esperada: sin errores.

- [ ] **Step 3: Commit**

```powershell
git add apps/web/src/lib/tiptap-extensions.ts
git commit -m "feat(docs): add tiptap extensions config"
```

---

### Task 3: Componente TiptapEditor

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/_components/TiptapEditor.tsx`

- [ ] **Step 1: Crear el componente**

Crea `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/_components/TiptapEditor.tsx`:

```tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { tiptapExtensions } from '@/lib/tiptap-extensions'

interface Props {
  initialContent: string
  onChange: (html: string, text: string) => void
}

export function TiptapEditor({ initialContent, onChange }: Props) {
  const editor = useEditor({
    extensions: tiptapExtensions,
    content: initialContent,
    onUpdate({ editor }) {
      onChange(editor.getHTML(), editor.getText())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px]',
      },
    },
  })

  if (!editor) return null

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-border bg-muted/30">
        <ToolbarBtn
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Negrita"
        >
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Cursiva"
        >
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Tachado"
        >
          <s>S</s>
        </ToolbarBtn>
        <Sep />
        <ToolbarBtn
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Título 1"
        >
          H1
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Título 2"
        >
          H2
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Título 3"
        >
          H3
        </ToolbarBtn>
        <Sep />
        <ToolbarBtn
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Lista"
        >
          •—
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Lista numerada"
        >
          1.
        </ToolbarBtn>
        <Sep />
        <ToolbarBtn
          active={editor.isActive('link')}
          onClick={() => {
            const url = window.prompt('URL del enlace')
            if (url) editor.chain().focus().setLink({ href: url }).run()
            else editor.chain().focus().unsetLink().run()
          }}
          title="Enlace"
        >
          🔗
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('table')}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Tabla"
        >
          ⊞
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Cita"
        >
          "
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Código"
        >
          {'</>'}
        </ToolbarBtn>
        <ToolbarBtn
          active={false}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Regla horizontal"
        >
          —
        </ToolbarBtn>
      </div>

      {/* Área de edición */}
      <EditorContent editor={editor} className="px-6 py-5" />
    </div>
  )
}

function ToolbarBtn({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1 text-xs rounded transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="w-px h-4 bg-border mx-1" aria-hidden />
}
```

- [ ] **Step 2: Verificar TypeScript**

```powershell
cd C:\Users\priet\protools-hub; npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | Select-String "TiptapEditor"
```

Salida esperada: sin errores.

- [ ] **Step 3: Commit**

```powershell
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/_components/TiptapEditor.tsx"
git commit -m "feat(docs): add TiptapEditor client component with toolbar"
```

---

### Task 4: Server actions updateDocumentContent y createDocument

**Files:**
- Modify: `apps/web/src/app/actions/documents.ts`

- [ ] **Step 1: Añadir las dos acciones al final del archivo**

Abre `apps/web/src/app/actions/documents.ts`. Al final del archivo (tras la línea 106 de `updateDocument`), añade:

```typescript
export async function updateDocumentContent(
  docId: string,
  workspaceId: string,
  data: { content: string; rawText: string },
): Promise<void> {
  await getAuthUser()
  const wordCount = data.rawText.trim().split(/\s+/).filter(Boolean).length
  await db.document.updateMany({
    where: { id: docId, workspaceId },
    data:  { content: data.content, rawText: data.rawText, wordCount },
  })
  revalidatePath(`/workspace/${workspaceId}/docs`)
  revalidatePath(`/workspace/${workspaceId}/docs/${docId}`)
}

export async function createDocument(
  workspaceId: string,
  data: { title: string; content: string; rawText: string },
): Promise<string> {
  const user = await getAuthUser()
  const wordCount = data.rawText.trim().split(/\s+/).filter(Boolean).length
  const doc = await db.document.create({
    data: {
      workspaceId,
      title:      data.title.trim() || 'Sin título',
      content:    data.content,
      rawText:    data.rawText,
      wordCount,
      uploadedBy: user.id,
    },
  })
  revalidatePath(`/workspace/${workspaceId}/docs`)
  return doc.id
}
```

Nota: el campo `rawText` debe existir en el schema Prisma. Si el modelo `Document` no tiene `rawText`, el comando `npx prisma db push` lo añadirá en el paso de verificación abajo.

- [ ] **Step 2: Comprobar schema Prisma**

```powershell
cd C:\Users\priet\protools-hub; Select-String "rawText" apps/web/prisma/schema.prisma
```

Si `rawText` NO aparece, abre `apps/web/prisma/schema.prisma`, localiza el modelo `Document`, y añade el campo:

```prisma
rawText   String  @default("")
```

Luego ejecuta:

```powershell
cd C:\Users\priet\protools-hub; npx prisma db push --schema=apps/web/prisma/schema.prisma
```

Si `rawText` YA aparece, omite este sub-paso.

- [ ] **Step 3: Verificar TypeScript**

```powershell
cd C:\Users\priet\protools-hub; npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | Select-String "documents.ts"
```

Salida esperada: sin errores.

- [ ] **Step 4: Commit**

```powershell
git add apps/web/src/app/actions/documents.ts apps/web/prisma/schema.prisma
git commit -m "feat(docs): add updateDocumentContent and createDocument server actions"
```

---

### Task 5: Componente DocViewerClient

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/DocViewerClient.tsx`

Este Client Component recibe el documento completo del Server Component padre, gestiona el estado `isEditing`, monta el listener `beforeunload` en modo edición, y coordina el guardado llamando a `updateDocumentContent`.

- [ ] **Step 1: Crear el componente**

Crea `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/DocViewerClient.tsx`:

```tsx
'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { DocumentDetail } from '@/app/actions/documents'
import { updateDocumentContent } from '@/app/actions/documents'
import { TiptapEditor } from '../../_components/TiptapEditor'

interface Props {
  doc:         DocumentDetail
  workspaceId: string
}

export function DocViewerClient({ doc, workspaceId }: Props) {
  const [isEditing, setIsEditing]     = useState(false)
  const [html, setHtml]               = useState(doc.content)
  const [rawText, setRawText]         = useState('')
  const [isDirty, setIsDirty]         = useState(false)
  const [isPending, startTransition]  = useTransition()
  const router = useRouter()

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
      {/* Botón Editar — visible solo en modo lectura */}
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

      {/* Contenido */}
      {isEditing ? (
        <>
          <TiptapEditor initialContent={doc.content} onChange={handleChange} />

          {/* Barra de acciones */}
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

- [ ] **Step 2: Verificar TypeScript**

```powershell
cd C:\Users\priet\protools-hub; npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | Select-String "DocViewerClient"
```

Salida esperada: sin errores.

- [ ] **Step 3: Commit**

```powershell
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/DocViewerClient.tsx"
git commit -m "feat(docs): add DocViewerClient with edit/view toggle and beforeunload"
```

---

### Task 6: Actualizar page.tsx del visor

**Files:**
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/page.tsx`

Reemplaza el bloque de contenido inline (`dangerouslySetInnerHTML`) por `DocViewerClient`.

- [ ] **Step 1: Actualizar el archivo**

Reemplaza el contenido completo de `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/page.tsx` con:

```tsx
import { requireUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDocument } from '@/app/actions/documents'
import { DeleteDocButton } from './_components/DeleteDocButton'
import { EditableDocHeader } from './_components/EditableDocHeader'
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

      <EditableDocHeader doc={doc} workspaceId={workspaceId} />

      <div className="flex justify-end">
        <DeleteDocButton docId={docId} workspaceId={workspaceId} />
      </div>

      <DocViewerClient doc={doc} workspaceId={workspaceId} />
    </div>
  )
}
```

Nota: `user` ya no se usa directamente en este componente (lo usa `requireUser()` para la verificación de auth), así que se desestructura solo `workspaceId, docId`.

- [ ] **Step 2: Verificar TypeScript**

```powershell
cd C:\Users\priet\protools-hub; npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | Select-String "error TS" | Select-Object -First 10
```

Salida esperada: sin errores nuevos.

- [ ] **Step 3: Commit**

```powershell
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/page.tsx"
git commit -m "feat(docs): integrate DocViewerClient into viewer page"
```

---

### Task 7: Página de nuevo documento

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/new/page.tsx`

- [ ] **Step 1: Crear la página**

Crea `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/new/page.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createDocument } from '@/app/actions/documents'
import { TiptapEditor } from '../_components/TiptapEditor'

export default function NewDocPage() {
  const params     = useParams<{ workspaceId: string }>()
  const workspaceId = params.workspaceId
  const router     = useRouter()
  const [title, setTitle]             = useState('')
  const [html, setHtml]               = useState('')
  const [rawText, setRawText]         = useState('')
  const [isPending, startTransition]  = useTransition()

  function handleChange(newHtml: string, newText: string) {
    setHtml(newHtml)
    setRawText(newText)
  }

  function handleCreate() {
    startTransition(async () => {
      const docId = await createDocument(workspaceId, {
        title,
        content: html,
        rawText,
      })
      router.push(`/workspace/${workspaceId}/docs/${docId}`)
    })
  }

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

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título del documento"
        className="w-full text-xl font-semibold bg-transparent border-0 border-b border-border focus:border-primary focus:outline-none transition-colors pb-1"
        aria-label="Título"
      />

      <TiptapEditor initialContent="" onChange={handleChange} />

      <div className="flex justify-end gap-2">
        <Link
          href={`/workspace/${workspaceId}/docs`}
          className="text-xs border border-border px-4 py-1.5 rounded-full hover:bg-muted transition-colors"
        >
          Cancelar
        </Link>
        <button
          onClick={handleCreate}
          disabled={isPending}
          className="text-xs bg-primary text-primary-foreground px-4 py-1.5 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Creando…' : 'Crear documento'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```powershell
cd C:\Users\priet\protools-hub; npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | Select-String "docs/new"
```

Salida esperada: sin errores.

- [ ] **Step 3: Commit**

```powershell
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/new/page.tsx"
git commit -m "feat(docs): add new document creation page"
```

---

### Task 8: Botón "+ Nuevo documento" en DocList

**Files:**
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/_components/DocList.tsx`

- [ ] **Step 1: Añadir el botón**

Abre `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/_components/DocList.tsx`.

Añade `Link` a los imports de la línea 3 (ya está importado — verificar):

```tsx
import Link from 'next/link'
```

Localiza el bloque `<div className="space-y-4">` (línea 41). Añade el botón "+ Nuevo documento" como **primer hijo** del `space-y-4`, antes del bloque de filtros:

```tsx
  return (
    <div className="space-y-4">
      {/* Nuevo documento */}
      <div className="flex justify-end">
        <Link
          href={`/workspace/${workspaceId}/docs/new`}
          className="text-xs border border-border px-3 py-1.5 rounded-full hover:bg-muted transition-colors inline-flex items-center gap-1"
        >
          <span aria-hidden>+</span> Nuevo documento
        </Link>
      </div>

      {/* Filtros */}
      ...resto del JSX existente...
```

El archivo completo tras el cambio debe ser:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { DocumentData } from '@/app/actions/documents'
import { UploadZone } from './UploadZone'

interface Props {
  workspaceId:  string
  initialDocs:  DocumentData[]
}

const CATEGORY_COLORS: Record<string, string> = {
  DNA:          'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  Producto:     'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  Arquitectura: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  Operaciones:  'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
}

function categoryColor(cat: string | null): string {
  if (!cat) return 'bg-muted text-muted-foreground'
  return CATEGORY_COLORS[cat] ?? 'bg-muted text-muted-foreground'
}

function formatWords(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k palabras` : `${n} palabras`
}

export function DocList({ workspaceId, initialDocs }: Props) {
  const [docs, setDocs]     = useState<DocumentData[]>(initialDocs)
  const [filter, setFilter] = useState<string | null>(null)

  const categories = Array.from(new Set(docs.map((d) => d.category).filter(Boolean))) as string[]
  const filtered   = filter ? docs.filter((d) => d.category === filter) : docs

  function handleUploaded(doc: DocumentData) {
    setDocs((prev) => [doc, ...prev])
  }

  return (
    <div className="space-y-4">
      {/* Nuevo documento */}
      <div className="flex justify-end">
        <Link
          href={`/workspace/${workspaceId}/docs/new`}
          className="text-xs border border-border px-3 py-1.5 rounded-full hover:bg-muted transition-colors inline-flex items-center gap-1"
        >
          <span aria-hidden>+</span> Nuevo documento
        </Link>
      </div>

      {/* Filtros */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter(null)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              !filter
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-foreground'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat === filter ? null : cat)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                filter === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No hay documentos todavía. Sube el primero.
          </div>
        ) : (
          filtered.map((doc) => (
            <Link
              key={doc.id}
              href={`/workspace/${workspaceId}/docs/${doc.id}`}
              className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/40 transition-colors"
            >
              <span className="text-lg shrink-0">📄</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatWords(doc.wordCount)} ·{' '}
                  {new Date(doc.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              {doc.category && (
                <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded font-medium ${categoryColor(doc.category)}`}>
                  {doc.category}
                </span>
              )}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground/40" aria-hidden>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          ))
        )}
      </div>

      <UploadZone workspaceId={workspaceId} onUploaded={handleUploaded} />
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```powershell
cd C:\Users\priet\protools-hub; npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | Select-String "DocList"
```

Salida esperada: sin errores.

- [ ] **Step 3: Commit**

```powershell
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/_components/DocList.tsx"
git commit -m "feat(docs): add new document button to DocList"
```

---

### Task 9: TypeScript completo + Deploy + Verificación

**Files:** ninguno

- [ ] **Step 1: TypeScript sin errores nuevos**

```powershell
cd C:\Users\priet\protools-hub; npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | Select-String "error TS" | Select-Object -First 20
```

Salida esperada: sin errores, o solo los mismos errores preexistentes que había antes de este sprint.

- [ ] **Step 2: Deploy a producción**

```powershell
cd C:\Users\priet\protools-hub; npx vercel --prod --scope mitikus
```

Esperar hasta ver la URL de producción aliased a `www.mitikus.com`.

- [ ] **Step 3: Verificar edición de documento existente**

1. Abre `https://www.mitikus.com` → workspace → Docs → abre cualquier documento.
2. Comprueba que aparece el botón "Editar contenido".
3. Haz clic en "Editar contenido" → debe aparecer el editor Tiptap con toolbar.
4. Modifica un párrafo → pulsa "Guardar" → el editor vuelve a modo lectura con el contenido actualizado.
5. Recarga la página → el contenido modificado debe persistir.

- [ ] **Step 4: Verificar creación de documento nuevo**

1. En la lista de documentos (`/docs`), comprueba que aparece el botón "+ Nuevo documento".
2. Haz clic → debe navegar a `/docs/new` con editor vacío.
3. Escribe un título y algo de contenido → pulsa "Crear documento".
4. Debe redirigir al visor del nuevo documento.
5. Vuelve al listado → el nuevo documento debe aparecer en la lista.

- [ ] **Step 5: Verificar beforeunload**

1. Abre un documento → pulsa "Editar contenido" → escribe algo.
2. Intenta cerrar el tab o navegar fuera → debe aparecer el diálogo de confirmación del navegador.
3. Pulsa "Cancelar" en la barra de edición → el diálogo no debe aparecer (ya no hay cambios sin guardar).
