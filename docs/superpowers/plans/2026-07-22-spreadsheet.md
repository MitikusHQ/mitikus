# Spreadsheet (Hojas de cálculo) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir hojas de cálculo a MITIKUS — subir .xlsx, crear desde cero, editar con FortuneSheet (fórmulas, gráficos, múltiples pestañas), autoguardado debounced, y acceso desde Arkos como contexto.

**Architecture:** Server Components que cargan datos de Prisma → Client Components para el editor FortuneSheet (dynamic import SSR-off). Autosave con debounce 2s. API route para convertir .xlsx a formato FortuneSheet JSON usando SheetJS. Integración en sidebar + /tools + Arkos.

**Tech Stack:** FortuneSheet (`@fortune-sheet/react`), SheetJS (`xlsx` — ya instalado), Next.js 15 App Router, Prisma + PostgreSQL, Clerk v6, TypeScript.

---

## File Map

| Acción | Archivo |
|--------|---------|
| Modify | `apps/web/prisma/schema.prisma` — modelo `Spreadsheet` |
| Create | `apps/web/src/app/actions/spreadsheets.ts` — todas las server actions |
| Create | `apps/web/src/app/api/sheets/upload/route.ts` — POST .xlsx → JSON |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/page.tsx` — listado |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/_components/SheetList.tsx` |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/_components/SheetUploadZone.tsx` |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/new/page.tsx` — crear hoja |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/page.tsx` — editor |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/_components/SheetEditorClient.tsx` |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/_components/SheetHeader.tsx` |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/_components/DeleteSheetButton.tsx` |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/_components/FortuneSheetEditor.tsx` |
| Modify | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx` — icono `sheets` |
| Modify | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx` — ítem sidebar |
| Modify | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/tools/page.tsx` — bloque Office |
| Modify | `apps/web/src/lib/business-memory/business-context.ts` — hojas en Arkos |

---

### Task 1: Instalar FortuneSheet + Prisma schema + db push

**Files:**
- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: Instalar paquetes FortuneSheet**

Ejecutar en `apps/web/`:
```bash
cd apps/web
npm install @fortune-sheet/react @fortune-sheet/core
```
Salida esperada: `added N packages` sin errores.

- [ ] **Step 2: Añadir modelo Spreadsheet al schema**

En `apps/web/prisma/schema.prisma`, buscar el bloque del modelo `Document` y añadir después:

```prisma
model Spreadsheet {
  id          String    @id @default(cuid())
  workspaceId String
  title       String
  category    String?
  data        Json
  rawText     String    @default("")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  uploadedBy  String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  uploader    User      @relation(fields: [uploadedBy], references: [id])
}
```

También hay que añadir la relación inversa en `Workspace` y `User`. Busca en el schema el modelo `Workspace` y añade dentro de sus campos:
```prisma
  spreadsheets Spreadsheet[]
```
Y en el modelo `User`:
```prisma
  spreadsheets Spreadsheet[]
```

- [ ] **Step 3: Aplicar cambios a la DB**

```bash
cd apps/web
npx prisma db push
```
Salida esperada: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 4: Verificar que Prisma Client se ha regenerado**

```bash
cd apps/web
npx prisma generate
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/prisma/schema.prisma
git commit -m "feat: add Spreadsheet model to Prisma schema"
```

---

### Task 2: Server actions para hojas de cálculo

**Files:**
- Create: `apps/web/src/app/actions/spreadsheets.ts`

- [ ] **Step 1: Crear el archivo de server actions**

