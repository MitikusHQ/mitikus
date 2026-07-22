# Document Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir gestor documental a MITIKUS: subida de `.docx`, visor en la app y documentos disponibles como contexto en Arkos.

**Architecture:** Subida de `.docx` → conversión a HTML + texto plano con `mammoth` (npm, sin binarios) → almacenamiento en PostgreSQL. Nueva sección `/docs` en el workspace con listado y visor. `BusinessContext` incluye `docsContext` para que Arkos muestre los documentos disponibles.

**Tech Stack:** Next.js 15 App Router, Prisma + PostgreSQL, mammoth, Clerk v6 (`auth()`), `revalidatePath`, Server Components + Client Components.

---

## File Structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `apps/web/prisma/schema.prisma` | Modificar | Modelo `Document` + relaciones inversas |
| `apps/web/src/lib/docx-convert.ts` | Crear | Convierte buffer .docx → { html, rawText, wordCount } |
| `apps/web/src/app/api/documents/upload/route.ts` | Crear | POST multipart → llama convertDocx → guarda en BD |
| `apps/web/src/app/actions/documents.ts` | Crear | Server actions: getDocuments, getDocument, deleteDocument |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx` | Modificar | Añadir icono `docs` |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx` | Modificar | Añadir nav item "Docs" |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceTopbar.tsx` | Modificar | Añadir breadcrumb `/docs` |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/page.tsx` | Crear | Página listado (Server Component) |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/_components/DocList.tsx` | Crear | Lista + filtros categoría (Client Component) |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/_components/UploadZone.tsx` | Crear | Drag & drop + POST a /api/documents/upload (Client Component) |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/page.tsx` | Crear | Visor de documento (Server Component) |
| `apps/web/src/lib/business-memory/memory-types.ts` | Modificar | Añadir `docsContext: string \| null` a `BusinessContext` |
| `apps/web/src/lib/business-memory/business-context.ts` | Modificar | Poblar `docsContext` en `getBusinessContext` |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/copilot/page.tsx` | Modificar | Mostrar panel "Docs disponibles" en sidebar de Arkos |

---

### Task 1: Prisma schema — modelo Document

**Files:**
- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: Añadir modelo Document al schema**

Abre `apps/web/prisma/schema.prisma`. Justo antes del cierre del bloque de tareas (donde están los modelos `Task` y `TaskTag`), añade:

```prisma
// ============================================================
// DOCUMENTS — base de conocimiento del workspace
// ============================================================

model Document {
  id          String    @id @default(cuid())
  workspaceId String
  title       String
  content     String    @db.Text
  rawText     String    @db.Text
  category    String?
  wordCount   Int       @default(0)
  uploadedBy  String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  uploader    User      @relation(fields: [uploadedBy], references: [id])

  @@index([workspaceId])
  @@map("documents")
}
```

- [ ] **Step 2: Añadir relación inversa en Workspace**

En el modelo `Workspace`, dentro del bloque de relaciones (donde está `tasks Task[]`), añade:

```prisma
  documents            Document[]
```

- [ ] **Step 3: Añadir relación inversa en User**

En el modelo `User`, dentro del bloque de relaciones (donde está `notifications Notification[]`), añade:

```prisma
  documentsUploaded    Document[]
```

- [ ] **Step 4: Push schema a la base de datos**

```bash
cd apps/web
npx prisma db push
```

Salida esperada: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 5: Commit**

```bash
git add apps/web/prisma/schema.prisma
git commit -m "feat(docs): add Document model to Prisma schema"
```

---

### Task 2: Instalar mammoth + utilidad docx-convert

**Files:**
- Create: `apps/web/src/lib/docx-convert.ts`

- [ ] **Step 1: Instalar mammoth**

```bash
npm install mammoth --workspace=apps/web
```

Salida esperada: `added 1 package` (o similar). No hay `@types/mammoth` necesario — mammoth incluye tipos propios desde v1.7.

- [ ] **Step 2: Crear la utilidad de conversión**

Crea `apps/web/src/lib/docx-convert.ts`:

