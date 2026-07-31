# Notebooks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Módulo Notebooks en MITIKUS: notebooks persistentes con fuentes múltiples (docs/PDFs del workspace, texto pegado, URLs), síntesis automática con IA y chat streaming con Claude.

**Architecture:** Prisma + PostgreSQL para notebooks, fuentes y mensajes. Texto extraído y guardado en BD al añadir cada fuente. El chat construye el prompt con todas las fuentes concatenadas y llama a Claude claude-sonnet-5 vía `@anthropic-ai/sdk` con streaming ReadableStream. La síntesis (resumen + puntos clave + preguntas sugeridas) se cachea en `Notebook.synthesisCache` y se regenera cuando `synthesisDirty=true`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma, `@anthropic-ai/sdk` (ya instalado), `pdf-parse` (ya instalado), `cheerio` (instalar), Tailwind CSS

---

## Mapa de archivos

| Acción | Archivo |
|--------|---------|
| Modificar | `apps/web/prisma/schema.prisma` |
| Crear | `apps/web/src/app/actions/notebooks.ts` |
| Crear | `apps/web/src/app/api/notebooks/[notebookId]/chat/route.ts` |
| Crear | `apps/web/src/app/api/notebooks/[notebookId]/synthesize/route.ts` |
| Crear | `apps/web/src/app/api/notebooks/[notebookId]/suggest-title/route.ts` |
| Crear | `apps/web/src/lib/notebook-extract.ts` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/page.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/_components/NotebookCard.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/_components/NotebookList.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/[notebookId]/page.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/[notebookId]/_components/NotebookClient.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/[notebookId]/_components/SourcePanel.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/[notebookId]/_components/AddSourceModal.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/[notebookId]/_components/SynthesisPanel.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/[notebookId]/_components/ChatPanel.tsx` |
| Crear | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/[notebookId]/_components/ChatMessage.tsx` |
| Modificar | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/page.tsx` |
| Modificar | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceTopbar.tsx` |

---

## Task 1: Prisma schema + cheerio + db push

**Files:**
- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: Instalar cheerio**

```powershell
cd C:\Users\priet\protools-hub
npm install cheerio --workspace=apps/web
```

- [ ] **Step 2: Añadir modelos al schema**

En `apps/web/prisma/schema.prisma`, añadir los tres modelos nuevos y las relaciones inversas. Busca el bloque del modelo `Presentation` (al final del schema) e inserta después:

```prisma
model Notebook {
  id              String    @id @default(cuid())
  workspaceId     String
  title           String    @default("Nuevo notebook")
  synthesisCache  String?   @db.Text // JSON: { summary, keyPoints[], suggestedQuestions[] }
  synthesisDirty  Boolean   @default(true)
  createdBy       String
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  workspace  Workspace         @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  creator    User              @relation("NotebooksCreated", fields: [createdBy], references: [id], onDelete: Restrict)
  sources    NotebookSource[]
  messages   NotebookMessage[]

  @@index([workspaceId])
  @@map("notebooks")
}

model NotebookSource {
  id         String   @id @default(cuid())
  notebookId String
  type       String   // 'doc' | 'pdf' | 'text' | 'url'
  title      String
  content    String   @db.Text
  charCount  Int
  docId      String?
  pdfId      String?
  url        String?
  createdAt  DateTime @default(now())

  notebook   Notebook @relation(fields: [notebookId], references: [id], onDelete: Cascade)

  @@index([notebookId])
  @@map("notebook_sources")
}

model NotebookMessage {
  id              String   @id @default(cuid())
  notebookId      String
  role            String   // 'user' | 'assistant'
  content         String   @db.Text
  sourcesSnapshot String   @default("[]") @db.Text
  createdAt       DateTime @default(now())

  notebook   Notebook @relation(fields: [notebookId], references: [id], onDelete: Cascade)

  @@index([notebookId])
  @@map("notebook_messages")
}
```

- [ ] **Step 3: Añadir relaciones inversas en User y Workspace**

En el modelo `User`, añadir:
```prisma
notebooksCreated  Notebook[]  @relation("NotebooksCreated")
```

En el modelo `Workspace`, añadir:
```prisma
notebooks  Notebook[]
```

- [ ] **Step 4: Aplicar el schema**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx prisma db push
```

Esperado: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 5: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add apps/web/prisma/schema.prisma apps/web/package.json apps/web/package-lock.json
git commit -m "feat: add Notebook, NotebookSource, NotebookMessage schemas + cheerio"
```

---

## Task 2: Utilidad de extracción de texto (`notebook-extract.ts`)

**Files:**
- Create: `apps/web/src/lib/notebook-extract.ts`

Esta utilidad extrae texto plano de las cuatro fuentes posibles. Se usa en los server actions al añadir fuentes.

- [ ] **Step 1: Crear el archivo**

