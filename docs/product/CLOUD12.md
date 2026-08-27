# CLOUD12 — Brain History Source Links

Fecha: 2026-08-22

## Estado

Completado.

## Contexto

CLOUD11 permitió abrir una memoria desde las fuentes del Brain cloud en la pestaña
principal.

Faltaba aplicar el mismo patrón a la pestaña "Historial", donde las fuentes se
leen desde `BrainSource`.

## Cambio implementado

### API

Archivo modificado:

- `apps/web/src/app/api/workspace/[workspaceId]/brain/history/route.ts`

Se añadió `sourceId` al `select` de `sourcesList`.

No cambia el modelo ni crea endpoint nuevo. Solo expone un campo que ya existe
en `BrainSource` para que la UI pueda abrir el `MemoryItem` original.

### BrainHistoryPanel

Archivo modificado:

- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/BrainHistoryPanel.tsx`

Cambios:

- Nueva prop opcional `onOpenMemorySource(memoryId)`.
- Las fuentes con:
  - `origin === "cloud-memory"`
  - `sourceType === "memory"`

  muestran botón `Ver memoria`.

- El botón usa `sourceId`, no el id interno de `BrainSource`.

### BrainTabs

Archivo modificado:

- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/BrainTabs.tsx`

Cambios:

- Reutiliza el callback de CLOUD11.
- Desde Historial, `Ver memoria` cambia a la pestaña `Memoria` y enfoca el
  `MemoryItem`.

## Qué no se hizo

- No se tocó `mitikus-ai`.
- No se cambió el contrato del Core.
- No se añadió endpoint del Core.
- No se modificó schema.
- No se hizo `db push`.
- No se reescriben respuestas, warnings ni fuentes.
- No se implementó deep-link por URL.

## Limitación conocida

Si una fuente histórica apunta a una memoria que después fue archivada, la acción
abre la pestaña "Memoria" en vista activa y puede no encontrarla visible.

Esto queda pendiente para una mejora futura: abrir fuentes archivadas directamente
en vista `Archivadas`.

## Siguiente paso recomendado

CLOUD13 — Archived Source Focus.

Resolver el caso de fuentes históricas que apuntan a memorias archivadas,
abriendo automáticamente la vista `Archivadas` cuando el `MemoryItem` ya no está
activo.