```typescript
import mammoth from 'mammoth'

export interface DocxConvertResult {
  html:      string
  rawText:   string
  wordCount: number
}

export async function convertDocx(buffer: Buffer): Promise<DocxConvertResult> {
  const [htmlResult, textResult] = await Promise.all([
    mammoth.convertToHtml({ buffer }),
    mammoth.extractRawText({ buffer }),
  ])

  const rawText   = textResult.value.trim()
  const wordCount = rawText.split(/\s+/).filter(Boolean).length

  return {
    html: htmlResult.value,
    rawText,
    wordCount,
  }
}
```

- [ ] **Step 3: Verificar que compila**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | grep docx-convert
```

Salida esperada: sin errores relacionados con `docx-convert`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/docx-convert.ts package-lock.json apps/web/package.json
git commit -m "feat(docs): add mammoth docx-to-html conversion utility"
```

---

### Task 3: API endpoint de subida POST /api/documents/upload

**Files:**
- Create: `apps/web/src/app/api/documents/upload/route.ts`

- [ ] **Step 1: Crear el endpoint**

Crea `apps/web/src/app/api/documents/upload/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { convertDocx } from '@/lib/docx-convert'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file        = formData.get('file') as File | null
  const workspaceId = formData.get('workspaceId') as string | null

  if (!file || !workspaceId) {
    return NextResponse.json({ error: 'Missing file or workspaceId' }, { status: 400 })
  }

  if (!file.name.toLowerCase().endsWith('.docx')) {
    return NextResponse.json({ error: 'Only .docx files are supported' }, { status: 400 })
  }

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const buffer = Buffer.from(await file.arrayBuffer())

  let html: string, rawText: string, wordCount: number
  try {
    ;({ html, rawText, wordCount } = await convertDocx(buffer))
  } catch {
    return NextResponse.json({ error: 'Failed to convert document' }, { status: 422 })
  }

  const title = file.name
    .replace(/\.docx$/i, '')
    .replace(/[-_]/g, ' ')
    .trim()

  const doc = await db.document.create({
    data: { workspaceId, title, content: html, rawText, wordCount, uploadedBy: user.id },
  })

  return NextResponse.json({ id: doc.id, title: doc.title, wordCount: doc.wordCount })
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | grep "documents/upload"
```

Salida esperada: sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/documents/upload/route.ts
git commit -m "feat(docs): add POST /api/documents/upload endpoint"
```

---

### Task 4: Server actions de documentos

**Files:**
- Create: `apps/web/src/app/actions/documents.ts`

- [ ] **Step 1: Crear las server actions**

Crea `apps/web/src/app/actions/documents.ts`:

```typescript
'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export interface DocumentData {
  id:           string
  title:        string
  category:     string | null
  wordCount:    number
  createdAt:    string
  uploaderName: string | null
}

export interface DocumentDetail extends DocumentData {
  content: string
}

async function getAuthUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('User not found')
  return user
}

export async function getDocuments(
  workspaceId: string,
  _userId: string,
): Promise<DocumentData[]> {
  const docs = await db.document.findMany({
    where:   { workspaceId },
    orderBy: { createdAt: 'desc' },
    select: {
      id:        true,
      title:     true,
      category:  true,
      wordCount: true,
      createdAt: true,
      uploader:  { select: { name: true } },
    },
  })

  return docs.map((d) => ({
    id:           d.id,
    title:        d.title,
    category:     d.category,
    wordCount:    d.wordCount,
    createdAt:    d.createdAt.toISOString(),
    uploaderName: d.uploader.name,
  }))
}

export async function getDocument(
  docId: string,
  workspaceId: string,
): Promise<DocumentDetail | null> {
  const doc = await db.document.findFirst({
    where:  { id: docId, workspaceId },
    select: {
      id:        true,
      title:     true,
      category:  true,
      wordCount: true,
      content:   true,
      createdAt: true,
      uploader:  { select: { name: true } },
    },
  })

  if (!doc) return null

  return {
    id:           doc.id,
    title:        doc.title,
    category:     doc.category,
    wordCount:    doc.wordCount,
    content:      doc.content,
    createdAt:    doc.createdAt.toISOString(),
    uploaderName: doc.uploader.name,
  }
}