```typescript
// apps/web/src/lib/notebook-extract.ts
import * as cheerio from 'cheerio'

const CHAR_LIMIT = 400_000

export interface ExtractResult {
  title:     string
  content:   string
  charCount: number
}

/** Elimina tags HTML y devuelve texto plano */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Extrae texto de un Buffer PDF usando pdf-parse */
export async function extractPdf(buffer: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(buffer)
  return data.text.trim()
}

/** Extrae texto del HTML de un documento (Tiptap) */
export function extractDocHtml(html: string): string {
  return stripHtml(html)
}

/** Extrae texto y título de una URL externa */
export async function extractUrl(url: string): Promise<{ title: string; content: string }> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 MITIKUS-Notebooks/1.0' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${url}`)
  const html = await res.text()
  const $ = cheerio.load(html)

  // Eliminar scripts, styles y nav
  $('script, style, nav, header, footer, aside').remove()

  const title = $('title').text().trim() || url
  const content = $('body').text().replace(/\s+/g, ' ').trim()
  return { title, content }
}

/** Verifica que añadir charCount no supera el límite global del notebook */
export function checkLimit(currentTotal: number, incoming: number): boolean {
  return currentTotal + incoming <= CHAR_LIMIT
}

export { CHAR_LIMIT }
```

- [ ] **Step 2: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add apps/web/src/lib/notebook-extract.ts
git commit -m "feat: add notebook text extraction utility"
```

---

## Task 3: Server actions (`notebooks.ts`)

**Files:**
- Create: `apps/web/src/app/actions/notebooks.ts`

- [ ] **Step 1: Crear el archivo completo**

```typescript
// apps/web/src/app/actions/notebooks.ts
'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { extractDocHtml, extractPdf, extractUrl, checkLimit, CHAR_LIMIT } from '@/lib/notebook-extract'

// ---- Tipos ----

export interface NotebookData {
  id:          string
  title:       string
  sourceCount: number
  createdAt:   string
}

export interface NotebookSourceData {
  id:        string
  type:      string
  title:     string
  charCount: number
  docId:     string | null
  pdfId:     string | null
  url:       string | null
  createdAt: string
}

export interface NotebookMessageData {
  id:        string
  role:      string
  content:   string
  createdAt: string
}

export interface SynthesisCache {
  summary:            string
  keyPoints:          string[]
  suggestedQuestions: string[]
}

export interface NotebookDetail {
  id:             string
  title:          string
  synthesisCache: SynthesisCache | null
  synthesisDirty: boolean
  totalChars:     number
  sources:        NotebookSourceData[]
  messages:       NotebookMessageData[]
}

export interface AddSourceInput {
  type:   'doc' | 'pdf' | 'text' | 'url'
  docId?: string
  pdfId?: string
  text?:  string
  title?: string
  url?:   string
}

// ---- Auth helper ----

async function getAuthUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('User not found')
  return user
}

// ---- Actions ----

export async function getNotebooks(workspaceId: string): Promise<NotebookData[]> {
  await getAuthUser()
  const rows = await db.notebook.findMany({
    where:   { workspaceId },
    orderBy: { createdAt: 'desc' },
    select: {
      id:        true,
      title:     true,
      createdAt: true,
      _count:    { select: { sources: true } },
    },
  })
  return rows.map((r) => ({
    id:          r.id,
    title:       r.title,
    sourceCount: r._count.sources,
    createdAt:   r.createdAt.toISOString(),
  }))
}

export async function getNotebook(workspaceId: string, notebookId: string): Promise<NotebookDetail> {
  await getAuthUser()
  const n = await db.notebook.findFirst({
    where:   { id: notebookId, workspaceId },
    include: {
      sources:  { orderBy: { createdAt: 'asc' } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!n) throw new Error('Notebook not found')

  const totalChars = n.sources.reduce((acc, s) => acc + s.charCount, 0)

  let parsedCache: SynthesisCache | null = null
  if (n.synthesisCache) {
    try { parsedCache = JSON.parse(n.synthesisCache) } catch {}
  }

  return {
    id:             n.id,
    title:          n.title,
    synthesisCache: parsedCache,
    synthesisDirty: n.synthesisDirty,
    totalChars,
    sources:        n.sources.map((s) => ({
      id:        s.id,
      type:      s.type,
      title:     s.title,
      charCount: s.charCount,
      docId:     s.docId,
      pdfId:     s.pdfId,
      url:       s.url,
      createdAt: s.createdAt.toISOString(),
    })),
    messages: n.messages.map((m) => ({
      id:        m.id,
      role:      m.role,
      content:   m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  }
}

export async function createNotebook(workspaceId: string): Promise<{ id: string }> {
  const user = await getAuthUser()
  const n = await db.notebook.create({
    data: { workspaceId, createdBy: user.id },
  })
  revalidatePath(`/workspace/${workspaceId}/notebooks`)
  return { id: n.id }
}

export async function updateNotebook(notebookId: string, title: string): Promise<void> {
  await getAuthUser()
  await db.notebook.update({ where: { id: notebookId }, data: { title } })
}

export async function updateNotebookTitle(notebookId: string, title: string): Promise<void> {
  await getAuthUser()
  await db.notebook.update({ where: { id: notebookId }, data: { title } })
}

export async function addSource(notebookId: string, input: AddSourceInput): Promise<NotebookSourceData> {
  await getAuthUser()

  // Calcular total actual de chars
  const agg = await db.notebookSource.aggregate({
    where: { notebookId },
    _sum:  { charCount: true },
  })
  const currentTotal = agg._sum.charCount ?? 0

  let content = ''
  let title   = input.title ?? ''

  if (input.type === 'doc' && input.docId) {
    const doc = await db.document.findUnique({
      where:  { id: input.docId },
      select: { title: true, content: true },
    })
    if (!doc) throw new Error('Documento no encontrado')
    title   = doc.title
    content = extractDocHtml(doc.content ?? '')
  } else if (input.type === 'pdf' && input.pdfId) {
    const pdf = await db.pdf.findUnique({
      where:  { id: input.pdfId },
      select: { title: true, pdfData: true },
    })
    if (!pdf) throw new Error('PDF no encontrado')
    title   = pdf.title
    content = await extractPdf(Buffer.from(pdf.pdfData))
  } else if (input.type === 'text' && input.text) {
    content = input.text.trim()
    title   = title || content.slice(0, 60)
  } else if (input.type === 'url' && input.url) {
    const extracted = await extractUrl(input.url)
    content = extracted.content
    title   = title || extracted.title
  } else {
    throw new Error('Input inválido para el tipo de fuente')
  }

  const charCount = content.length
  if (!checkLimit(currentTotal, charCount)) {
    throw new Error(`LIMIT_EXCEEDED:${currentTotal}:${CHAR_LIMIT}`)
  }

  const source = await db.notebookSource.create({
    data: {
      notebookId,
      type:  input.type,
      title,
      content,
      charCount,
      docId: input.docId ?? null,
      pdfId: input.pdfId ?? null,
      url:   input.url ?? null,
    },
  })

  // Marcar síntesis como sucia
  await db.notebook.update({
    where: { id: notebookId },
    data:  { synthesisDirty: true },
  })

  return {
    id:        source.id,
    type:      source.type,
    title:     source.title,
    charCount: source.charCount,
    docId:     source.docId,
    pdfId:     source.pdfId,
    url:       source.url,
    createdAt: source.createdAt.toISOString(),
  }
}

export async function deleteSource(sourceId: string, notebookId: string): Promise<void> {
  await getAuthUser()
  await db.notebookSource.delete({ where: { id: sourceId } })
  await db.notebook.update({
    where: { id: notebookId },
    data:  { synthesisDirty: true },
  })
}

export async function deleteNotebook(notebookId: string, workspaceId: string): Promise<void> {
  await getAuthUser()
  await db.notebook.delete({ where: { id: notebookId } })
  revalidatePath(`/workspace/${workspaceId}/notebooks`)
}

export async function saveMessage(
  notebookId:      string,
  role:            'user' | 'assistant',
  content:         string,
  sourcesSnapshot: string[],
): Promise<void> {
  await db.notebookMessage.create({
    data: {
      notebookId,
      role,
      content,
      sourcesSnapshot: JSON.stringify(sourcesSnapshot),
    },
  })
}

export async function saveSynthesis(notebookId: string, synthesisJson: string): Promise<void> {
  await db.notebook.update({
    where: { id: notebookId },
    data:  { synthesisCache: synthesisJson, synthesisDirty: false },
  })
}

export async function getWorkspaceDocs(workspaceId: string): Promise<{ id: string; title: string }[]> {
  await getAuthUser()
  const docs = await db.document.findMany({
    where:   { workspaceId },
    orderBy: { createdAt: 'desc' },
    select:  { id: true, title: true },
  })
  return docs
}

export async function getWorkspacePdfs(workspaceId: string): Promise<{ id: string; title: string }[]> {
  await getAuthUser()
  const pdfs = await db.pdf.findMany({
    where:   { workspaceId },
    orderBy: { createdAt: 'desc' },
    select:  { id: true, title: true },
  })
  return pdfs
}
```

