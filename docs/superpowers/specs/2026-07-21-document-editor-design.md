# Document Editor — Design Spec

## Goal

Permitir editar el contenido de documentos existentes y crear nuevos documentos desde cero, con un editor de texto enriquecido dentro de MITIKUS.

## Scope

- Edición de contenido (campo `content` HTML + `rawText` + `wordCount`) de documentos existentes
- Creación de documentos nuevos con título + contenido desde la app
- Fuera de scope: imágenes embebidas, colaboración en tiempo real, versionado de contenido

## Librería

**Tiptap** — editor ProseMirror-based para React. Sin binarios nativos, compatible con Vercel.

Paquetes:
```
@tiptap/react @tiptap/pm @tiptap/starter-kit
@tiptap/extension-table @tiptap/extension-table-row
@tiptap/extension-table-cell @tiptap/extension-table-header
@tiptap/extension-link
```

StarterKit incluye: párrafos, H1-H6, negrita, cursiva, tachado, listas (bullet + ordenada), código inline, bloque de código, cita, regla horizontal.

## Editar documento existente

### UX

- Botón "Editar" en el header del visor (en `EditableDocHeader`).
- Al hacer clic: el bloque `<div dangerouslySetInnerHTML>` se sustituye por `<TiptapEditor initialContent={doc.content} />`.
- Barra inferior fija con "Guardar" y "Cancelar".
- **Aviso al salir con cambios sin guardar:** listener `beforeunload` activo solo en modo edición.
- Cancelar: descarta cambios, vuelve al modo lectura.
- Guardar: llama `updateDocumentContent`, vuelve al modo lectura.

### Toolbar

Fila encima del editor con botones: **B** · *I* · ~~S~~ · H1 · H2 · H3 · Lista · Lista numerada · Enlace · Tabla · Cita · Código · Regla horizontal

### Server action nueva

En `apps/web/src/app/actions/documents.ts`:

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
```

## Crear documento nuevo

### UX

- Botón "+ Nuevo documento" en la página de listado `/docs`.
- Navega a `/docs/new`.
- Editor en blanco con campo de título arriba.
- Botón "Crear documento" guarda y redirige al visor del doc recién creado.
- Botón "Cancelar" vuelve al listado.

### Server action nueva

En `apps/web/src/app/actions/documents.ts`:

```typescript
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

## Componentes

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `apps/web/src/lib/tiptap-extensions.ts` | Crear | Configuración de extensiones Tiptap (reutilizable) |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/_components/TiptapEditor.tsx` | Crear | Client Component: editor Tiptap + toolbar |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/EditableDocHeader.tsx` | Modificar | Añadir botón "Editar" y estado `isEditing` |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/page.tsx` | Modificar | Pasar `isEditing` state + mostrar TiptapEditor cuando edita |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/new/page.tsx` | Crear | Página "Nuevo documento" con TiptapEditor vacío |
| `apps/web/src/app/actions/documents.ts` | Modificar | Añadir `updateDocumentContent` y `createDocument` |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/_components/DocList.tsx` | Modificar | Añadir botón "+ Nuevo documento" |

## Estado de edición

El estado `isEditing` vive en un `DocViewerClient` Client Component que envuelve el contenido del visor. El Server Component `page.tsx` pasa `doc.content` como prop inicial; el Client Component gestiona el toggle entre vista y edición.

```
page.tsx (Server) → DocViewerClient (Client) → [view: prose div | edit: TiptapEditor]
```

## Extras incluidos

- **`beforeunload`** — aviso del navegador si el usuario navega fuera con el editor abierto y cambios sin guardar
- **Recálculo de `wordCount`** — se recalcula en cada guardado a partir del nuevo `rawText`
- **Tachado en toolbar** — incluido en StarterKit, un botón más

## Out of scope

- Autosave automático
- Imágenes embebidas en el editor
- Historial de versiones
- Colaboración en tiempo real
