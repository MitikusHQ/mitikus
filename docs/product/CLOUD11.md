# CLOUD11 — Memory Source Links

Fecha: 2026-08-22

## Estado

Completado.

## Contexto

CLOUD7 hizo que el Brain cloud usara `MemoryItem` como fuente `memory`.
CLOUD10 dejó la pestaña "Memoria" preparada para listas largas.

Faltaba conectar ambos lados visualmente: cuando el Brain cita una memoria, el
usuario debe poder abrir esa memoria concreta sin buscarla a mano.

## Cambio implementado

### BrainPanel

Archivo modificado:

- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/BrainPanel.tsx`

Cambios:

- Nueva prop opcional `onOpenMemorySource(memoryId)`.
- Cada fuente `type === "memory"` muestra botón `Ver memoria`.
- El botón no altera la respuesta ni las fuentes; solo navega visualmente.

### BrainTabs

Archivo modificado:

- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/BrainTabs.tsx`

Cambios:

- Mantiene `focusedMemoryId`.
- Al abrir una fuente memory:
  - cambia a tab `Memoria`
  - pasa `focusMemoryId` a `MemoryCloudPanel`

### MemoryCloudPanel

Archivo modificado:

- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/MemoryCloudPanel.tsx`

Cambios:

- Nueva prop opcional `focusMemoryId`.
- Cuando recibe una memoria a enfocar:
  - cambia a vista `Activas`
  - limpia búsqueda y tipo
  - expande la memoria
  - resalta visualmente la tarjeta

## Qué no se hizo

- No se tocó `mitikus-ai`.
- No se cambió el contrato del Core.
- No se añadieron endpoints.
- No se modificó schema.
- No se hizo `db push`.
- No se cambió la persistencia de `BrainQuery` ni `BrainSource`.
- No se implementaron URLs profundas.

## Limitación conocida

El enlace funciona para fuentes `memory` activas de MITIKUS Cloud.

Si una memoria citada por un resultado antiguo fue archivada después, el enlace
intentará abrir la vista activa y no encontrará una tarjeta visible. Esto es
aceptable en el MVP porque el historial mantiene la fuente citada, pero la
memoria ya no es activa.

## Siguiente paso recomendado

CLOUD12 — Brain History Source Links.

Aplicar el mismo patrón en la pestaña "Historial" para que las fuentes
`cloud-memory` archivadas o activas puedan abrir la memoria correspondiente.