- [ ] **Step 2: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add apps/web/src/app/actions/notebooks.ts
git commit -m "feat: add notebooks server actions"
```

---

## Task 4: API route `/api/notebooks/[notebookId]/chat`

**Files:**
- Create: `apps/web/src/app/api/notebooks/[notebookId]/chat/route.ts`

- [ ] **Step 1: Crear el route handler con streaming**

```typescript
// apps/web/src/app/api/notebooks/[notebookId]/chat/route.ts
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

export const runtime    = 'nodejs'
export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ notebookId: string }> },
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return new Response('Unauthorized', { status: 401 })

  const { notebookId } = await params
  const body = await req.json().catch(() => ({})) as { message?: string }
  if (!body.message) return new Response('message required', { status: 400 })

  // Cargar fuentes y mensajes
  const notebook = await db.notebook.findUnique({
    where:   { id: notebookId },
    include: {
      sources:  { orderBy: { createdAt: 'asc' } },
      messages: { orderBy: { createdAt: 'asc' }, take: 20 },
    },
  })
  if (!notebook) return new Response('Not found', { status: 404 })

  // Construir contexto de fuentes
  const sourcesContext = notebook.sources
    .map((s) => `--- ${s.title.toUpperCase()} ---\n${s.content}`)
    .join('\n\n')

  const systemPrompt = `Eres un asistente que analiza documentos y responde preguntas basándote exclusivamente en el contenido de las fuentes proporcionadas. Si la respuesta no está en las fuentes, indícalo explícitamente.

FUENTES DISPONIBLES:

${sourcesContext}`

  // Historial de mensajes
  const history: Anthropic.MessageParam[] = notebook.messages.map((m) => ({
    role:    m.role as 'user' | 'assistant',
    content: m.content,
  }))
  history.push({ role: 'user', content: body.message })

  // Streaming
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        const response = await client.messages.create({
          model:      'claude-sonnet-5-20251001',
          max_tokens: 2048,
          system:     systemPrompt,
          messages:   history,
          stream:     true,
        })
        for await (const chunk of response) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`\n\nError: ${err instanceof Error ? err.message : 'Error desconocido'}`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