```typescript
// apps/web/src/app/actions/spreadsheets.ts
'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export interface SpreadsheetData {
  id:           string
  title:        string
  category:     string | null
  sheetCount:   number
  createdAt:    string
  uploaderName: string | null
}

export interface SpreadsheetDetail extends SpreadsheetData {
  data: object[]
}

async function getAuthUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('User not found')
  return user
}

export async function getSpreadsheets(workspaceId: string): Promise<SpreadsheetData[]> {
  const sheets = await db.spreadsheet.findMany({
    where:   { workspaceId },
    orderBy: { createdAt: 'desc' },
    select: {
      id:        true,
      title:     true,
      category:  true,
      data:      true,
      createdAt: true,
      uploader:  { select: { name: true } },
    },
  })

  return sheets.map((s) => ({
    id:           s.id,
    title:        s.title,
    category:     s.category,
    sheetCount:   Array.isArray(s.data) ? (s.data as object[]).length : 1,
    createdAt:    s.createdAt.toISOString(),
    uploaderName: s.uploader.name,
  }))
}

export async function getSpreadsheet(
  sheetId: string,
  workspaceId: string,
): Promise<SpreadsheetDetail | null> {
  const sheet = await db.spreadsheet.findFirst({
    where:  { id: sheetId, workspaceId },
    select: {
      id:        true,
      title:     true,
      category:  true,
      data:      true,
      createdAt: true,
      uploader:  { select: { name: true } },
    },
  })

  if (!sheet) return null

  const data = Array.isArray(sheet.data) ? (sheet.data as object[]) : []

  return {
    id:           sheet.id,
    title:        sheet.title,
    category:     sheet.category,
    sheetCount:   data.length,
    data,
    createdAt:    sheet.createdAt.toISOString(),
    uploaderName: sheet.uploader.name,
  }
}

export async function createSpreadsheet(
  workspaceId: string,
  input: { title: string; data: object[]; rawText: string },
): Promise<string> {
  const user = await getAuthUser()
  const sheet = await db.spreadsheet.create({
    data: {
      workspaceId,
      title:      input.title.trim() || 'Sin título',
      data:       input.data,
      rawText:    input.rawText,
      uploadedBy: user.id,
    },
  })
  revalidatePath(`/workspace/${workspaceId}/sheets`)
  return sheet.id
}

export async function updateSpreadsheetContent(
  sheetId: string,
  workspaceId: string,
  input: { data: object[]; rawText: string },
): Promise<void> {
  await getAuthUser()
  await db.spreadsheet.updateMany({
    where: { id: sheetId, workspaceId },
    data:  { data: input.data, rawText: input.rawText },
  })
  revalidatePath(`/workspace/${workspaceId}/sheets`)
  revalidatePath(`/workspace/${workspaceId}/sheets/${sheetId}`)
}

export async function updateSpreadsheetMeta(
  sheetId: string,
  workspaceId: string,
  input: { title: string; category: string | null },
): Promise<void> {
  await getAuthUser()
  await db.spreadsheet.updateMany({
    where: { id: sheetId, workspaceId },
    data:  { title: input.title.trim() || 'Sin título', category: input.category || null },
  })
  revalidatePath(`/workspace/${workspaceId}/sheets`)
  revalidatePath(`/workspace/${workspaceId}/sheets/${sheetId}`)
}

export async function deleteSpreadsheet(
  sheetId: string,
  workspaceId: string,
): Promise<void> {
  await getAuthUser()
  await db.spreadsheet.deleteMany({ where: { id: sheetId, workspaceId } })
  revalidatePath(`/workspace/${workspaceId}/sheets`)
}
```

- [ ] **Step 2: Verificar compilación TypeScript**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | head -30
```
Salida esperada: sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/actions/spreadsheets.ts
git commit -m "feat: add spreadsheet server actions"
```

---

### Task 3: API route para importar .xlsx

**Files:**
- Create: `apps/web/src/app/api/sheets/upload/route.ts`

- [ ] **Step 1: Crear la ruta de upload**

