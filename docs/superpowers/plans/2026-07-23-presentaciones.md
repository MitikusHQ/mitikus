# Presentaciones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Módulo de presentaciones en MITIKUS con editor de slides, reveal.js para renderizar y link público para compartir.

**Architecture:** Prisma + PostgreSQL almacena `Presentation` y `Slide`. Editor Client Component con guardado `onBlur` por campo. Página pública `/p/[token]` devuelve HTML completo con reveal.js servido desde route handler `/api/reveal/[file]` (sin CDN). Plantillas hardcoded en memoria.

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma, reveal.js (npm), Tailwind CSS

---

## Estructura de archivos

| Acción | Archivo | Responsabilidad |
|--------|---------|----------------|
| Modificar | `apps/web/prisma/schema.prisma` | Añadir modelos Presentation + Slide |
| Crear | `apps/web/src/app/actions/presentations.ts` | Server actions CRUD |
| Crear | `apps/web/src/app/api/reveal/[file]/route.ts` | Sirve assets reveal.js desde node_modules |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/page.tsx` | Listado Server Component |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/_components/PresentationCard.tsx` | Card del listado |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/_components/NewPresentationModal.tsx` | Modal crear presentación |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/_components/PresentationList.tsx` | Lista + botón nueva |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/[presentationId]/page.tsx` | Editor Server Component |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/[presentationId]/_components/PresentationEditorClient.tsx` | Editor Client Component principal |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/[presentationId]/_components/SlideEditor.tsx` | Editor de un slide |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/[presentationId]/_components/BulletListEditor.tsx` | Editor de bullets con Enter/Backspace |
| Crear | `apps/web/src/app/p/[token]/page.tsx` | Presentación pública reveal.js |
| Modificar | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/page.tsx` | Añadir card Presentaciones |
| Modificar | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceTopbar.tsx` | Añadir breadcrumb /presentations |

---

### Task 1: Prisma schema — modelos Presentation y Slide

**Files:**
- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: Añadir modelos al schema**

Abre `apps/web/prisma/schema.prisma`. Añade al final del archivo (antes del último `}`), después del modelo `Contract`:

```prisma
// ============================================================
// PRESENTATIONS — módulo de presentaciones con reveal.js
// ============================================================

model Presentation {
  id          String   @id @default(cuid())
  workspaceId String
  title       String
  accentColor String   @default("#6366f1")
  shareToken  String   @unique @default(cuid())
  slides      Slide[]
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  creator     User      @relation("PresentationsCreated", fields: [createdBy], references: [id], onDelete: Restrict)

  @@index([workspaceId])
  @@map("presentations")
}

model Slide {
  id             String       @id @default(cuid())
  presentationId String
  order          Int
  layout         String       @default("title-body")
  title          String       @default("")
  content        String       @default("{}")
  imageUrl       String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  presentation   Presentation @relation(fields: [presentationId], references: [id], onDelete: Cascade)

  @@index([presentationId])
  @@map("slides")
}
```

También añade las relaciones inversas al modelo `User` (busca el bloque `contractsCreated Contract[]` y añade después):

```prisma
  presentationsCreated Presentation[] @relation("PresentationsCreated")
```

Y al modelo `Workspace` (busca `contracts Contract[]` y añade después):

```prisma
  presentations        Presentation[]
```

- [ ] **Step 2: Instalar reveal.js**

```powershell
npm install reveal.js --workspace=apps/web
npm install --save-dev @types/reveal.js --workspace=apps/web
```

- [ ] **Step 3: Aplicar schema a la base de datos**

```powershell
cd apps/web
npx prisma db push
```

Expected output: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 4: Verificar que Prisma client se regeneró**

```powershell
npx prisma generate
```

- [ ] **Step 5: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add apps/web/prisma/schema.prisma
git commit -m "feat: add Presentation and Slide models to schema"
```

---

### Task 2: Server actions presentations.ts

**Files:**
- Create: `apps/web/src/app/actions/presentations.ts`

- [ ] **Step 1: Crear el archivo con todos los tipos e interfaces**

```typescript
'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// ---- Tipos ----

export type SlideLayout = 'title-body' | 'title-bullets' | 'title-image' | 'blank'