```

- [ ] **Step 2: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/api/notebooks/"
git commit -m "feat: add notebook chat streaming route"
```

---

## Task 5: API routes `/synthesize` y `/suggest-title`

**Files:**
- Create: `apps/web/src/app/api/notebooks/[notebookId]/synthesize/route.ts`
- Create: `apps/web/src/app/api/notebooks/[notebookId]/suggest-title/route.ts`

- [ ] **Step 1: Crear `/synthesize`**

```typescript
// apps/web/src/app/api/notebooks/[notebookId]/synthesize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'
import { saveSynthesis } from '@/app/actions/notebooks'

export const runtime     = 'nodejs'
export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ notebookId: string }> },
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { notebookId } = await params
  const notebook = await db.notebook.findUnique({
    where:   { id: notebookId },
    include: { sources: { orderBy: { createdAt: 'asc' } } },
  })
  if (!notebook) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (notebook.sources.length === 0) {
    return NextResponse.json({ error: 'No sources' }, { status: 400 })
  }

  const sourcesContext = notebook.sources
    .map((s) => `--- ${s.title.toUpperCase()} ---\n${s.content}`)
    .join('\n\n')

  const prompt = `Analiza los siguientes documentos y devuelve un JSON con esta estructura exacta (sin markdown, solo JSON puro):
{
  "summary": "resumen global de 3-5 párrafos en español",
  "keyPoints": ["punto 1", "punto 2", "punto 3", "punto 4", "punto 5"],
  "suggestedQuestions": ["pregunta 1", "pregunta 2", "pregunta 3"]
}

Las preguntas sugeridas deben ser preguntas concretas y útiles que alguien podría hacerse sobre este contenido.

DOCUMENTOS:
${sourcesContext}`

  const response = await client.messages.create({
    model:      'claude-sonnet-5-20251001',
    max_tokens: 2048,
    messages:   [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  let parsed: { summary: string; keyPoints: string[]; suggestedQuestions: string[] }
  try {
    parsed = JSON.parse(raw.trim())
  } catch {
    // Intenta extraer JSON si hay texto extra
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ error: 'Parse error' }, { status: 500 })
    parsed = JSON.parse(match[0])
  }

  await saveSynthesis(notebookId, JSON.stringify(parsed))

  return NextResponse.json(parsed)
}
```

- [ ] **Step 2: Crear `/suggest-title`**

```typescript
// apps/web/src/app/api/notebooks/[notebookId]/suggest-title/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'
import { updateNotebookTitle } from '@/app/actions/notebooks'

export const runtime     = 'nodejs'
export const maxDuration = 30

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ notebookId: string }> },
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { notebookId } = await params
  const notebook = await db.notebook.findUnique({
    where:   { id: notebookId },
    include: { sources: { orderBy: { createdAt: 'asc' }, take: 1 } },
  })
  if (!notebook || notebook.sources.length === 0) {
    return NextResponse.json({ error: 'No sources' }, { status: 400 })
  }

  const firstSource = notebook.sources[0]
  const preview = firstSource.content.slice(0, 2000)

  const response = await client.messages.create({
    model:      'claude-sonnet-5-20251001',
    max_tokens: 60,
    messages:   [{
      role:    'user',
      content: `Basándote en el siguiente texto, genera un título corto y descriptivo (máximo 60 caracteres, en español, sin comillas). Solo devuelve el título, nada más.\n\n${preview}`,
    }],
  })

  const title = response.content[0].type === 'text'
    ? response.content[0].text.trim().slice(0, 60)
    : 'Nuevo notebook'

  await updateNotebookTitle(notebookId, title)

  return NextResponse.json({ title })
}
```

- [ ] **Step 3: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/api/notebooks/"
git commit -m "feat: add notebook synthesize and suggest-title routes"
```

---

## Task 6: Página listado `/notebooks` + NotebookCard + NotebookList

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/page.tsx`
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/_components/NotebookCard.tsx`
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/_components/NotebookList.tsx`

- [ ] **Step 1: Crear NotebookCard.tsx**