```typescript
// apps/web/src/app/api/sheets/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'

function parseAddr(addr: string): { r: number; c: number } {
  const col = addr.replace(/\d/g, '')
  const row = parseInt(addr.replace(/\D/g, ''), 10) - 1
  const c = col.split('').reduce((acc, ch) => acc * 26 + ch.charCodeAt(0) - 64, 0) - 1
  return { r: row, c }
}

function xlsxToFortuneSheet(buffer: ArrayBuffer): { data: object[]; rawText: string } {
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheets = wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name]
    const celldata: object[] = []
    Object.entries(ws).forEach(([addr, cell]) => {
      if (addr.startsWith('!')) return
      const c = cell as XLSX.CellObject
      const { r, c: col } = parseAddr(addr)
      celldata.push({
        r,
        c: col,
        v: { v: c.v, m: String(c.v ?? ''), ct: { fa: 'General' } },
      })
    })
    return { name, celldata, config: {} }
  })
  const rawText = wb.SheetNames
    .map((name) => XLSX.utils.sheet_to_csv(wb.Sheets[name]))
    .join('\n\n')
  return { data: sheets, rawText }
}

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

  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    return NextResponse.json({ error: 'Only .xlsx files are supported' }, { status: 400 })
  }

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const buffer = await file.arrayBuffer()

  let data: object[], rawText: string
  try {
    ;({ data, rawText } = xlsxToFortuneSheet(buffer))
  } catch {
    return NextResponse.json({ error: 'Failed to convert spreadsheet' }, { status: 422 })
  }

  const title = file.name
    .replace(/\.xlsx$/i, '')
    .replace(/[-_]/g, ' ')
    .trim()

  const sheet = await db.spreadsheet.create({
    data: { workspaceId, title, data, rawText, uploadedBy: user.id },
  })

  return NextResponse.json({ id: sheet.id, title: sheet.title })
}
```

- [ ] **Step 2: Verificar compilación**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | head -30
```
Sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/sheets/upload/route.ts
git commit -m "feat: add /api/sheets/upload route for .xlsx import"
```

---

### Task 4: Icono sheets en WorkspaceIcons

**Files:**
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx`

- [ ] **Step 1: Añadir icono `sheets` al objeto Icons**

Al final del objeto `Icons`, antes del cierre `}`, añadir:

```tsx
  sheets: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="3" y1="15" x2="21" y2="15"/>
      <line x1="9" y1="3" x2="9" y2="21"/>
      <line x1="15" y1="3" x2="15" y2="21"/>
    </svg>
  ),
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx
git commit -m "feat: add sheets icon to WorkspaceIcons"
```

---

### Task 5: Ítem "Hojas de cálculo" en el sidebar

**Files:**
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx`

- [ ] **Step 1: Añadir ítem tras el ítem "Docs" en mainItems**

Localizar el bloque del ítem `Docs` en `mainItems`:

```typescript
    {
      label: 'Docs',
      href: `${base}/docs`,
      icon: Icons.docs,
      description: 'Base de conocimiento del workspace',
    },
```

Añadir inmediatamente después:

```typescript
    {
      label: 'Hojas de cálculo',
      href: `${base}/sheets`,
      icon: Icons.sheets,
      description: 'Hojas de cálculo con fórmulas y datos',
    },
```

- [ ] **Step 2: Verificar compilación**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx
git commit -m "feat: add Hojas de cálculo to workspace sidebar"
```

---

### Task 6: Página listado /sheets

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/page.tsx`
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/_components/SheetList.tsx`
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/_components/SheetUploadZone.tsx`

- [ ] **Step 1: Crear SheetUploadZone.tsx**

