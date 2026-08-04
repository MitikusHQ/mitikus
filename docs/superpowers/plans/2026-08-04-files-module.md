# Files Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir un módulo de gestión de archivos con carpetas anidadas en Mi Office de MITIKUS, accesible desde `/workspace/[workspaceId]/office/files`.

**Architecture:** Dos nuevos modelos Prisma (`Folder` auto-referenciado + `WorkspaceFile`). API routes para CRUD de carpetas y archivos. UI de dos columnas: árbol de carpetas izquierda, contenido de la carpeta activa derecha. Subida a Vercel Blob, descarga directa por URL.

**Tech Stack:** Next.js 15 App Router, Prisma 6, PostgreSQL, Vercel Blob (@vercel/blob), TypeScript, Tailwind CSS

---

## File Structure

### Nuevos archivos
- `apps/web/prisma/schema.prisma` — añadir modelos Folder, WorkspaceFile, enum FileType
- `apps/web/src/app/actions/files.ts` — server actions CRUD carpetas y archivos
- `apps/web/src/app/api/workspace/[workspaceId]/files/upload/route.ts` — upload a Vercel Blob
- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/files/page.tsx` — página principal
- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/files/_components/FolderTree.tsx` — árbol lateral
- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/files/_components/FilePanel.tsx` — panel derecho con archivos
- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/files/_components/FilesClient.tsx` — wrapper 'use client' con estado
- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/files/_components/UploadZone.tsx` — drag & drop upload
- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/files/_components/NewFolderModal.tsx` — modal crear carpeta
- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/files/_components/MoveFileModal.tsx` — modal mover archivo

### Archivos modificados
- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/page.tsx` — añadir card "Archivos"
- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx` — añadir icono files

---

## Task 1: Prisma schema — modelos Folder y WorkspaceFile

**Files:**
- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: Añadir enum FileType y modelos al schema**

Añadir al final de `apps/web/prisma/schema.prisma`, antes de cualquier comentario de cierre:

```prisma
enum FileType {
  DOC
  SHEET
  PDF
  IMAGE
}

model Folder {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  parentId    String?

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  parent    Folder?   @relation("FolderTree", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  children  Folder[]  @relation("FolderTree")
  files     WorkspaceFile[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([workspaceId])
  @@index([parentId])
  @@map("folders")
}

model WorkspaceFile {
  id          String   @id @default(cuid())
  workspaceId String
  folderId    String?
  name        String
  type        FileType
  url         String
  size        Int
  mimeType    String

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  folder    Folder?   @relation(fields: [folderId], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([workspaceId])
  @@index([folderId])
  @@map("workspace_files")
}
```

También añadir las relaciones inversas en el modelo `Workspace` existente:
```prisma
  folders        Folder[]
  workspaceFiles WorkspaceFile[]
```

- [ ] **Step 2: Añadir relaciones en el modelo Workspace**

Buscar el modelo `Workspace` en `schema.prisma` y añadir al final de sus relaciones:
```
  folders        Folder[]
  workspaceFiles WorkspaceFile[]
```

- [ ] **Step 3: Ejecutar migración**

```bash
cd apps/web
npx prisma migrate dev --name add-folders-and-files
```

Expected: `✓ Generated Prisma Client`

- [ ] **Step 4: Verificar que el cliente genera correctamente**

```bash
npx prisma generate
```

Expected: `✓ Generated Prisma Client`

- [ ] **Step 5: Commit**

```bash
git add apps/web/prisma/schema.prisma apps/web/prisma/migrations/
git commit -m "feat: add Folder and WorkspaceFile models to Prisma schema"
```

---

## Task 2: Server actions — CRUD carpetas y archivos

**Files:**
- Create: `apps/web/src/app/actions/files.ts`

- [ ] **Step 1: Crear el fichero de server actions**

```typescript
'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { del } from '@vercel/blob'

async function getAuthUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('User not found')
  return user
}

async function assertWorkspace(workspaceId: string, orgId: string) {
  const ws = await db.workspace.findFirst({ where: { id: workspaceId, orgId } })
  if (!ws) throw new Error('Workspace not found')
  return ws
}

// ── CARPETAS ──────────────────────────────────────────────

export interface FolderData {
  id: string
  name: string
  parentId: string | null
  children: FolderData[]
}

export async function getFolderTree(workspaceId: string): Promise<FolderData[]> {
  await getAuthUser()
  const folders = await db.folder.findMany({
    where: { workspaceId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, parentId: true },
  })
  return buildTree(folders, null)
}

function buildTree(
  folders: { id: string; name: string; parentId: string | null }[],
  parentId: string | null,
): FolderData[] {
  return folders
    .filter((f) => f.parentId === parentId)
    .map((f) => ({ ...f, children: buildTree(folders, f.id) }))
}

export async function createFolder(workspaceId: string, name: string, parentId: string | null) {
  const user = await getAuthUser()
  await assertWorkspace(workspaceId, user.orgId)
  const folder = await db.folder.create({
    data: { workspaceId, name: name.trim(), parentId },
  })
  revalidatePath(`/workspace/${workspaceId}/office/files`)
  return folder
}

export async function renameFolder(workspaceId: string, folderId: string, name: string) {
  const user = await getAuthUser()
  await assertWorkspace(workspaceId, user.orgId)
  await db.folder.update({ where: { id: folderId }, data: { name: name.trim() } })
  revalidatePath(`/workspace/${workspaceId}/office/files`)
}

export async function deleteFolder(workspaceId: string, folderId: string) {
  const user = await getAuthUser()
  await assertWorkspace(workspaceId, user.orgId)
  // Borrar archivos del blob antes de eliminar
  const files = await db.workspaceFile.findMany({ where: { folderId } })
  await Promise.all(files.map((f) => del(f.url).catch(() => {})))
  await db.folder.delete({ where: { id: folderId } })
  revalidatePath(`/workspace/${workspaceId}/office/files`)
}

// ── ARCHIVOS ──────────────────────────────────────────────

export interface FileData {
  id: string
  name: string
  type: 'DOC' | 'SHEET' | 'PDF' | 'IMAGE'
  url: string
  size: number
  mimeType: string
  folderId: string | null
  createdAt: string
}

export async function getFiles(workspaceId: string, folderId: string | null): Promise<FileData[]> {
  await getAuthUser()
  const files = await db.workspaceFile.findMany({
    where: { workspaceId, folderId: folderId ?? null },
    orderBy: { createdAt: 'desc' },
  })
  return files.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() }))
}