```typescript
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/_components/NotebookCard.tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteNotebook } from '@/app/actions/notebooks'
import type { NotebookData } from '@/app/actions/notebooks'

interface Props {
  notebook:    NotebookData
  workspaceId: string
}

export function NotebookCard({ notebook, workspaceId }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    if (!confirm('¿Eliminar este notebook?')) return
    setDeleting(true)
    await deleteNotebook(notebook.id, workspaceId)
    router.refresh()
  }

  return (
    <Link
      href={`/workspace/${workspaceId}/notebooks/${notebook.id}`}
      className="group relative flex flex-col gap-2 rounded-lg border p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors"
    >
      <p className="font-medium text-sm truncate pr-6">{notebook.title}</p>
      <p className="text-xs text-muted-foreground">
        {notebook.sourceCount} {notebook.sourceCount === 1 ? 'fuente' : 'fuentes'} ·{' '}
        {new Date(notebook.createdAt).toLocaleDateString('es-ES')}
      </p>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="absolute right-3 top-3 hidden group-hover:flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:text-destructive text-sm"
      >
        ×
      </button>
    </Link>
  )
}
```

- [ ] **Step 2: Crear NotebookList.tsx**

```typescript
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/_components/NotebookList.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createNotebook } from '@/app/actions/notebooks'
import { NotebookCard } from './NotebookCard'
import type { NotebookData } from '@/app/actions/notebooks'

interface Props {
  workspaceId: string
  initial:     NotebookData[]
}

export function NotebookList({ workspaceId, initial }: Props) {
  const notebooks = initial
  const router    = useRouter()
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    setCreating(true)
    const { id } = await createNotebook(workspaceId)
    router.push(`/workspace/${workspaceId}/notebooks/${id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Notebooks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {notebooks.length} {notebooks.length === 1 ? 'notebook' : 'notebooks'}
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {creating ? 'Creando...' : '+ Nuevo notebook'}
        </button>
      </div>

      {notebooks.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          <p>Aún no hay notebooks.</p>
          <button onClick={handleCreate} className="mt-3 text-primary hover:underline">
            Crea tu primer notebook
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notebooks.map((n) => (
            <NotebookCard key={n.id} notebook={n} workspaceId={workspaceId} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Crear page.tsx del listado**

```typescript
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/page.tsx
import { requireUser } from '@/lib/auth'
import { getNotebooks } from '@/app/actions/notebooks'
import { NotebookList } from './_components/NotebookList'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function NotebooksPage({ params }: Props) {
  const [{ workspaceId }] = await Promise.all([params, requireUser()])
  const notebooks = await getNotebooks(workspaceId)

  return (
    <div className="p-6">
      <NotebookList workspaceId={workspaceId} initial={notebooks} />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/"
git commit -m "feat: add notebooks list page, NotebookCard and NotebookList"
```

---

## Task 7: ChatMessage + ChatPanel

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/[notebookId]/_components/ChatMessage.tsx`
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/[notebookId]/_components/ChatPanel.tsx`

- [ ] **Step 1: Crear ChatMessage.tsx**

```typescript
// .../_components/ChatMessage.tsx
interface Props {
  role:    'user' | 'assistant'
  content: string
}

export function ChatMessage({ role, content }: Props) {
  const isUser = role === 'user'
  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs shrink-0 mt-0.5">
          ✦
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        }`}
      >
        {content}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Crear ChatPanel.tsx**

```typescript
// .../_components/ChatPanel.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { saveMessage } from '@/app/actions/notebooks'
import { ChatMessage } from './ChatMessage'
import type { NotebookMessageData, NotebookSourceData } from '@/app/actions/notebooks'

interface Props {
  notebookId:       string
  initialMessages:  NotebookMessageData[]
  sources:          NotebookSourceData[]
  suggestedQuestion?: string
  onSuggestedQuestionUsed?: () => void
}

export function ChatPanel({
  notebookId,
  initialMessages,
  sources,
  suggestedQuestion,
  onSuggestedQuestionUsed,
}: Props) {
  const [messages,   setMessages]   = useState<NotebookMessageData[]>(initialMessages)
  const [input,      setInput]      = useState('')
  const [streaming,  setStreaming]  = useState(false)
  const [streamText, setStreamText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamText])

  // Rellenar input con pregunta sugerida al recibirla
  useEffect(() => {
    if (suggestedQuestion) {
      setInput(suggestedQuestion)
      onSuggestedQuestionUsed?.()
    }
  }, [suggestedQuestion, onSuggestedQuestionUsed])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || streaming) return
    setInput('')

    const userMsg: NotebookMessageData = {
      id:        crypto.randomUUID(),
      role:      'user',
      content:   text,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    await saveMessage(notebookId, 'user', text, sources.map((s) => s.id))

    setStreaming(true)
    setStreamText('')

    try {
      const res = await fetch(`/api/notebooks/${notebookId}/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text }),
      })
      if (!res.body) throw new Error('No stream body')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        full += chunk
        setStreamText(full)
      }
      const assistantMsg: NotebookMessageData = {
        id:        crypto.randomUUID(),
        role:      'assistant',
        content:   full,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
      await saveMessage(notebookId, 'assistant', full, sources.map((s) => s.id))
    } finally {
      setStreaming(false)
      setStreamText('')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !streaming && (
          <p className="text-center text-xs text-muted-foreground py-8">
            Haz una pregunta sobre las fuentes del notebook.
          </p>
        )}
        {messages.map((m) => (
          <ChatMessage key={m.id} role={m.role as 'user' | 'assistant'} content={m.content} />
        ))}
        {streaming && streamText && (
          <ChatMessage role="assistant" content={streamText} />
        )}
        {streaming && !streamText && (
          <div className="flex gap-1 justify-start">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs shrink-0">✦</div>
            <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">Pensando...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSubmit(e as unknown as React.FormEvent) }
          }}
          placeholder="Escribe tu pregunta... (Enter para enviar)"
          rows={2}
          disabled={streaming || sources.length === 0}
          className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim() || sources.length === 0}
          className="self-end rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {streaming ? '...' : 'Enviar'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/[notebookId]/_components/ChatMessage.tsx"
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/[notebookId]/_components/ChatPanel.tsx"
git commit -m "feat: add ChatMessage and ChatPanel with streaming"
```

---

## Task 8: SynthesisPanel

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/[notebookId]/_components/SynthesisPanel.tsx`