```tsx
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/_components/SheetUploadZone.tsx
'use client'

import { useRef, useState } from 'react'
import type { SpreadsheetData } from '@/app/actions/spreadsheets'

interface Props {
  workspaceId: string
  onUploaded:  (sheet: SpreadsheetData) => void
}

export function SheetUploadZone({ workspaceId, onUploaded }: Props) {
  const [isDragging, setIsDragging]   = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError('Solo se admiten archivos .xlsx')
      return
    }
    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('workspaceId', workspaceId)

    try {
      const res  = await fetch('/api/sheets/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al subir la hoja')
        return
      }
      onUploaded({
        id:           data.id,
        title:        data.title,
        category:     null,
        sheetCount:   1,
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
          accept=".xlsx"
          onChange={handleChange}
          className="hidden"
        />
        {isUploading ? (
          <p className="text-sm text-muted-foreground">Procesando...</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Arrastra un <span className="font-medium">.xlsx</span> aquí o{' '}
            <span className="text-primary hover:underline">elige archivo</span>
          </p>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Crear SheetList.tsx**

```tsx
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/_components/SheetList.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { SpreadsheetData } from '@/app/actions/spreadsheets'
import { SheetUploadZone } from './SheetUploadZone'

const CATEGORIES = ['Finanzas', 'Operaciones', 'RRHH', 'Ventas', 'Otro']

interface Props {
  workspaceId: string
  initial:     SpreadsheetData[]
}