export type SlideContent =
  | { type: 'text';    value: string }
  | { type: 'bullets'; value: string[] }
  | { type: 'image';   value: string }
  | { type: 'blank';   value: null }

export interface SlideData {
  id:      string
  order:   number
  layout:  SlideLayout
  title:   string
  content: SlideContent
  imageUrl: string | null
}

export interface PresentationData {
  id:          string
  title:       string
  accentColor: string
  shareToken:  string
  slideCount:  number
  createdAt:   string
  creatorName: string | null
}

export interface PresentationDetail extends PresentationData {
  slides: SlideData[]
}

export interface PresentationPublic {
  id:          string
  title:       string
  accentColor: string
  slides:      SlideData[]
}

export interface SlideInput {
  layout?:  SlideLayout
  title?:   string
  content?: SlideContent
  imageUrl?: string | null
}

// ---- Plantillas ----

export const TEMPLATES: Record<string, { label: string; slides: Omit<SlideData, 'id' | 'order'>[] }> = {
  pitch: {
    label: 'Pitch',
    slides: [
      { layout: 'blank',         title: 'Nombre del Proyecto', content: { type: 'text', value: 'Tu tagline aquí' }, imageUrl: null },
      { layout: 'title-body',    title: 'El Problema',         content: { type: 'text', value: 'Describe el problema que resuelves.' }, imageUrl: null },
      { layout: 'title-body',    title: 'La Solución',         content: { type: 'text', value: 'Cómo lo resuelves.' }, imageUrl: null },
      { layout: 'title-bullets', title: 'Mercado',             content: { type: 'bullets', value: ['TAM: ...', 'SAM: ...', 'SOM: ...'] }, imageUrl: null },
      { layout: 'title-body',    title: 'Equipo & CTA',        content: { type: 'text', value: 'Quiénes somos y próximos pasos.' }, imageUrl: null },
    ],
  },
  propuesta: {
    label: 'Propuesta Comercial',
    slides: [
      { layout: 'blank',         title: 'Propuesta Comercial',  content: { type: 'text', value: 'Para [Cliente]' }, imageUrl: null },
      { layout: 'title-body',    title: 'Contexto',             content: { type: 'text', value: 'Situación actual del cliente.' }, imageUrl: null },
      { layout: 'title-bullets', title: 'Propuesta de Valor',   content: { type: 'bullets', value: ['Beneficio 1', 'Beneficio 2', 'Beneficio 3'] }, imageUrl: null },
      { layout: 'title-body',    title: 'Próximos Pasos',       content: { type: 'text', value: 'Cómo avanzamos juntos.' }, imageUrl: null },
    ],
  },
  informe: {
    label: 'Informe',
    slides: [
      { layout: 'blank',         title: 'Informe',       content: { type: 'text', value: 'Período: ...' }, imageUrl: null },
      { layout: 'title-bullets', title: 'Datos Clave',   content: { type: 'bullets', value: ['Dato 1', 'Dato 2', 'Dato 3'] }, imageUrl: null },
      { layout: 'title-body',    title: 'Conclusiones',  content: { type: 'text', value: 'Resumen y recomendaciones.' }, imageUrl: null },
    ],
  },
}

// ---- Helper ----

function parseContent(raw: string): SlideContent {
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.type === 'string') return parsed as SlideContent
  } catch {}
  return { type: 'text', value: '' }
}

function mapSlide(s: { id: string; order: number; layout: string; title: string; content: string; imageUrl: string | null }): SlideData {
  return {
    id:       s.id,
    order:    s.order,
    layout:   s.layout as SlideLayout,
    title:    s.title,
    content:  parseContent(s.content),
    imageUrl: s.imageUrl,
  }
}

async function getAuthUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('User not found')
  return user
}

// ---- Actions ----

export async function getPresentations(workspaceId: string): Promise<PresentationData[]> {
  await getAuthUser()
  const rows = await db.presentation.findMany({
    where:   { workspaceId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, accentColor: true, shareToken: true, createdAt: true,
      creator: { select: { name: true } },
      _count:  { select: { slides: true } },
    },
  })
  return rows.map((r) => ({
    id:          r.id,
    title:       r.title,
    accentColor: r.accentColor,
    shareToken:  r.shareToken,
    slideCount:  r._count.slides,
    createdAt:   r.createdAt.toISOString(),
    creatorName: r.creator.name ?? null,
  }))
}

