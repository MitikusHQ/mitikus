# Document Metadata Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir editar el título y la categoría de un documento directamente desde el visor, sin recargar la página.

**Architecture:** Se añade `updateDocument` a las server actions existentes. El header estático del visor se extrae a `EditableDocHeader`, un Client Component que gestiona estado local (`isDirty`) y llama a la action al guardar. El visor Server Component pasa los datos iniciales como props.

**Tech Stack:** Next.js 15 App Router, Server Actions (`'use server'`), Clerk v6 (`auth()`), Prisma, `useRouter` + `router.refresh()`, Tailwind CSS.

---

## File Structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `apps/web/src/app/actions/documents.ts` | Modificar | Añadir `updateDocument` action |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/EditableDocHeader.tsx` | Crear | Client Component: inputs de título y categoría, estado `isDirty`, llama a `updateDocument` |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/page.tsx` | Modificar | Reemplazar header estático por `<EditableDocHeader>` |

---

### Task 1: Server action updateDocument

**Files:**
- Modify: `apps/web/src/app/actions/documents.ts`

- [ ] **Step 1: Añadir la action `updateDocument`**

Abre `apps/web/src/app/actions/documents.ts`. Al final del archivo, antes del cierre, añade:

```typescript
export async function updateDocument(
  docId: string,
  workspaceId: string,
  data: { title: string; category: string | null },
): Promise<void> {
  await getAuthUser()
  await db.document.updateMany({
    where: { id: docId, workspaceId },
    data:  { title: data.title.trim(), category: data.category || null },
  })
  revalidatePath(`/workspace/${workspaceId}/docs`)
  revalidatePath(`/workspace/${workspaceId}/docs/${docId}`)
}
```

El helper `getAuthUser()` ya existe en el archivo (línea 20). `revalidatePath` ya está importado (línea 5). No necesitas añadir ningún import adicional.

- [ ] **Step 2: Verificar TypeScript**

```powershell
cd C:\Users\priet\protools-hub; npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | Select-String "actions/documents"
```

Salida esperada: sin errores.

- [ ] **Step 3: Commit**

```powershell
git add "apps/web/src/app/actions/documents.ts"
git commit -m "feat(docs): add updateDocument server action"
```

---

### Task 2: Componente EditableDocHeader

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/EditableDocHeader.tsx`

- [ ] **Step 1: Crear el componente**

Crea `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/EditableDocHeader.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { DocumentDetail } from '@/app/actions/documents'
import { updateDocument } from '@/app/actions/documents'

const CATEGORIES = ['DNA', 'Producto', 'Arquitectura', 'Operaciones'] as const

interface Props {
  doc:         DocumentDetail
  workspaceId: string
}

export function EditableDocHeader({ doc, workspaceId }: Props) {
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

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs border border-primary/30 text-primary px-2.5 py-1 rounded-full">
          Arkos usa este doc ✓
        </span>
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

- [ ] **Step 2: Verificar TypeScript**

```powershell
cd C:\Users\priet\protools-hub; npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | Select-String "EditableDocHeader"
```

Salida esperada: sin errores.

- [ ] **Step 3: Commit**

```powershell
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/EditableDocHeader.tsx"
git commit -m "feat(docs): add EditableDocHeader client component"
```

---

### Task 3: Actualizar el visor

**Files:**
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/page.tsx`

- [ ] **Step 1: Reemplazar el header estático**

Abre `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/page.tsx`.

Añade el import de `EditableDocHeader` al principio, tras los imports existentes:

```tsx
import { EditableDocHeader } from './_components/EditableDocHeader'
```

Luego reemplaza el bloque `{/* Cabecera */}` (líneas 31-46 actuales):

```tsx
      {/* Cabecera */}
      <EditableDocHeader doc={doc} workspaceId={workspaceId} />
```

El archivo completo resultante debe ser:

```tsx
import { requireUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDocument } from '@/app/actions/documents'
import { DeleteDocButton } from './_components/DeleteDocButton'
import { EditableDocHeader } from './_components/EditableDocHeader'

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
      <EditableDocHeader doc={doc} workspaceId={workspaceId} />

      {/* Botón eliminar */}
      <div className="flex justify-end">
        <DeleteDocButton docId={docId} workspaceId={workspaceId} />
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

**Nota:** El `DeleteDocButton` se mueve fuera del header (ahora en `EditableDocHeader`) a una línea propia bajo el header.

- [ ] **Step 2: Verificar TypeScript**

```powershell
cd C:\Users\priet\protools-hub; npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | Select-String "docId"
```

Salida esperada: sin errores.

- [ ] **Step 3: Commit**

```powershell
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/page.tsx"
git commit -m "feat(docs): replace static header with EditableDocHeader"
```

---

### Task 4: Deploy y verificación

**Files:** ninguno

- [ ] **Step 1: TypeScript completo**

```powershell
cd C:\Users\priet\protools-hub; npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | Select-String "error TS" | head -10
```

Salida esperada: sin errores nuevos.

- [ ] **Step 2: Deploy a producción**

```powershell
cd C:\Users\priet\protools-hub; npx vercel --prod --scope mitikus
```

Esperar hasta ver la URL de producción aliased a `www.mitikus.com`.

- [ ] **Step 3: Verificar en producción**

1. Abre `https://www.mitikus.com` → workspace → Docs → abre un documento.
2. Haz clic en el título → debe activarse el input.
3. Cambia el título y guarda → debe mostrar "Guardado ✓".
4. Cambia la categoría desde el select → guarda → vuelve al listado y comprueba que el badge de categoría refleja el cambio.