export function SheetList({ workspaceId, initial }: Props) {
  const [sheets, setSheets]         = useState(initial)
  const [activeCategory, setActive] = useState<string | null>(null)

  const visible = activeCategory
    ? sheets.filter((s) => s.category === activeCategory)
    : sheets

  function handleUploaded(sheet: SpreadsheetData) {
    setSheets((prev) => [sheet, ...prev])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActive(null)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              activeCategory === null
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            Todas
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat === activeCategory ? null : cat)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <Link
          href={`/workspace/${workspaceId}/sheets/new`}
          className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          + Nueva hoja
        </Link>
      </div>

      <SheetUploadZone workspaceId={workspaceId} onUploaded={handleUploaded} />

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {activeCategory ? `No hay hojas en "${activeCategory}"` : 'Aún no hay hojas de cálculo'}
        </p>
      ) : (
        <div className="divide-y divide-border rounded-lg border">
          {visible.map((sheet) => (
            <Link
              key={sheet.id}
              href={`/workspace/${workspaceId}/sheets/${sheet.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {sheet.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {sheet.sheetCount} {sheet.sheetCount === 1 ? 'pestaña' : 'pestañas'} ·{' '}
                  {new Date(sheet.createdAt).toLocaleDateString('es-ES')}
                  {sheet.uploaderName ? ` · ${sheet.uploaderName}` : ''}
                </p>
              </div>
              {sheet.category && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground ml-3 shrink-0">
                  {sheet.category}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Crear page.tsx del listado**

```tsx
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/page.tsx
import { getSpreadsheets } from '@/app/actions/spreadsheets'
import { requireUser } from '@/lib/auth'
import { SheetList } from './_components/SheetList'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function SheetsPage({ params }: Props) {
  const [{ workspaceId }] = await Promise.all([params, requireUser()])
  const sheets = await getSpreadsheets(workspaceId)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Hojas de cálculo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sube .xlsx existentes o crea hojas desde cero
        </p>
      </div>
      <SheetList workspaceId={workspaceId} initial={sheets} />
    </div>
  )
}
```

- [ ] **Step 4: Verificar compilación**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/
git commit -m "feat: add /sheets listing page with upload zone"
```

---

### Task 7: FortuneSheetEditor con dynamic import

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/_components/FortuneSheetEditor.tsx`

- [ ] **Step 1: Crear FortuneSheetEditor.tsx**

```tsx
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/_components/FortuneSheetEditor.tsx
'use client'

import dynamic from 'next/dynamic'
import type { WorkbookInstance } from '@fortune-sheet/react'

const Workbook = dynamic(
  () => import('@fortune-sheet/react').then((m) => m.Workbook),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Cargando editor…
      </div>
    ),
  }
)

interface Props {
  data:     object[]
  onChange: (data: object[]) => void
}

export function FortuneSheetEditor({ data, onChange }: Props) {
  return (
    <div className="h-full w-full">
      <Workbook
        data={data as Parameters<typeof Workbook>[0]['data']}
        onChange={(updatedData) => onChange(updatedData as object[])}
        options={{ showToolbar: true, showFormulaBar: true }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verificar que el import no falla**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/_components/FortuneSheetEditor.tsx"
git commit -m "feat: add FortuneSheetEditor with dynamic SSR-off import"
```

---

### Task 8: SheetHeader, DeleteSheetButton y SheetEditorClient

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/_components/SheetHeader.tsx`
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/_components/DeleteSheetButton.tsx`
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/_components/SheetEditorClient.tsx`

- [ ] **Step 1: Crear SheetHeader.tsx**

```tsx
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/_components/SheetHeader.tsx
'use client'

import { useState, useTransition } from 'react'
import { updateSpreadsheetMeta } from '@/app/actions/spreadsheets'

const CATEGORIES = ['Finanzas', 'Operaciones', 'RRHH', 'Ventas', 'Otro']

interface Props {
  sheetId:     string
  workspaceId: string
  title:       string
  category:    string | null
  saveStatus:  'idle' | 'saving' | 'saved' | 'error'
  onExport:    () => void
}

export function SheetHeader({ sheetId, workspaceId, title: initialTitle, category: initialCategory, saveStatus, onExport }: Props) {
  const [title, setTitle]       = useState(initialTitle)
  const [category, setCategory] = useState(initialCategory ?? '')
  const [isDirty, setIsDirty]   = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value)
    setIsDirty(true)
  }

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setCategory(e.target.value)
    setIsDirty(true)
  }

  function handleSave() {
    startTransition(async () => {
      await updateSpreadsheetMeta(sheetId, workspaceId, {
        title,
        category: category || null,
      })
      setIsDirty(false)
    })
  }

  const statusText = {
    idle:   '',
    saving: 'Guardando…',
    saved:  'Guardado ✓',
    error:  'Error al guardar',
  }[saveStatus]

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b bg-background">
      <input
        value={title}
        onChange={handleTitleChange}
        className="text-base font-semibold bg-transparent border-none outline-none flex-1 min-w-0"
        placeholder="Sin título"
      />
      <select
        value={category}
        onChange={handleCategoryChange}
        className="text-xs border rounded px-2 py-1 bg-background"
      >
        <option value="">Sin categoría</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      {isDirty && (
        <button
          onClick={handleSave}
          disabled={isPending}
          className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Guardar
        </button>
      )}
      <span className={`text-xs ${saveStatus === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
        {statusText}
      </span>
      <button
        onClick={onExport}
        className="text-xs px-2 py-1 rounded border hover:bg-muted transition-colors"
      >
        ↓ .xlsx
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Crear DeleteSheetButton.tsx**

```tsx
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/_components/DeleteSheetButton.tsx
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteSpreadsheet } from '@/app/actions/spreadsheets'

interface Props {
  sheetId:     string
  workspaceId: string
}

export function DeleteSheetButton({ sheetId, workspaceId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!window.confirm('¿Eliminar esta hoja de cálculo? Esta acción no se puede deshacer.')) return
    startTransition(async () => {
      await deleteSpreadsheet(sheetId, workspaceId)
      router.push(`/workspace/${workspaceId}/sheets`)
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs px-2 py-1 rounded border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
    >
      {isPending ? 'Eliminando…' : 'Eliminar hoja'}
    </button>
  )
}
```

- [ ] **Step 3: Crear SheetEditorClient.tsx**

```tsx
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/_components/SheetEditorClient.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import type { SpreadsheetDetail } from '@/app/actions/spreadsheets'
import { updateSpreadsheetContent } from '@/app/actions/spreadsheets'
import { FortuneSheetEditor } from './FortuneSheetEditor'
import { SheetHeader } from './SheetHeader'
import { DeleteSheetButton } from './DeleteSheetButton'

interface Props {
  sheet:       SpreadsheetDetail
  workspaceId: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function SheetEditorClient({ sheet, workspaceId }: Props) {
  const [data, setData]             = useState<object[]>(sheet.data)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (saveStatus === 'saving') {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveStatus])

  const scheduleSave = useCallback((newData: object[]) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      const rawText = newData
        .map((s: any) => {
          if (!Array.isArray(s.celldata)) return ''
          const maxR = Math.max(0, ...s.celldata.map((c: any) => c.r))
          const maxC = Math.max(0, ...s.celldata.map((c: any) => c.c))
          const grid: string[][] = Array.from({ length: maxR + 1 }, () =>
            Array.from({ length: maxC + 1 }, () => '')
          )
          s.celldata.forEach((c: any) => {
            grid[c.r][c.c] = String(c.v?.m ?? c.v?.v ?? '')
          })
          return grid.map((row) => row.join(',')).join('\n')
        })
        .join('\n\n')

      try {
        await updateSpreadsheetContent(sheet.id, workspaceId, { data: newData, rawText })
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('error')
      }
    }, 2000)
  }, [sheet.id, workspaceId])

  function handleChange(newData: object[]) {
    setData(newData)
    scheduleSave(newData)
  }

  function handleExport() {
    const wb = XLSX.utils.book_new()
    data.forEach((s: any) => {
      if (!Array.isArray(s.celldata)) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[]]), s.name ?? 'Hoja1')
        return
      }
      const maxR = Math.max(0, ...s.celldata.map((c: any) => c.r))
      const maxC = Math.max(0, ...s.celldata.map((c: any) => c.c))
      const aoa: string[][] = Array.from({ length: maxR + 1 }, () =>
        Array.from({ length: maxC + 1 }, () => '')
      )
      s.celldata.forEach((c: any) => {
        aoa[c.r][c.c] = String(c.v?.m ?? c.v?.v ?? '')
      })
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), s.name ?? 'Hoja1')
    })
    XLSX.writeFile(wb, `${sheet.title}.xlsx`)
  }

  return (
    <div className="flex flex-col h-full">
      <SheetHeader
        sheetId={sheet.id}
        workspaceId={workspaceId}
        title={sheet.title}
        category={sheet.category}
        saveStatus={saveStatus}
        onExport={handleExport}
      />
      <div className="flex-1 min-h-0">
        <FortuneSheetEditor data={data} onChange={handleChange} />
      </div>
      <div className="flex justify-end px-4 py-2 border-t bg-background">
        <DeleteSheetButton sheetId={sheet.id} workspaceId={workspaceId} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verificar compilación**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/_components/"
git commit -m "feat: add SheetHeader, DeleteSheetButton, SheetEditorClient"
```

---

### Task 9: Páginas /sheets/[sheetId] y /sheets/new

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/page.tsx`
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/new/page.tsx`

- [ ] **Step 1: Crear page.tsx del editor**

```tsx
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/page.tsx
import { notFound } from 'next/navigation'
import { getSpreadsheet } from '@/app/actions/spreadsheets'
import { requireUser } from '@/lib/auth'
import { SheetEditorClient } from './_components/SheetEditorClient'

interface Props {
  params: Promise<{ workspaceId: string; sheetId: string }>
}

export default async function SheetEditorPage({ params }: Props) {
  const [{ workspaceId, sheetId }] = await Promise.all([params, requireUser()])
  const sheet = await getSpreadsheet(sheetId, workspaceId)
  if (!sheet) notFound()

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      <SheetEditorClient sheet={sheet} workspaceId={workspaceId} />
    </div>
  )
}
```

- [ ] **Step 2: Crear page.tsx para nueva hoja**

```tsx
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/new/page.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createSpreadsheet } from '@/app/actions/spreadsheets'
import { FortuneSheetEditor } from '../[sheetId]/_components/FortuneSheetEditor'

const EMPTY_SHEET = [{ name: 'Hoja1', celldata: [], config: {} }]

export default function NewSheetPage() {
  const params = useParams<{ workspaceId: string }>()
  const workspaceId = params.workspaceId
  const router = useRouter()

  const [title, setTitle]           = useState('')
  const [data, setData]             = useState<object[]>(EMPTY_SHEET)
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    startTransition(async () => {
      const id = await createSpreadsheet(workspaceId, {
        title: title || 'Sin título',
        data,
        rawText: '',
      })
      router.push(`/workspace/${workspaceId}/sheets/${id}`)
    })
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-background">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nombre de la hoja"
          className="text-base font-semibold bg-transparent border-none outline-none flex-1"
          autoFocus
        />
        <button
          onClick={handleCreate}
          disabled={isPending}
          className="text-sm px-4 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? 'Creando…' : 'Crear hoja'}
        </button>
        <button
          onClick={() => router.push(`/workspace/${workspaceId}/sheets`)}
          className="text-sm px-3 py-1.5 rounded border hover:bg-muted transition-colors"
        >
          Cancelar
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <FortuneSheetEditor data={data} onChange={setData} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verificar compilación**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/[sheetId]/page.tsx"
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/sheets/new/page.tsx"
git commit -m "feat: add sheet editor page and new sheet page"
```

---

### Task 10: Bloque "Herramientas de Office" en /tools

**Files:**
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/tools/page.tsx`

- [ ] **Step 1: Leer el archivo tools/page.tsx actual**

Leer `apps/web/src/app/(dashboard)/workspace/[workspaceId]/tools/page.tsx` completo para entender la estructura.

- [ ] **Step 2: Añadir bloque Office antes del contenido existente**

Localizar el `return (` en la función `ToolsPage`. Dentro del JSX principal, añadir el bloque de Herramientas de Office ANTES del bloque existente de herramientas instaladas:

```tsx
import Link from 'next/link'

{/* Herramientas de Office — añadir antes del contenido existente */}
<div className="space-y-3">
  <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
    Herramientas de Office
  </h2>
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
    <Link
      href={`/workspace/${params.workspaceId}/docs`}
      className="flex flex-col gap-2 rounded-lg border p-4 hover:border-primary/50 hover:bg-muted/50 transition-colors"
    >
      <span className="text-2xl">📄</span>
      <p className="text-sm font-medium">Documentos</p>
      <p className="text-xs text-muted-foreground">Base de conocimiento</p>
      <span className="text-xs text-primary font-medium">BUILT-IN</span>
    </Link>
    <Link
      href={`/workspace/${params.workspaceId}/sheets`}
      className="flex flex-col gap-2 rounded-lg border p-4 hover:border-primary/50 hover:bg-muted/50 transition-colors"
    >
      <span className="text-2xl">📊</span>
      <p className="text-sm font-medium">Hojas de cálculo</p>
      <p className="text-xs text-muted-foreground">Datos y presupuestos</p>
      <span className="text-xs text-primary font-medium">BUILT-IN</span>
    </Link>
  </div>
</div>
```

- [ ] **Step 3: Verificar compilación**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/tools/page.tsx"
git commit -m "feat: add Office tools block to /tools page"
```

---

### Task 11: Arkos — hojas en business-context

**Files:**
- Modify: `apps/web/src/lib/business-memory/business-context.ts`

- [ ] **Step 1: Añadir query de hojas a la Promise.all**

Localizar la llamada `const [profile, objectives, risks, processes, assets, docs] = await Promise.all([`.

Cambiar a:
```typescript
const [profile, objectives, risks, processes, assets, docs, sheets] = await Promise.all([
```

Y añadir al final del array, tras la query de `docs`:
```typescript
    db.spreadsheet.findMany({
      where:   { workspaceId },
      orderBy: { updatedAt: 'desc' },
      take:    3,
      select:  { title: true, rawText: true },
    }),
```

- [ ] **Step 2: Construir sheetsSnippet y extender docsContext**

Localizar la línea:
```typescript
  const docsContext = docs.length === 0 ? null : docs
```

Reemplazar con:
```typescript
  const sheetsSnippet = sheets.length === 0 ? '' :
    '\n\n=== HOJAS DE CÁLCULO ===\n' +
    sheets
      .map((s) => `--- ${s.title} ---\n${s.rawText.split('\n').slice(0, 100).join('\n')}`)
      .join('\n\n')

  const docsContext = (docs.length === 0 && sheets.length === 0) ? null :
    (docs.length === 0 ? '' : docs
      .map((d) => {
        const words = d.rawText.split(/\s+/).slice(0, 2000).join(' ')
        return `--- ${d.title} ---\n${words}`
      })
      .join('\n\n')) + sheetsSnippet
```

- [ ] **Step 3: Verificar compilación**

```bash
cd apps/web
npx tsc --noEmit 2>&1 | head -30
```
Sin errores.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/business-memory/business-context.ts
git commit -m "feat: include spreadsheet rawText in Arkos docsContext"
```

---

### Task 12: Build final + deploy

- [ ] **Step 1: Build completo**

```bash
cd apps/web
npm run build 2>&1 | tail -30
```
Salida esperada: `✓ Compiled successfully` sin errores de tipo.

- [ ] **Step 2: Deploy a producción**

```bash
npx vercel --prod --scope mitikus
```
Esperar URL de producción.

- [ ] **Step 3: Verificar en producción**

Abrir `www.mitikus.com` en el navegador:
1. Navegar a cualquier workspace → comprobar que "Hojas de cálculo" aparece en el sidebar.
2. Ir a `/sheets` → debe mostrar la lista vacía + zona de upload.
3. Ir a `/sheets/new` → debe mostrarse el editor FortuneSheet vacío.
4. Ir a `/tools` → debe aparecer el bloque "Herramientas de Office" con Documentos y Hojas.

- [ ] **Step 4: Commit final si hay ajustes de build**

```bash
git add -p
git commit -m "fix: build adjustments for spreadsheet feature"
```

---

## Self-Review

### Spec coverage check

| Requisito del spec | Task que lo implementa |
|--------------------|------------------------|
| Modelo Prisma `Spreadsheet` | Task 1 |
| Import .xlsx → FortuneSheet JSON | Task 3 |
| Editor FortuneSheet con dynamic import | Task 7 |
| Autoguardado debounced 2s | Task 8 (SheetEditorClient) |
| Metadatos editables (título + categoría) | Task 8 (SheetHeader) |
| Eliminar hoja | Task 8 (DeleteSheetButton) |
| Crear desde cero `/sheets/new` | Task 9 |
| Export .xlsx | Task 8 (SheetEditorClient.handleExport) |
| Sidebar ítem "Hojas de cálculo" | Task 5 |
| `/tools` bloque "Herramientas de Office" | Task 10 |
| Arkos rawText de hojas en docsContext | Task 11 |
| `beforeunload` solo cuando `saving` | Task 8 (SheetEditorClient) |

Sin gaps detectados.

### Placeholder scan

Ningún "TBD", "TODO" ni sección incompleta. Todo el código está completo.

### Type consistency

- `SpreadsheetData` y `SpreadsheetDetail` definidos en Task 2, usados en Tasks 6, 8, 9.
- `getSpreadsheets` devuelve `SpreadsheetData[]`, `getSpreadsheet` devuelve `SpreadsheetDetail | null`.
- `updateSpreadsheetContent(sheetId, workspaceId, { data, rawText })` — firma consistente en Task 2 y Task 8.
- `FortuneSheetEditor` recibe `data: object[]` y `onChange: (data: object[]) => void` — consistente en Tasks 7, 8, 9.
