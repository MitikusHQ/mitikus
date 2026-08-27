# CLOUD10 — Memory Search & Filter UX

Fecha: 2026-08-22

## Estado

Completado.

## Contexto

CLOUD5–CLOUD9 dejaron la pestaña "Memoria" con creación, edición, archivado,
vista de archivadas y restauración.

El siguiente problema práctico era manejar listas más largas sin tener que
recorrerlas visualmente.

## Cambio implementado

Archivo modificado:

- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/MemoryCloudPanel.tsx`

Se añadieron filtros en cliente:

- Búsqueda por texto en `title` y `content`.
- Filtro por `type`:
  - todos
  - note
  - decision
  - hypothesis
  - context

La búsqueda funciona tanto en la vista `Activas` como en la vista `Archivadas`.

## UX

- Los filtros aparecen debajo del selector `Activas / Archivadas`.
- Se muestra contador `N de M memorias`.
- Si hay filtros activos, aparece `Limpiar filtros`.
- El empty state distingue entre:
  - no hay memorias en esa vista
  - no hay coincidencias para la búsqueda/filtro actual

## Qué no se hizo

- No se tocó `mitikus-ai`.
- No se cambió el contrato del Core.
- No se añadieron endpoints.
- No se modificó schema.
- No se hizo `db push`.
- No se implementó paginación.
- No se implementó búsqueda server-side.

## Notas

El filtro es client-side sobre los 50 registros que devuelve la API actual.
Esto es suficiente para el MVP y evita cambiar el contrato de memoria.

Cuando la lista crezca de forma real, el siguiente paso será mover búsqueda,
tipo, estado y paginación a parámetros server-side.

## Siguiente paso recomendado

CLOUD11 — Memory Detail Source Links.

Hacer que las fuentes `memory` mostradas por Brain cloud enlacen o resalten el
`MemoryItem` correspondiente en la pestaña "Memoria".
