# CLOUD13 — Archived Source Focus

Fecha: 2026-08-22

## Estado

Completado.

## Contexto

CLOUD11 y CLOUD12 añadieron `Ver memoria` desde fuentes `memory` del Brain y del
Historial.

Quedaba un caso molesto: una consulta histórica podía apuntar a una memoria que
después fue archivada. La UI intentaba abrirla en `Activas`, donde ya no estaba.

## Cambio implementado

### BrainTabs

Archivo modificado:

- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/BrainTabs.tsx`

Cambios:

- Además de `focusedMemoryId`, mantiene `focusedMemoryKey`.
- Cada click en `Ver memoria` incrementa la key.
- Esto permite reintentar el enfoque aunque el usuario pulse dos veces la misma
  memoria.

### MemoryCloudPanel

Archivo modificado:

- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/MemoryCloudPanel.tsx`

Cambios:

- Recibe `focusMemoryKey`.
- Al enfocar una memoria:
  - intenta abrir `Activas`
  - limpia búsqueda y filtro de tipo
  - expande el id solicitado
- Cuando termina de cargar:
  - si la memoria aparece en la vista actual, la expande
  - si no aparece en `Activas`, cambia automáticamente a `Archivadas`
  - solo intenta ese fallback una vez por click

## Qué no se hizo

- No se tocó `mitikus-ai`.
- No se cambió el contrato del Core.
- No se añadieron endpoints.
- No se modificó schema.
- No se hizo `db push`.
- No se implementó búsqueda server-side por id.

## Limitación residual

La API de memoria devuelve las últimas 50 memorias por estado.

Si una fuente histórica apunta a una memoria muy antigua que no está dentro de
esas 50, la UI puede no encontrarla ni en `Activas` ni en `Archivadas`.

Resolverlo bien requiere un endpoint o parámetro server-side para obtener una
memoria concreta por id.

## Siguiente paso recomendado

CLOUD14 — Memory Item Direct Lookup.

Añadir una lectura server-side por id dentro de la API de memoria para que los
enlaces desde Brain/Historial puedan abrir memorias concretas aunque no estén
entre las últimas 50.
