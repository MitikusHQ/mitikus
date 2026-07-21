# Document Metadata Edit — Design Spec

## Goal

Permitir editar el título y la categoría de un documento desde el visor, sin salir de la app.

## Scope

- Edición de `title` y `category` en la página `/docs/[docId]`
- Sin cambios de schema (ambos campos ya existen en el modelo `Document`)
- Fuera de scope: edición del contenido del documento, gestión de la lista de categorías

## UX

El header del visor (actualmente Server Component) se convierte en un `EditableDocHeader` Client Component:

- El título es un `<input>` que en reposo parece un `<h1>` estático. Al hacer clic se activa el modo edición.
- La categoría es un `<select>` siempre visible con las opciones de la lista fija.
- Un botón "Guardar" aparece cuando hay cambios pendientes (`isDirty`).
- Al guardar: texto "Guardado ✓" durante 2 segundos, luego desaparece.
- Al guardar: `router.refresh()` para que el listado y el breadcrumb reflejen el nuevo título.

## Categorías fijas

```typescript
const CATEGORIES = ['DNA', 'Producto', 'Arquitectura', 'Operaciones'] as const
```

El select incluye una opción vacía "Sin categoría" que guarda `null`.

## Implementación

### Server action nueva

En `apps/web/src/app/actions/documents.ts`, añadir:

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

### Componente nuevo

`apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/EditableDocHeader.tsx`

Client Component que recibe `doc` (DocumentDetail) y `workspaceId`. Gestiona estado local de título y categoría, detecta cambios (`isDirty`), llama a `updateDocument` al guardar.

### Cambio en el visor

`apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/page.tsx`

Reemplazar el header estático por `<EditableDocHeader doc={doc} workspaceId={workspaceId} />`.

## Archivos afectados

| Archivo | Acción |
|---|---|
| `apps/web/src/app/actions/documents.ts` | Añadir `updateDocument` |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/_components/EditableDocHeader.tsx` | Crear (Client Component) |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/docs/[docId]/page.tsx` | Reemplazar header estático por `<EditableDocHeader>` |

## Out of scope

- Edición del contenido HTML del documento
- Añadir o eliminar categorías desde la UI
- Historial de cambios