- [ ] **Step 1: Crear SynthesisPanel.tsx**

```typescript
// .../_components/SynthesisPanel.tsx
'use client'

import { useState } from 'react'
import type { SynthesisCache } from '@/app/actions/notebooks'

interface Props {
  notebookId:       string
  initialSynthesis: SynthesisCache | null
  isDirty:          boolean
  hasNoSources:     boolean
  onQuestionClick:  (q: string) => void
  onSynthesisReady: (s: SynthesisCache) => void
}

export function SynthesisPanel({
  notebookId,
  initialSynthesis,
  isDirty,
  hasNoSources,
  onQuestionClick,
  onSynthesisReady,
}: Props) {
  const [synthesis,   setSynthesis]   = useState<SynthesisCache | null>(initialSynthesis)
  const [loading,     setLoading]     = useState(isDirty && !hasNoSources)
  const [collapsed,   setCollapsed]   = useState(false)

  // Auto-generar si está sucia
  useState(() => {
    if (isDirty && !hasNoSources) void generateSynthesis()
  })

  async function generateSynthesis() {
    setLoading(true)
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/synthesize`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json() as SynthesisCache
        setSynthesis(data)
        onSynthesisReady(data)
      }
    } finally {
      setLoading(false)
    }
  }

  if (hasNoSources) return null

  return (
    <div className="border-b">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30"
      >
        <span>✦ Síntesis automática</span>
        <span className="text-muted-foreground">{collapsed ? '▼' : '▲'}</span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          {loading && (
            <div className="text-xs text-muted-foreground animate-pulse">Analizando fuentes...</div>
          )}

          {!loading && synthesis && (
            <>
              <p className="text-sm leading-relaxed text-foreground/90">{synthesis.summary}</p>

              {synthesis.keyPoints.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Puntos clave</p>
                  <ul className="space-y-1">
                    {synthesis.keyPoints.map((kp, i) => (
                      <li key={i} className="text-xs flex gap-1.5">
                        <span className="text-primary">•</span>
                        <span>{kp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {synthesis.suggestedQuestions.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Preguntas sugeridas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {synthesis.suggestedQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => onQuestionClick(q)}
                        className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs text-primary hover:bg-primary/10 transition-colors text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={generateSynthesis}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Regenerar síntesis
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/[notebookId]/_components/SynthesisPanel.tsx"
git commit -m "feat: add SynthesisPanel with auto-generate and suggested questions"
```

---

## Task 9: AddSourceModal + SourcePanel

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/[notebookId]/_components/AddSourceModal.tsx`
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/[notebookId]/_components/SourcePanel.tsx`

- [ ] **Step 1: Crear AddSourceModal.tsx**

```typescript
// .../_components/AddSourceModal.tsx
'use client'

import { useState } from 'react'
import { addSource } from '@/app/actions/notebooks'
import type { NotebookSourceData } from '@/app/actions/notebooks'

type Tab = 'doc' | 'pdf' | 'text' | 'url'

interface Props {
  notebookId:  string
  workspaceDocs: { id: string; title: string }[]
  workspacePdfs: { id: string; title: string }[]
  onClose:     () => void
  onAdded:     (source: NotebookSourceData) => void
}

export function AddSourceModal({ notebookId, workspaceDocs, workspacePdfs, onClose, onAdded }: Props) {
  const [tab,     setTab]     = useState<Tab>('doc')
  const [docId,   setDocId]   = useState('')
  const [pdfId,   setPdfId]   = useState('')
  const [text,    setText]    = useState('')
  const [textTitle, setTextTitle] = useState('')
  const [url,     setUrl]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleAdd() {
    setLoading(true)
    setError('')
    try {
      let input: Parameters<typeof addSource>[1]
      if (tab === 'doc')  input = { type: 'doc', docId }
      else if (tab === 'pdf') input = { type: 'pdf', pdfId }
      else if (tab === 'text') input = { type: 'text', text, title: textTitle }
      else input = { type: 'url', url }

      const source = await addSource(notebookId, input)
      onAdded(source)
      onClose()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido'
      if (msg.startsWith('LIMIT_EXCEEDED')) {
        setError('Has alcanzado el límite de contexto. Elimina alguna fuente para añadir una nueva.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const canAdd =
    (tab === 'doc' && !!docId) ||
    (tab === 'pdf' && !!pdfId) ||
    (tab === 'text' && !!text.trim()) ||
    (tab === 'url' && !!url.trim())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg border shadow-lg w-full max-w-lg mx-4 p-6">
        <h2 className="text-base font-semibold mb-4">Añadir fuente</h2>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b">
          {(['doc', 'pdf', 'text', 'url'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
                tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'doc' ? '📄 Documento' : t === 'pdf' ? '📑 PDF' : t === 'text' ? '📝 Texto' : '🔗 URL'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="space-y-3 min-h-[120px]">
          {tab === 'doc' && (
            <select
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecciona un documento...</option>
              {workspaceDocs.map((d) => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
          )}

          {tab === 'pdf' && (
            <select
              value={pdfId}
              onChange={(e) => setPdfId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecciona un PDF...</option>
              {workspacePdfs.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          )}

          {tab === 'text' && (
            <>
              <input
                type="text"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                placeholder="Título (opcional)"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Pega el texto aquí..."
                rows={6}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </>
          )}

          {tab === 'url' && (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          )}
        </div>

        {error && <p className="text-xs text-destructive mt-2">{error}</p>}

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-md border border-input px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            disabled={loading || !canAdd}
            className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Añadiendo...' : 'Añadir fuente'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Crear SourcePanel.tsx**

```typescript
// .../_components/SourcePanel.tsx
'use client'

import { useState } from 'react'
import { deleteSource } from '@/app/actions/notebooks'
import { AddSourceModal } from './AddSourceModal'
import type { NotebookSourceData } from '@/app/actions/notebooks'

const TYPE_EMOJI: Record<string, string> = {
  doc:  '📄',
  pdf:  '📑',
  text: '📝',
  url:  '🔗',
}

const CHAR_LIMIT = 400_000

interface Props {
  notebookId:    string
  initialSources: NotebookSourceData[]
  workspaceDocs:  { id: string; title: string }[]
  workspacePdfs:  { id: string; title: string }[]
  onSourcesChange: (sources: NotebookSourceData[]) => void
}

export function SourcePanel({
  notebookId,
  initialSources,
  workspaceDocs,
  workspacePdfs,
  onSourcesChange,
}: Props) {
  const [sources,    setSources]    = useState<NotebookSourceData[]>(initialSources)
  const [showModal,  setShowModal]  = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const totalChars = sources.reduce((acc, s) => acc + s.charCount, 0)

  async function handleDelete(sourceId: string) {
    setDeletingId(sourceId)
    await deleteSource(sourceId, notebookId)
    const next = sources.filter((s) => s.id !== sourceId)
    setSources(next)
    onSourcesChange(next)
    setDeletingId(null)
  }

  function handleAdded(source: NotebookSourceData) {
    const next = [...sources, source]
    setSources(next)
    onSourcesChange(next)
  }

  const pct = Math.round((totalChars / CHAR_LIMIT) * 100)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {sources.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Añade fuentes para empezar.
          </p>
        )}
        {sources.map((s) => (
          <div key={s.id} className="group flex items-center gap-2 rounded-md p-2 hover:bg-muted/50">
            <span className="text-base shrink-0">{TYPE_EMOJI[s.type] ?? '📎'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{s.title}</p>
              <p className="text-xs text-muted-foreground">{(s.charCount / 1000).toFixed(1)}k chars</p>
            </div>
            <button
              onClick={() => handleDelete(s.id)}
              disabled={deletingId === s.id}
              className="hidden group-hover:flex items-center justify-center w-4 h-4 rounded text-muted-foreground hover:text-destructive text-xs shrink-0"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="border-t p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Contexto</span>
          <span className={pct > 90 ? 'text-destructive font-medium' : ''}>{pct}%</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct > 90 ? 'bg-destructive' : 'bg-primary'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={pct >= 100}
          className="w-full rounded-md border border-dashed border-border py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Añadir fuente
        </button>
      </div>

      {showModal && (
        <AddSourceModal
          notebookId={notebookId}
          workspaceDocs={workspaceDocs}
          workspacePdfs={workspacePdfs}
          onClose={() => setShowModal(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/[notebookId]/_components/AddSourceModal.tsx"
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/[notebookId]/_components/SourcePanel.tsx"
git commit -m "feat: add AddSourceModal and SourcePanel"
```

---

## Task 10: NotebookClient + página editor

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/[notebookId]/_components/NotebookClient.tsx`
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/[notebookId]/page.tsx`

- [ ] **Step 1: Crear NotebookClient.tsx**

```typescript
// .../_components/NotebookClient.tsx
'use client'

import { useState, useCallback } from 'react'
import { updateNotebook } from '@/app/actions/notebooks'
import { SourcePanel }    from './SourcePanel'
import { SynthesisPanel } from './SynthesisPanel'
import { ChatPanel }      from './ChatPanel'
import type { NotebookDetail, NotebookSourceData, SynthesisCache } from '@/app/actions/notebooks'

interface Props {
  notebook:     NotebookDetail
  workspaceId:  string
  workspaceDocs: { id: string; title: string }[]
  workspacePdfs: { id: string; title: string }[]
}

export function NotebookClient({ notebook, workspaceId, workspaceDocs, workspacePdfs }: Props) {
  const [title,             setTitle]             = useState(notebook.title)
  const [sources,           setSources]           = useState(notebook.sources)
  const [synthesis,         setSynthesis]         = useState(notebook.synthesisCache)
  const [isDirty,           setIsDirty]           = useState(notebook.synthesisDirty)
  const [suggestedQuestion, setSuggestedQuestion] = useState<string>('')

  async function handleTitleBlur() {
    if (title !== notebook.title) await updateNotebook(notebook.id, title)
  }

  const handleSourcesChange = useCallback((next: NotebookSourceData[]) => {
    setSources(next)
    setIsDirty(true)

    // Auto-sugerir título si es el primer source y el título es el default
    if (next.length === 1 && (notebook.title === 'Nuevo notebook' || !notebook.title)) {
      void fetch(`/api/notebooks/${notebook.id}/suggest-title`, { method: 'POST' })
        .then((r) => r.json())
        .then((data: { title?: string }) => { if (data.title) setTitle(data.title) })
        .catch(() => null)
    }
  }, [notebook.id, notebook.title])

  const handleSynthesisReady = useCallback((s: SynthesisCache) => {
    setSynthesis(s)
    setIsDirty(false)
  }, [])

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Panel izquierdo: fuentes */}
      <div className="w-64 border-r flex flex-col shrink-0">
        <div className="p-3 border-b">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="w-full bg-transparent text-sm font-medium focus:outline-none placeholder:text-muted-foreground truncate"
            placeholder="Nombre del notebook"
          />
        </div>
        <SourcePanel
          notebookId={notebook.id}
          initialSources={sources}
          workspaceDocs={workspaceDocs}
          workspacePdfs={workspacePdfs}
          onSourcesChange={handleSourcesChange}
        />
      </div>

      {/* Panel derecho: síntesis + chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <SynthesisPanel
          notebookId={notebook.id}
          initialSynthesis={synthesis}
          isDirty={isDirty}
          hasNoSources={sources.length === 0}
          onQuestionClick={(q) => setSuggestedQuestion(q)}
          onSynthesisReady={handleSynthesisReady}
        />
        <div className="flex-1 overflow-hidden">
          <ChatPanel
            notebookId={notebook.id}
            initialMessages={notebook.messages}
            sources={sources}
            suggestedQuestion={suggestedQuestion}
            onSuggestedQuestionUsed={() => setSuggestedQuestion('')}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Crear página del notebook**

```typescript
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/[notebookId]/page.tsx
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { getNotebook, getWorkspaceDocs, getWorkspacePdfs } from '@/app/actions/notebooks'
import { NotebookClient } from './_components/NotebookClient'

interface Props {
  params: Promise<{ workspaceId: string; notebookId: string }>
}

export default async function NotebookPage({ params }: Props) {
  const [{ workspaceId, notebookId }] = await Promise.all([params, requireUser()])

  const [notebook, docs, pdfs] = await Promise.all([
    getNotebook(workspaceId, notebookId).catch(() => null),
    getWorkspaceDocs(workspaceId),
    getWorkspacePdfs(workspaceId),
  ])

  if (!notebook) notFound()

  return (
    <NotebookClient
      notebook={notebook}
      workspaceId={workspaceId}
      workspaceDocs={docs}
      workspacePdfs={pdfs}
    />
  )
}
```

- [ ] **Step 3: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/notebooks/[notebookId]/"
git commit -m "feat: add NotebookClient and notebook editor page"
```

---

## Task 11: Integración Mi Office + breadcrumb

**Files:**
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceTopbar.tsx`

- [ ] **Step 1: Añadir card Notebooks en office/page.tsx**

Leer el archivo primero para ver la estructura actual y añadir la nueva entrada en el array `TOOLS` justo después de `Presentaciones`:

```typescript
{
  href:     (base: string) => `${base}/notebooks`,
  emoji:    '🧠',
  title:    'Notebooks',
  subtitle: 'Sintetiza y consulta documentos con IA',
},
```

- [ ] **Step 2: Añadir entrada en SECTION_LABELS de WorkspaceTopbar.tsx**

Leer el archivo para ver dónde está la entrada de `/presentations` y añadir inmediatamente después:

```typescript
{ segment: '/notebooks', label: 'Notebooks' },
```

- [ ] **Step 3: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/page.tsx"
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceTopbar.tsx"
git commit -m "feat: add Notebooks to Mi Office hub and topbar breadcrumb"
```

---

## Task 12: TypeScript check + build + deploy

**Files:** ninguno nuevo

- [ ] **Step 1: TypeScript check**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit
```

Esperado: sin errores (solo warnings son aceptables).

- [ ] **Step 2: Build local**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx next build
```

Esperado: build exitoso con rutas `/workspace/[workspaceId]/notebooks` y `/workspace/[workspaceId]/notebooks/[notebookId]` en la tabla de rutas.

- [ ] **Step 3: Deploy a producción**

```powershell
cd C:\Users\priet\protools-hub
npx vercel deploy --prod --scope mitikus
```

Esperado: `▲ Aliased https://www.mitikus.com`

- [ ] **Step 4: Commit final si hay fixes de build**

```powershell
cd C:\Users\priet\protools-hub
git add -A
git commit -m "fix: resolve build issues for notebooks module"
```