export async function getPresentation(workspaceId: string, presentationId: string): Promise<PresentationDetail> {
  await getAuthUser()
  const p = await db.presentation.findFirst({
    where: { id: presentationId, workspaceId },
    include: {
      slides:  { orderBy: { order: 'asc' } },
      creator: { select: { name: true } },
      _count:  { select: { slides: true } },
    },
  })
  if (!p) throw new Error('Presentation not found')
  return {
    id:          p.id,
    title:       p.title,
    accentColor: p.accentColor,
    shareToken:  p.shareToken,
    slideCount:  p._count.slides,
    createdAt:   p.createdAt.toISOString(),
    creatorName: p.creator.name ?? null,
    slides:      p.slides.map(mapSlide),
  }
}

export async function createPresentation(
  workspaceId: string,
  title: string,
  accentColor: string,
  templateSlides?: Omit<SlideData, 'id' | 'order'>[]
): Promise<{ id: string }> {
  const user = await getAuthUser()
  const slides = templateSlides ?? []
  const p = await db.presentation.create({
    data: {
      workspaceId,
      title,
      accentColor,
      createdBy: user.id,
      slides: {
        create: slides.map((s, i) => ({
          order:   i,
          layout:  s.layout,
          title:   s.title,
          content: JSON.stringify(s.content),
          imageUrl: s.imageUrl,
        })),
      },
    },
  })
  revalidatePath(`/workspace/${workspaceId}/presentations`)
  return { id: p.id }
}

export async function updatePresentation(
  presentationId: string,
  data: { title?: string; accentColor?: string }
): Promise<void> {
  await getAuthUser()
  await db.presentation.update({ where: { id: presentationId }, data })
}

export async function addSlide(presentationId: string): Promise<{ id: string; order: number }> {
  await getAuthUser()
  const last = await db.slide.findFirst({
    where:   { presentationId },
    orderBy: { order: 'desc' },
    select:  { order: true },
  })
  const order = (last?.order ?? -1) + 1
  const slide = await db.slide.create({
    data: { presentationId, order, layout: 'title-body', title: '', content: JSON.stringify({ type: 'text', value: '' }) },
  })
  return { id: slide.id, order: slide.order }
}