export async function deleteDocument(
  docId: string,
  workspaceId: string,
): Promise<void> {
  await getAuthUser()
  await db.document.deleteMany({ where: { id: docId, workspaceId } })
  revalidatePath(`/workspace/${workspaceId}/docs`)
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | grep "actions/documents"
```

Salida esperada: sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/actions/documents.ts
git commit -m "feat(docs): add documents server actions"
```

---

### Task 5: Nav — icono + sidebar item + breadcrumb

**Files:**
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx`
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx`
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceTopbar.tsx`

- [ ] **Step 1: Añadir icono docs en WorkspaceIcons.tsx**

En `WorkspaceIcons.tsx`, añade el icono `docs` justo antes del cierre del objeto `Icons`:

```tsx
  docs: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
```

- [ ] **Step 2: Añadir nav item en layout.tsx**

En `apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx`, en el array `mainItems`, añade el item Docs entre el item de Clientes y el de Historial:

```tsx
    {
      label: 'Docs',
      href: `${base}/docs`,
      icon: Icons.docs,
      description: 'Base de conocimiento del workspace',
    },
```

- [ ] **Step 3: Añadir breadcrumb en WorkspaceTopbar.tsx**

En el array `SECTION_LABELS`, añade:

```tsx
  { segment: '/docs',     label: 'Docs' },
```

- [ ] **Step 4: Verificar tipos**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | grep -E "WorkspaceIcons|layout|WorkspaceTopbar" | head -10
```

Salida esperada: sin errores.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/(dashboard)/workspace/\[workspaceId\]/_components/WorkspaceIcons.tsx \
        apps/web/src/app/(dashboard)/workspace/\[workspaceId\]/layout.tsx \
        apps/web/src/app/(dashboard)/workspace/\[workspaceId\]/_components/WorkspaceTopbar.tsx
git commit -m "feat(docs): add Docs nav item, icon and breadcrumb"
```

---

### Task 6: Página de listado + DocList + UploadZone

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/page.tsx`
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/_components/DocList.tsx`
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/_components/UploadZone.tsx`

- [ ] **Step 1: Crear la página de listado (Server Component)**

Crea `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/page.tsx`:

```tsx
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { getDocuments } from '@/app/actions/documents'
import { DocList } from './_components/DocList'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function DocsPage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const workspace = await db.workspace.findFirst({
    where:  { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) notFound()

  const docs = await getDocuments(workspaceId, user.id)

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Documentación</h1>
        <p className="text-sm text-muted-foreground mt-1">Base de conocimiento del workspace</p>
      </div>
      <DocList workspaceId={workspaceId} initialDocs={docs} />
    </div>
  )
}
```

- [ ] **Step 2: Crear DocList (Client Component)**

Crea `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/_components/DocList.tsx`:

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
  const [docs, setDocs]         = useState<DocumentData[]>(initialDocs)
  const [filter, setFilter]     = useState<string | null>(null)

  const categories = Array.from(new Set(docs.map((d) => d.category).filter(Boolean))) as string[]
  const filtered   = filter ? docs.filter((d) => d.category === filter) : docs

  function handleUploaded(doc: DocumentData) {
    setDocs((prev) => [doc, ...prev])
  }

  return (
    <div className="space-y-4">
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

- [ ] **Step 3: Crear UploadZone (Client Component)**

Crea `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/_components/UploadZone.tsx`:

```tsx
'use client'

import { useRef, useState } from 'react'
import type { DocumentData } from '@/app/actions/documents'

interface Props {
  workspaceId: string
  onUploaded:  (doc: DocumentData) => void
}

export function UploadZone({ workspaceId, onUploaded }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setError('Solo se admiten archivos .docx')
      return
    }

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('workspaceId', workspaceId)

    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al subir el documento')
        return
      }

      onUploaded({
        id:           data.id,
        title:        data.title,
        category:     null,
        wordCount:    data.wordCount,
        createdAt:    new Date().toISOString(),
        uploaderName: null,
      })
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setIsUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void uploadFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void uploadFile(file)
    e.target.value = ''
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg px-4 py-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".docx"
          onChange={handleChange}
          className="hidden"
        />
        {isUploading ? (
          <p className="text-sm text-muted-foreground">Procesando...</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Arrastra un <span className="font-medium">.docx</span> aquí o{' '}
            <span className="text-primary hover:underline">elige archivo</span>
          </p>
        )}
      </div>
      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verificar tipos**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | grep "docs/" | head -10
```

Salida esperada: sin errores.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/(dashboard)/workspace/\[workspaceId\]/docs/
git commit -m "feat(docs): add docs list page, DocList and UploadZone components"
```

---

### Task 7: Visor de documento

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/page.tsx`

- [ ] **Step 1: Crear el visor**

Crea `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/page.tsx`:

```tsx
import { requireUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDocument } from '@/app/actions/documents'
import { DeleteDocButton } from './_components/DeleteDocButton'

interface Props {
  params: Promise<{ workspaceId: string; docId: string }>
}

export default async function DocViewerPage({ params }: Props) {
  const [{ workspaceId, docId }, user] = await Promise.all([params, requireUser()])

  const doc = await getDocument(docId, workspaceId)
  if (!doc) notFound()

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      {/* Volver */}
      <Link
        href={`/workspace/${workspaceId}/docs`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Documentación
      </Link>

      {/* Cabecera */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{doc.title}</h1>
          <p className="text-sm text-muted-foreground">
            {doc.wordCount.toLocaleString()} palabras ·{' '}
            {new Date(doc.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            {doc.uploaderName ? ` · ${doc.uploaderName}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs border border-primary/30 text-primary px-2.5 py-1 rounded-full">
            Arkos usa este doc ✓
          </span>
          <DeleteDocButton docId={docId} workspaceId={workspaceId} />
        </div>
      </div>

      {/* Contenido */}
      <div
        className="prose prose-sm dark:prose-invert max-w-none border border-border rounded-lg bg-card px-6 py-5"
        dangerouslySetInnerHTML={{ __html: doc.content }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Crear DeleteDocButton (Client Component)**

Crea `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/DeleteDocButton.tsx`:

```tsx
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteDocument } from '@/app/actions/documents'

interface Props {
  docId:       string
  workspaceId: string
}

export function DeleteDocButton({ docId, workspaceId }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm('¿Eliminar este documento? Esta acción no se puede deshacer.')) return
    startTransition(async () => {
      await deleteDocument(docId, workspaceId)
      router.push(`/workspace/${workspaceId}/docs`)
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
      aria-label="Eliminar documento"
    >
      {isPending ? 'Eliminando...' : 'Eliminar'}
    </button>
  )
}
```

- [ ] **Step 3: Verificar tipos**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | grep "docId" | head -10
```

Salida esperada: sin errores.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/(dashboard)/workspace/\[workspaceId\]/docs/\[docId\]/
git commit -m "feat(docs): add document viewer page with delete action"
```

---

### Task 8: Integración con Arkos — docsContext en BusinessContext

**Files:**
- Modify: `apps/web/src/lib/business-memory/memory-types.ts`
- Modify: `apps/web/src/lib/business-memory/business-context.ts`
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/copilot/page.tsx`

- [ ] **Step 1: Añadir docsContext a BusinessContext**

En `apps/web/src/lib/business-memory/memory-types.ts`, en la interfaz `BusinessContext` (línea ~199), añade el campo al final antes del cierre `}`:

```typescript
  docsContext:      string | null   // resumen de documentos para Arkos
```

- [ ] **Step 2: Poblar docsContext en getBusinessContext**

En `apps/web/src/lib/business-memory/business-context.ts`, modifica la función `getBusinessContext`:

1. En el `Promise.all`, añade la query de documentos:

```typescript
  const [profile, objectives, risks, processes, assets, docs] = await Promise.all([
    db.companyProfile.findUnique({ where: { workspaceId } }),
    db.companyObjective.findMany({ /* ... igual que antes */ }),
    db.companyRisk.findMany({ /* ... igual que antes */ }),
    db.companyProcess.findMany({ /* ... igual que antes */ }),
    db.companyAsset.findMany({ /* ... igual que antes */ }),
    db.document.findMany({
      where:   { workspaceId },
      orderBy: { createdAt: 'desc' },
      take:    3,
      select:  { title: true, rawText: true },
    }),
  ])
```

2. Construye `docsContext` al inicio de la función, antes de `if (!profile)`:

```typescript
  const docsContext = docs.length === 0 ? null : docs
    .map((d) => {
      const words = d.rawText.split(/\s+/).slice(0, 2000).join(' ')
      return `--- ${d.title} ---\n${words}`
    })
    .join('\n\n')
```

3. En el objeto retornado (cuando hay profile), añade:

```typescript
    docsContext,
```

4. En `emptyContext()`, añade:

```typescript
    docsContext: null,
```

**Nota importante:** La función `getBusinessContext` retorna antes (`return emptyContext(workspaceId)`) cuando no hay profile, pero la query de docs se hace siempre igualmente. Si el workspace no tiene profile, los docs aún existen. Asegúrate de que `docsContext` se incluye en `emptyContext`:

```typescript
function emptyContext(workspaceId: string): BusinessContext {
  return {
    // ... campos existentes ...
    docsContext: null,   // se añade aquí
    isEmpty: true,
  }
}
```

Y para que la query funcione aunque no haya profile, mueve el cálculo de `docsContext` fuera del bloque `if (!profile)`.

- [ ] **Step 3: Añadir panel "Docs disponibles" en Arkos**

En `apps/web/src/app/(dashboard)/workspace/[workspaceId]/copilot/page.tsx`, añade el panel `DocsPanel` en el aside (sidebar izquierdo), entre `<RisksPanel>` y el cierre de `<aside>`:

```tsx
<DocsPanel workspaceId={workspaceId} context={context} />
```

Añade la función del componente al final del archivo:

```tsx
function DocsPanel({ workspaceId, context }: { workspaceId: string; context: BusinessContext }) {
  if (!context.docsContext) return null

  const docTitles = context.docsContext
    .split('\n')
    .filter((line) => line.startsWith('--- ') && line.endsWith(' ---'))
    .map((line) => line.replace(/^--- /, '').replace(/ ---$/, ''))

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Docs disponibles
      </h2>
      <ul className="space-y-1.5">
        {docTitles.map((title) => (
          <li key={title} className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">📄</span>
            <span className="truncate">{title}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: Verificar tipos**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | grep -E "business-context|memory-types|copilot/page" | head -10
```

Salida esperada: sin errores.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/business-memory/memory-types.ts \
        apps/web/src/lib/business-memory/business-context.ts \
        "apps/web/src/app/(dashboard)/workspace/[workspaceId]/copilot/page.tsx"
git commit -m "feat(docs): inject workspace docs into BusinessContext for Arkos"
```

---

### Task 9: Deploy y verificación en producción

**Files:** ninguno

- [ ] **Step 1: Verificar que no hay errores TypeScript**

```bash
cd apps/web
npx tsc --noEmit
```

Salida esperada: sin errores (puede haber warnings preexistentes de `react-hooks/exhaustive-deps`).

- [ ] **Step 2: Deploy a producción**

```bash
cd /ruta/del/proyecto  # raíz del monorepo
npx vercel --prod --scope mitikus
```

Esperar hasta ver: `▲ Aliased https://www.mitikus.com`

- [ ] **Step 3: Verificar en producción**

1. Abre `https://www.mitikus.com` y navega a un workspace.
2. Verifica que aparece "Docs" en el sidebar.
3. Navega a `/docs` → debe mostrar la página de listado con zona de subida.
4. Sube un `.docx` real (uno de `C:\Users\priet\OneDrive\Documents\MITIKUS\`).
5. Verifica que aparece en la lista.
6. Clic en el documento → debe renderizar el HTML del doc.
7. Navega a Arkos → debe aparecer el panel "Docs disponibles" con el nombre del doc subido.

- [ ] **Step 4: Commit final si hay ajustes menores**

```bash
git add -A
git commit -m "fix(docs): post-deploy adjustments"
git push origin main
```