export async function moveFile(workspaceId: string, fileId: string, targetFolderId: string | null) {
  const user = await getAuthUser()
  await assertWorkspace(workspaceId, user.orgId)
  await db.workspaceFile.update({
    where: { id: fileId },
    data: { folderId: targetFolderId },
  })
  revalidatePath(`/workspace/${workspaceId}/office/files`)
}

export async function deleteFile(workspaceId: string, fileId: string) {
  const user = await getAuthUser()
  await assertWorkspace(workspaceId, user.orgId)
  const file = await db.workspaceFile.findFirst({ where: { id: fileId, workspaceId } })
  if (!file) throw new Error('File not found')
  await del(file.url).catch(() => {})
  await db.workspaceFile.delete({ where: { id: fileId } })
  revalidatePath(`/workspace/${workspaceId}/office/files`)
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/actions/files.ts
git commit -m "feat: add server actions for folders and files CRUD"
```

---

## Task 3: API route — upload a Vercel Blob

**Files:**
- Create: `apps/web/src/app/api/workspace/[workspaceId]/files/upload/route.ts`

- [ ] **Step 1: Crear la route de upload**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { FileType } from '@prisma/client'

const MIME_TO_TYPE: Record<string, FileType> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOC',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'SHEET',
  'image/jpeg': 'IMAGE',
  'image/png': 'IMAGE',
  'image/webp': 'IMAGE',
}

const MAX_SIZE = 50 * 1024 * 1024 // 50 MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!workspace) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const folderId = formData.get('folderId') as string | null

  if (!file) return NextResponse.json({ error: 'Fichero requerido' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Máximo 50 MB' }, { status: 400 })

  const fileType = MIME_TO_TYPE[file.type]
  if (!fileType) return NextResponse.json({ error: 'Tipo de archivo no soportado' }, { status: 400 })

  const blob = await put(`files/${workspaceId}/${Date.now()}-${file.name}`, file, {
    access: 'public',
  })

  const saved = await db.workspaceFile.create({
    data: {
      workspaceId,
      folderId: folderId || null,
      name: file.name,
      type: fileType,
      url: blob.url,
      size: file.size,
      mimeType: file.type,
    },
  })

  return NextResponse.json(saved)
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/api/workspace/\[workspaceId\]/files/
git commit -m "feat: add file upload API route to Vercel Blob"
```

---

## Task 4: Componente FolderTree

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/files/_components/FolderTree.tsx`

- [ ] **Step 1: Crear FolderTree**

```typescript
'use client'

import { cn } from '@/lib/utils'
import type { FolderData } from '@/app/actions/files'
import { useState } from 'react'

interface Props {
  folders: FolderData[]
  activeFolderId: string | null
  onSelect: (folderId: string | null) => void
  onNewFolder: (parentId: string | null) => void
}

function FolderNode({
  folder,
  depth,
  activeFolderId,
  onSelect,
  onNewFolder,
}: {
  folder: FolderData
  depth: number
  activeFolderId: string | null
  onSelect: (id: string | null) => void
  onNewFolder: (parentId: string | null) => void
}) {
  const [open, setOpen] = useState(true)
  const hasChildren = folder.children.length > 0

  return (
    <li>
      <div
        className={cn(
          'flex items-center gap-1 rounded-md px-2 py-1 text-sm cursor-pointer hover:bg-muted transition-colors',
          activeFolderId === folder.id && 'bg-muted font-medium',
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {open ? <path d="M6 9l6 6 6-6"/> : <path d="M9 6l6 6-6 6"/>}
            </svg>
          </button>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span onClick={() => onSelect(folder.id)} className="flex-1 truncate flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="shrink-0 text-muted-foreground">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          {folder.name}
        </span>
        <button
          type="button"
          title="Nueva subcarpeta"
          onClick={(e) => { e.stopPropagation(); onNewFolder(folder.id) }}
          className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      </div>
      {open && hasChildren && (
        <ul>
          {folder.children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              activeFolderId={activeFolderId}
              onSelect={onSelect}
              onNewFolder={onNewFolder}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function FolderTree({ folders, activeFolderId, onSelect, onNewFolder }: Props) {
  return (
    <nav className="w-56 shrink-0 border-r border-border overflow-y-auto py-2">
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 text-sm rounded-md cursor-pointer hover:bg-muted transition-colors mb-1',
          activeFolderId === null && 'bg-muted font-medium',
        )}
        onClick={() => onSelect(null)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="text-muted-foreground">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        </svg>
        Raíz
      </div>
      <ul>
        {folders.map((f) => (
          <FolderNode
            key={f.id}
            folder={f}
            depth={0}
            activeFolderId={activeFolderId}
            onSelect={onSelect}
            onNewFolder={onNewFolder}
          />
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onNewFolder(null)}
        className="mt-2 mx-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md hover:bg-muted transition-colors w-[calc(100%-16px)]"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Nueva carpeta
      </button>
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/files/"
git commit -m "feat: add FolderTree component"
```

---

## Task 5: Componente UploadZone

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/files/_components/UploadZone.tsx`

- [ ] **Step 1: Crear UploadZone**

```typescript
'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  workspaceId: string
  folderId: string | null
  onUploaded: () => void
}

const ACCEPTED = '.pdf,.docx,.xlsx,.jpg,.jpeg,.png,.webp'

export function UploadZone({ workspaceId, folderId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function uploadFiles(files: FileList) {
    setUploading(true)
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      if (folderId) fd.append('folderId', folderId)
      await fetch(`/api/workspace/${workspaceId}/files/upload`, { method: 'POST', body: fd })
    }
    setUploading(false)
    onUploaded()
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files) }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
        dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30',
        uploading && 'opacity-60 pointer-events-none',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => { if (e.target.files) uploadFiles(e.target.files) }}
      />
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 text-muted-foreground" aria-hidden>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      <p className="text-sm text-muted-foreground">
        {uploading ? 'Subiendo...' : 'Arrastra archivos aquí o haz clic para seleccionar'}
      </p>
      <p className="text-xs text-muted-foreground/60 mt-1">PDF, DOCX, XLSX, JPG, PNG, WEBP — máx. 50 MB</p>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/files/_components/UploadZone.tsx"
git commit -m "feat: add UploadZone component with drag and drop"
```

---

## Task 6: Componentes NewFolderModal y MoveFileModal

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/files/_components/NewFolderModal.tsx`
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/files/_components/MoveFileModal.tsx`

- [ ] **Step 1: Crear NewFolderModal**

```typescript
'use client'

import { useState } from 'react'
import { createFolder } from '@/app/actions/files'

interface Props {
  workspaceId: string
  parentId: string | null
  onCreated: () => void
  onClose: () => void
}

export function NewFolderModal({ workspaceId, parentId, onCreated, onClose }: Props) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await createFolder(workspaceId, name.trim(), parentId)
    setLoading(false)
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-card rounded-xl border shadow-lg p-6 w-80" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-semibold text-sm mb-4">Nueva carpeta</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            autoFocus
            type="text"
            placeholder="Nombre de la carpeta"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="text-sm px-3 py-1.5 rounded-md hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Crear MoveFileModal**

```typescript
'use client'

import { useState } from 'react'
import { moveFile, type FolderData } from '@/app/actions/files'

interface Props {
  workspaceId: string
  fileId: string
  folders: FolderData[]
  onMoved: () => void
  onClose: () => void
}

function flattenFolders(folders: FolderData[], depth = 0): { id: string; name: string; depth: number }[] {
  return folders.flatMap((f) => [{ id: f.id, name: f.name, depth }, ...flattenFolders(f.children, depth + 1)])
}

export function MoveFileModal({ workspaceId, fileId, folders, onMoved, onClose }: Props) {
  const [targetId, setTargetId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const flat = flattenFolders(folders)

  async function handleMove() {
    setLoading(true)
    await moveFile(workspaceId, fileId, targetId)
    setLoading(false)
    onMoved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-card rounded-xl border shadow-lg p-6 w-80" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-semibold text-sm mb-4">Mover archivo a...</h2>
        <div className="space-y-1 max-h-60 overflow-y-auto mb-4">
          <button
            type="button"
            onClick={() => setTargetId(null)}
            className={`w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${targetId === null ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
          >
            📁 Raíz
          </button>
          {flat.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTargetId(f.id)}
              style={{ paddingLeft: `${12 + f.depth * 16}px` }}
              className={`w-full text-left text-sm py-1.5 rounded-md transition-colors ${targetId === f.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
            >
              📁 {f.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="text-sm px-3 py-1.5 rounded-md hover:bg-muted transition-colors">
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleMove}
            className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Moviendo...' : 'Mover aquí'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/files/_components/"
git commit -m "feat: add NewFolderModal and MoveFileModal components"
```

---

## Task 7: Componente FilePanel

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/files/_components/FilePanel.tsx`

- [ ] **Step 1: Crear FilePanel**

```typescript
'use client'

import { type FileData } from '@/app/actions/files'
import { deleteFile } from '@/app/actions/files'
import { useState } from 'react'

const TYPE_ICON: Record<string, string> = {
  PDF: '📑',
  DOC: '📄',
  SHEET: '📊',
  IMAGE: '🖼',
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  workspaceId: string
  files: FileData[]
  folders: import('@/app/actions/files').FolderData[]
  onRequestMove: (fileId: string) => void
  onRefresh: () => void
}

export function FilePanel({ workspaceId, files, onRequestMove, onRefresh }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(fileId: string) {
    if (!confirm('¿Eliminar este archivo?')) return
    setDeleting(fileId)
    await deleteFile(workspaceId, fileId)
    setDeleting(null)
    onRefresh()
  }

  if (files.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 py-16">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
          <polyline points="13 2 13 9 20 9"/>
        </svg>
        <p className="text-sm">Sin archivos en esta carpeta</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <ul className="space-y-1">
        {files.map((file) => (
          <li
            key={file.id}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors group"
          >
            <span className="text-xl shrink-0">{TYPE_ICON[file.type] ?? '📁'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <a
                href={file.url}
                download={file.name}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Descargar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </a>
              <button
                type="button"
                onClick={() => onRequestMove(file.id)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Mover"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <polyline points="5 9 2 12 5 15"/>
                  <polyline points="9 5 12 2 15 5"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <line x1="12" y1="2" x2="12" y2="22"/>
                </svg>
              </button>
              <button
                type="button"
                disabled={deleting === file.id}
                onClick={() => handleDelete(file.id)}
                className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                title="Eliminar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/files/_components/FilePanel.tsx"
git commit -m "feat: add FilePanel component with download, move and delete"
```

---

## Task 8: FilesClient — wrapper con estado

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/files/_components/FilesClient.tsx`

- [ ] **Step 1: Crear FilesClient**

```typescript
'use client'

import { useState, useCallback, useTransition } from 'react'
import { FolderTree } from './FolderTree'
import { FilePanel } from './FilePanel'
import { UploadZone } from './UploadZone'
import { NewFolderModal } from './NewFolderModal'
import { MoveFileModal } from './MoveFileModal'
import { getFiles, type FolderData, type FileData } from '@/app/actions/files'

interface Props {
  workspaceId: string
  initialFolders: FolderData[]
  initialFiles: FileData[]
}

export function FilesClient({ workspaceId, initialFolders, initialFiles }: Props) {
  const [folders, setFolders] = useState<FolderData[]>(initialFolders)
  const [files, setFiles] = useState<FileData[]>(initialFiles)
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [newFolderParentId, setNewFolderParentId] = useState<string | null | undefined>(undefined)
  const [moveFileId, setMoveFileId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const refresh = useCallback(async () => {
    startTransition(async () => {
      const fresh = await getFiles(workspaceId, activeFolderId)
      setFiles(fresh)
    })
  }, [workspaceId, activeFolderId])

  const handleSelectFolder = useCallback(async (folderId: string | null) => {
    setActiveFolderId(folderId)
    const fresh = await getFiles(workspaceId, folderId)
    setFiles(fresh)
  }, [workspaceId])

  // Breadcrumb simple
  function getBreadcrumb(): string {
    if (activeFolderId === null) return 'Raíz'
    function find(folders: FolderData[], id: string): string | null {
      for (const f of folders) {
        if (f.id === id) return f.name
        const child = find(f.children, id)
        if (child) return child
      }
      return null
    }
    return find(folders, activeFolderId) ?? 'Raíz'
  }

  return (
    <div className="flex h-full">
      <FolderTree
        folders={folders}
        activeFolderId={activeFolderId}
        onSelect={handleSelectFolder}
        onNewFolder={(parentId) => setNewFolderParentId(parentId)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <p className="text-sm font-medium text-muted-foreground">{getBreadcrumb()}</p>
          <button
            type="button"
            onClick={() => setNewFolderParentId(activeFolderId)}
            className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              <line x1="12" y1="11" x2="12" y2="17"/>
              <line x1="9" y1="14" x2="15" y2="14"/>
            </svg>
            Nueva carpeta
          </button>
        </div>

        {/* Upload */}
        <div className="px-4 pt-4 shrink-0">
          <UploadZone workspaceId={workspaceId} folderId={activeFolderId} onUploaded={refresh} />
        </div>

        {/* Files */}
        <FilePanel
          workspaceId={workspaceId}
          files={files}
          folders={folders}
          onRequestMove={(fileId) => setMoveFileId(fileId)}
          onRefresh={refresh}
        />
      </div>

      {/* Modals */}
      {newFolderParentId !== undefined && (
        <NewFolderModal
          workspaceId={workspaceId}
          parentId={newFolderParentId}
          onCreated={() => window.location.reload()}
          onClose={() => setNewFolderParentId(undefined)}
        />
      )}
      {moveFileId && (
        <MoveFileModal
          workspaceId={workspaceId}
          fileId={moveFileId}
          folders={folders}
          onMoved={refresh}
          onClose={() => setMoveFileId(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/files/_components/FilesClient.tsx"
git commit -m "feat: add FilesClient stateful wrapper component"
```

---

## Task 9: Página principal del módulo

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/files/page.tsx`

- [ ] **Step 1: Crear la página**

```typescript
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { getFolderTree, getFiles } from '@/app/actions/files'
import { FilesClient } from './_components/FilesClient'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function FilesPage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) notFound()

  const [folders, files] = await Promise.all([
    getFolderTree(workspaceId),
    getFiles(workspaceId, null),
  ])

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="px-6 py-4 border-b border-border shrink-0">
        <h1 className="text-xl font-semibold">Archivos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Organiza tus archivos en carpetas
        </p>
      </div>
      <FilesClient
        workspaceId={workspaceId}
        initialFolders={folders}
        initialFiles={files}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/files/page.tsx"
git commit -m "feat: add files module page"
```

---

## Task 10: Integración en Mi Office + icono sidebar + deploy

**Files:**
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx`
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx`

- [ ] **Step 1: Añadir card "Archivos" en Mi Office hub**

En `apps/web/src/app/(dashboard)/workspace/[workspaceId]/office/page.tsx`, añadir en el array de tools:
```typescript
{ href: `${base}/office/files`, emoji: '🗂️', title: 'Archivos', subtitle: 'Carpetas y ficheros' },
```

- [ ] **Step 2: Añadir icono en WorkspaceIcons**

En `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx`, añadir en el objeto de iconos:
```typescript
files: (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
),
```

- [ ] **Step 3: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: Sin errores

- [ ] **Step 4: Build local**

```bash
npm run build
```

Expected: `✓ Compiled successfully`

- [ ] **Step 5: Commit y deploy**

```bash
git add -A
git commit -m "feat: integrate files module in Mi Office hub and sidebar"
git push origin main && git push personal main
```

Expected: Vercel lanza build y despliega en ~3 minutos