export async function updateSlide(slideId: string, data: SlideInput): Promise<void> {
  await getAuthUser()
  await db.slide.update({
    where: { id: slideId },
    data: {
      ...(data.layout   !== undefined && { layout: data.layout }),
      ...(data.title    !== undefined && { title: data.title }),
      ...(data.content  !== undefined && { content: JSON.stringify(data.content) }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
    },
  })
}

export async function deleteSlide(slideId: string): Promise<void> {
  await getAuthUser()
  await db.slide.delete({ where: { id: slideId } })
}

export async function deletePresentation(presentationId: string): Promise<void> {
  const user = await getAuthUser()
  const p = await db.presentation.findUnique({ where: { id: presentationId }, select: { workspaceId: true } })
  if (!p) return
  await db.presentation.delete({ where: { id: presentationId } })
  revalidatePath(`/workspace/${p.workspaceId}/presentations`)
}

export async function getPresentationByToken(shareToken: string): Promise<PresentationPublic | null> {
  const p = await db.presentation.findUnique({
    where:   { shareToken },
    include: { slides: { orderBy: { order: 'asc' } } },
  })
  if (!p) return null
  return {
    id:          p.id,
    title:       p.title,
    accentColor: p.accentColor,
    slides:      p.slides.map(mapSlide),
  }
}
```

- [ ] **Step 2: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/actions/presentations.ts"
git commit -m "feat: add presentations server actions"
```

---

### Task 3: Route handler reveal.js assets

**Files:**
- Create: `apps/web/src/app/api/reveal/[file]/route.ts`

- [ ] **Step 1: Crear el route handler**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

const ALLOWED: Record<string, string> = {
  'reveal.css':        'text/css',
  'reveal.js':         'application/javascript',
  'theme/white.css':   'text/css',
  'theme/black.css':   'text/css',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params
  const contentType = ALLOWED[file]
  if (!contentType) return new NextResponse('Not found', { status: 404 })

  const revealBase = path.join(process.cwd(), 'node_modules', 'reveal.js', 'dist')
  const filePath   = path.join(revealBase, file)

  // Evitar path traversal
  if (!filePath.startsWith(revealBase)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
```

- [ ] **Step 2: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/api/reveal/"
git commit -m "feat: add reveal.js asset route handler"
```

---

### Task 4: Página pública /p/[token]

**Files:**
- Create: `apps/web/src/app/p/[token]/page.tsx`

Esta página vive fuera del dashboard layout y devuelve un documento HTML completo con reveal.js.

- [ ] **Step 1: Crear la página**

```typescript
import { notFound } from 'next/navigation'
import { getPresentationByToken } from '@/app/actions/presentations'
import type { SlideData } from '@/app/actions/presentations'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ token: string }>
}

function renderSlideHtml(slide: SlideData): string {
  const titleHtml = slide.title
    ? `<h2 style="color:var(--accent)">${escapeHtml(slide.title)}</h2>`
    : ''

  let bodyHtml = ''
  if (slide.layout === 'title-body' && slide.content.type === 'text') {
    bodyHtml = `<p>${escapeHtml(slide.content.value)}</p>`
  } else if (slide.layout === 'title-bullets' && slide.content.type === 'bullets') {
    const items = slide.content.value.map((b) => `<li>${escapeHtml(b)}</li>`).join('')
    bodyHtml = `<ul style="text-align:left;display:inline-block">${items}</ul>`
  } else if (slide.layout === 'title-image' && slide.imageUrl) {
    bodyHtml = `<img src="${escapeHtml(slide.imageUrl)}" style="max-height:400px;max-width:100%;object-fit:contain" alt="" />`
  }

  return `<section>${titleHtml}${bodyHtml}</section>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default async function PublicPresentationPage({ params }: Props) {
  const { token } = await params
  const presentation = await getPresentationByToken(token)
  if (!presentation) notFound()

  const slidesHtml = presentation.slides.map(renderSlideHtml).join('\n')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(presentation.title)}</title>
  <link rel="stylesheet" href="/api/reveal/reveal.css">
  <link rel="stylesheet" href="/api/reveal/theme/white.css">
  <style>
    :root { --accent: ${presentation.accentColor}; }
    .reveal h2 { color: var(--accent); }
    .reveal .slides { text-align: center; }
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      ${slidesHtml}
    </div>
  </div>
  <script src="/api/reveal/reveal.js"></script>
  <script>Reveal.initialize({ hash: true, slideNumber: true });</script>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
```

- [ ] **Step 2: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/p/"
git commit -m "feat: add public presentation page with reveal.js"
```

---

### Task 5: Componentes del listado (PresentationCard + NewPresentationModal + PresentationList)

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/_components/PresentationCard.tsx`
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/_components/NewPresentationModal.tsx`
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/_components/PresentationList.tsx`

- [ ] **Step 1: Crear PresentationCard.tsx**

```typescript
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deletePresentation } from '@/app/actions/presentations'
import type { PresentationData } from '@/app/actions/presentations'

interface Props {
  presentation: PresentationData
  workspaceId:  string
}

export function PresentationCard({ presentation, workspaceId }: Props) {
  const router  = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    if (!confirm('¿Eliminar esta presentación?')) return
    setDeleting(true)
    await deletePresentation(presentation.id)
    router.refresh()
  }

  function handleCopyLink(e: React.MouseEvent) {
    e.preventDefault()
    void navigator.clipboard.writeText(`https://www.mitikus.com/p/${presentation.shareToken}`)
  }

  return (
    <Link
      href={`/workspace/${workspaceId}/presentations/${presentation.id}`}
      className="group relative flex flex-col gap-2 rounded-lg border p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors"
    >
      <div
        className="h-1 w-8 rounded-full mb-1"
        style={{ backgroundColor: presentation.accentColor }}
      />
      <p className="font-medium text-sm truncate">{presentation.title}</p>
      <p className="text-xs text-muted-foreground">
        {presentation.slideCount} {presentation.slideCount === 1 ? 'slide' : 'slides'} ·{' '}
        {new Date(presentation.createdAt).toLocaleDateString('es-ES')}
      </p>
      <div className="absolute right-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopyLink}
          title="Copiar link público"
          className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground text-xs"
        >
          🔗
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Eliminar"
          className="rounded p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive text-xs"
        >
          ×
        </button>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Crear NewPresentationModal.tsx**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPresentation, TEMPLATES } from '@/app/actions/presentations'

const PRESET_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

interface Props {
  workspaceId: string
  onClose:     () => void
}

export function NewPresentationModal({ workspaceId, onClose }: Props) {
  const router   = useRouter()
  const [title,       setTitle]       = useState('')
  const [color,       setColor]       = useState('#6366f1')
  const [template,    setTemplate]    = useState<string>('blank')
  const [isCreating,  setIsCreating]  = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setIsCreating(true)
    const slides = template !== 'blank' ? TEMPLATES[template]?.slides : undefined
    const { id } = await createPresentation(workspaceId, title.trim(), color, slides)
    router.push(`/workspace/${workspaceId}/presentations/${id}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg border shadow-lg w-full max-w-md mx-4 p-6">
        <h2 className="text-base font-semibold mb-4">Nueva presentación</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mi presentación"
              required
              autoFocus
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">Color de acento</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 rounded cursor-pointer border border-input"
                title="Color personalizado"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">Plantilla</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTemplate('blank')}
                className={`rounded-md border p-3 text-left text-xs transition-colors ${template === 'blank' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
              >
                <div className="font-medium mb-0.5">En blanco</div>
                <div className="text-muted-foreground">Empieza desde cero</div>
              </button>
              {Object.entries(TEMPLATES).map(([key, tpl]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTemplate(key)}
                  className={`rounded-md border p-3 text-left text-xs transition-colors ${template === key ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                >
                  <div className="font-medium mb-0.5">{tpl.label}</div>
                  <div className="text-muted-foreground">{tpl.slides.length} slides</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="flex-1 rounded-md border border-input px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating || !title.trim()}
              className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {isCreating ? 'Creando...' : 'Crear presentación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Crear PresentationList.tsx**

```typescript
'use client'

import { useState } from 'react'
import { PresentationCard } from './PresentationCard'
import { NewPresentationModal } from './NewPresentationModal'
import type { PresentationData } from '@/app/actions/presentations'

interface Props {
  workspaceId: string
  initial:     PresentationData[]
}

export function PresentationList({ workspaceId, initial }: Props) {
  const presentations = initial
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Presentaciones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {presentations.length} {presentations.length === 1 ? 'presentación' : 'presentaciones'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/90"
        >
          + Nueva presentación
        </button>
      </div>

      {presentations.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          <p>Aún no hay presentaciones.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 text-primary hover:underline"
          >
            Crea tu primera presentación
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {presentations.map((p) => (
            <PresentationCard key={p.id} presentation={p} workspaceId={workspaceId} />
          ))}
        </div>
      )}

      {showModal && (
        <NewPresentationModal
          workspaceId={workspaceId}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/_components/"
git commit -m "feat: add PresentationCard, NewPresentationModal, and PresentationList"
```

---

### Task 6: Página listado /presentations

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/page.tsx`

- [ ] **Step 1: Crear la página**

```typescript
import { requireUser } from '@/lib/auth'
import { getPresentations } from '@/app/actions/presentations'
import { PresentationList } from './_components/PresentationList'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function PresentationsPage({ params }: Props) {
  await requireUser()
  const { workspaceId } = await params
  const presentations = await getPresentations(workspaceId)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PresentationList workspaceId={workspaceId} initial={presentations} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/page.tsx"
git commit -m "feat: add presentations list page"
```

---

### Task 7: BulletListEditor

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/[presentationId]/_components/BulletListEditor.tsx`

- [ ] **Step 1: Crear el componente**

```typescript
'use client'

import { useRef } from 'react'

interface Props {
  bullets:  string[]
  onChange: (bullets: string[]) => void
  onBlur:   () => void
}

export function BulletListEditor({ bullets, onChange, onBlur }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const items = bullets.length > 0 ? bullets : ['']

  function handleChange(index: number, value: string) {
    const next = [...items]
    next[index] = value
    onChange(next)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const next = [...items]
      next.splice(index + 1, 0, '')
      onChange(next)
      // Enfocar el siguiente input en el siguiente render
      setTimeout(() => {
        const inputs = containerRef.current?.querySelectorAll('input')
        inputs?.[index + 1]?.focus()
      }, 0)
    }
    if (e.key === 'Backspace' && items[index] === '' && items.length > 1) {
      e.preventDefault()
      const next = items.filter((_, i) => i !== index)
      onChange(next)
      setTimeout(() => {
        const inputs = containerRef.current?.querySelectorAll('input')
        inputs?.[Math.max(0, index - 1)]?.focus()
      }, 0)
    }
  }

  function handleContainerBlur(e: React.FocusEvent<HTMLDivElement>) {
    // Solo disparar onBlur si el foco sale completamente del contenedor
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      onBlur()
    }
  }

  return (
    <div
      ref={containerRef}
      onBlur={handleContainerBlur}
      className="space-y-1"
      tabIndex={-1}
    >
      {items.map((bullet, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm shrink-0">•</span>
          <input
            type="text"
            value={bullet}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            placeholder="Punto clave..."
            className="flex-1 bg-transparent text-sm border-b border-transparent focus:border-primary focus:outline-none py-0.5"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          onChange([...items, ''])
          setTimeout(() => {
            const inputs = containerRef.current?.querySelectorAll('input')
            inputs?.[items.length]?.focus()
          }, 0)
        }}
        className="text-xs text-muted-foreground hover:text-foreground mt-1"
      >
        + Añadir punto
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/[presentationId]/_components/BulletListEditor.tsx"
git commit -m "feat: add BulletListEditor with Enter/Backspace navigation"
```

---

### Task 8: SlideEditor

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/[presentationId]/_components/SlideEditor.tsx`

- [ ] **Step 1: Crear el componente**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { BulletListEditor } from './BulletListEditor'
import type { SlideData, SlideLayout, SlideContent, SlideInput } from '@/app/actions/presentations'

interface Props {
  slide:       SlideData
  saveStatus:  'idle' | 'saving' | 'saved'
  onBlur:      (data: SlideInput) => void
  onLayoutChange: (layout: SlideLayout) => void
}

const LAYOUTS: { value: SlideLayout; label: string; icon: string }[] = [
  { value: 'blank',         label: 'Solo título',  icon: '▭' },
  { value: 'title-body',    label: 'Título + texto', icon: '≡' },
  { value: 'title-bullets', label: 'Título + lista', icon: '☰' },
  { value: 'title-image',   label: 'Título + imagen', icon: '🖼' },
]

export function SlideEditor({ slide, saveStatus, onBlur, onLayoutChange }: Props) {
  const [title,   setTitle]   = useState(slide.title)
  const [content, setContent] = useState<SlideContent>(slide.content)
  const [imageUrl, setImageUrl] = useState(slide.imageUrl ?? '')

  // Sincronizar cuando cambia el slide seleccionado
  useEffect(() => {
    setTitle(slide.title)
    setContent(slide.content)
    setImageUrl(slide.imageUrl ?? '')
  }, [slide.id])

  function handleTitleBlur() {
    onBlur({ title })
  }

  function handleBodyBlur() {
    if (content.type === 'text') onBlur({ content })
  }

  function handleImageBlur() {
    onBlur({ imageUrl: imageUrl || null, content: { type: 'image', value: imageUrl } })
  }

  function handleBulletsBlur() {
    if (content.type === 'bullets') onBlur({ content })
  }

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Layout selector */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Layout</p>
        <div className="flex gap-2">
          {LAYOUTS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => onLayoutChange(l.value)}
              title={l.label}
              className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                slide.layout === l.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              {l.icon} {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Título */}
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Título</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="Título del slide"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Contenido según layout */}
      {slide.layout === 'title-body' && (
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground block mb-1">Contenido</label>
          <textarea
            value={content.type === 'text' ? content.value : ''}
            onChange={(e) => setContent({ type: 'text', value: e.target.value })}
            onBlur={handleBodyBlur}
            placeholder="Escribe el contenido del slide..."
            className="w-full h-40 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
      )}

      {slide.layout === 'title-bullets' && (
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-2">
            Puntos clave <span className="font-normal">(Enter para añadir, Backspace en vacío para eliminar)</span>
          </label>
          <BulletListEditor
            bullets={content.type === 'bullets' ? content.value : ['']}
            onChange={(bullets) => setContent({ type: 'bullets', value: bullets })}
            onBlur={handleBulletsBlur}
          />
        </div>
      )}

      {slide.layout === 'title-image' && (
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">URL de imagen</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onBlur={handleImageBlur}
            placeholder="https://..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Preview"
              className="mt-2 max-h-40 rounded-md object-contain border"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
        </div>
      )}

      {/* Indicador de guardado */}
      <div className="text-xs text-muted-foreground mt-auto">
        {saveStatus === 'saving' && '⏳ Guardando...'}
        {saveStatus === 'saved'  && '✓ Guardado'}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/[presentationId]/_components/SlideEditor.tsx"
git commit -m "feat: add SlideEditor component with layout switcher"
```

---

### Task 9: PresentationEditorClient

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/[presentationId]/_components/PresentationEditorClient.tsx`

- [ ] **Step 1: Crear el componente**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SlideEditor } from './SlideEditor'
import {
  updatePresentation, updateSlide, addSlide, deleteSlide,
} from '@/app/actions/presentations'
import type { PresentationDetail, SlideData, SlideLayout, SlideInput } from '@/app/actions/presentations'

const PRESET_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

interface Props {
  presentation: PresentationDetail
  workspaceId:  string
}

export function PresentationEditorClient({ presentation, workspaceId }: Props) {
  const router = useRouter()
  const [slides,         setSlides]        = useState<SlideData[]>(presentation.slides)
  const [activeSlideId,  setActiveSlideId] = useState<string>(presentation.slides[0]?.id ?? '')
  const [title,          setTitle]         = useState(presentation.title)
  const [accentColor,    setAccentColor]   = useState(presentation.accentColor)
  const [saveStatus,     setSaveStatus]    = useState<'idle' | 'saving' | 'saved'>('idle')

  const activeSlide = slides.find((s) => s.id === activeSlideId) ?? slides[0]

  async function handleSlideBlur(data: SlideInput) {
    if (!activeSlide) return
    setSaveStatus('saving')
    await updateSlide(activeSlide.id, data)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
    // Actualizar estado local
    setSlides((prev) => prev.map((s) =>
      s.id !== activeSlide.id ? s : {
        ...s,
        ...(data.layout   !== undefined && { layout: data.layout }),
        ...(data.title    !== undefined && { title: data.title }),
        ...(data.content  !== undefined && { content: data.content }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      }
    ))
  }

  async function handleLayoutChange(layout: SlideLayout) {
    if (!activeSlide) return
    await handleSlideBlur({ layout })
  }

  async function handleTitleBlur() {
    await updatePresentation(presentation.id, { title })
  }

  async function handleColorChange(color: string) {
    setAccentColor(color)
    await updatePresentation(presentation.id, { accentColor: color })
  }

  async function handleAddSlide() {
    const { id, order } = await addSlide(presentation.id)
    const newSlide: SlideData = {
      id, order,
      layout:  'title-body',
      title:   '',
      content: { type: 'text', value: '' },
      imageUrl: null,
    }
    setSlides((prev) => [...prev, newSlide])
    setActiveSlideId(id)
  }

  async function handleDeleteSlide(slideId: string) {
    if (slides.length <= 1) return
    await deleteSlide(slideId)
    const remaining = slides.filter((s) => s.id !== slideId)
    setSlides(remaining)
    if (activeSlideId === slideId) {
      setActiveSlideId(remaining[0]?.id ?? '')
    }
  }

  function handleShare() {
    void navigator.clipboard.writeText(`https://www.mitikus.com/p/${presentation.shareToken}`)
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="font-semibold text-sm bg-transparent border-b border-transparent hover:border-input focus:border-primary focus:outline-none px-1 min-w-0 flex-1 max-w-xs"
        />
        {/* Color picker */}
        <div className="flex gap-1.5 items-center">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => void handleColorChange(c)}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${accentColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleShare}
            className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-muted"
          >
            🔗 Compartir
          </button>
          <a
            href={`/p/${presentation.shareToken}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90"
          >
            ▶ Presentar
          </a>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: lista de slides */}
        <div className="w-48 shrink-0 border-r overflow-y-auto py-2">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              onClick={() => setActiveSlideId(slide.id)}
              className={`group relative mx-2 mb-1 rounded-md px-3 py-2 cursor-pointer text-xs transition-colors ${
                activeSlideId === slide.id
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted/50'
              }`}
            >
              <span className="text-muted-foreground mr-1">{i + 1}.</span>
              <span className="truncate">{slide.title || '(sin título)'}</span>
              {slides.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); void handleDeleteSlide(slide.id) }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive px-1"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => void handleAddSlide()}
            className="w-full text-xs text-muted-foreground hover:text-foreground py-2 px-4 text-left hover:bg-muted/30"
          >
            + Slide
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto">
          {activeSlide ? (
            <SlideEditor
              key={activeSlide.id}
              slide={activeSlide}
              saveStatus={saveStatus}
              onBlur={handleSlideBlur}
              onLayoutChange={handleLayoutChange}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Selecciona un slide
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/[presentationId]/_components/PresentationEditorClient.tsx"
git commit -m "feat: add PresentationEditorClient with slide management"
```

---

### Task 10: Página editor /presentations/[presentationId]

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/[presentationId]/page.tsx`

- [ ] **Step 1: Crear la página**

```typescript
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { getPresentation } from '@/app/actions/presentations'
import { PresentationEditorClient } from './_components/PresentationEditorClient'

interface Props {
  params: Promise<{ workspaceId: string; presentationId: string }>
}

export default async function PresentationEditorPage({ params }: Props) {
  await requireUser()
  const { workspaceId, presentationId } = await params

  let presentation
  try {
    presentation = await getPresentation(workspaceId, presentationId)
  } catch {
    notFound()
  }

  return (
    <div className="h-screen overflow-hidden">
      <PresentationEditorClient presentation={presentation} workspaceId={workspaceId} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/presentations/[presentationId]/page.tsx"
git commit -m "feat: add presentation editor page"
```

---

### Task 11: Integración Mi Office + breadcrumb

**Files:**
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceTopbar.tsx`

- [ ] **Step 1: Leer office/page.tsx**

Lee el archivo para ver el patrón exacto de las cards existentes (Documentos, Hojas de cálculo, PDFs, Contratos).

- [ ] **Step 2: Añadir card Presentaciones**

Sigue el patrón existente y añade una card con:
- href: `/workspace/${workspaceId}/presentations`
- Icono: 📊 o SVG de diapositiva
- Título: "Presentaciones"
- Descripción: "Crea y comparte presentaciones con reveal.js"

- [ ] **Step 3: Añadir entrada en WorkspaceTopbar.tsx**

Busca el objeto `SECTION_LABELS` y añade:
```typescript
'/presentations': 'Presentaciones',
```

- [ ] **Step 4: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/page.tsx"
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceTopbar.tsx"
git commit -m "feat: add Presentaciones card to Mi Office and breadcrumb entry"
```

---

### Task 12: TypeScript check + build + deploy

**Files:** ninguno nuevo — verificación y despliegue

- [ ] **Step 1: TypeScript check**

```powershell
cd apps/web
npx tsc --noEmit 2>&1 | Select-Object -First 60
```

Si hay errores, corrígelos antes de continuar. Errores comunes:
- `SlideContent` con union type — asegúrate de narrowing con `slide.content.type === 'text'` antes de acceder a `.value`
- `params` sin `await` en páginas Next.js 15
- Imports de tipos que no existen aún

- [ ] **Step 2: Build**

```powershell
cd C:\Users\priet\protools-hub
npm run build --workspace=apps/web 2>&1 | Select-Object -Last 30
```

- [ ] **Step 3: Deploy**

```powershell
cd C:\Users\priet\protools-hub
npx vercel --prod --scope mitikus 2>&1
```

- [ ] **Step 4: Commit si hubo fixes**

```powershell
cd C:\Users\priet\protools-hub
git add -A
git commit -m "fix: typescript and build fixes for presentations module"
```
