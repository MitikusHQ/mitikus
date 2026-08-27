# CLOUD9 — Archived Memory View & Restore

Fecha: 2026-08-22

## Estado

Completado.

## Contexto

CLOUD8 permitió archivar memorias sin borrarlas. Faltaba una forma visible de
revisar esas memorias archivadas y restaurarlas si se archivaron por error.

## Principio

Archivar no destruye memoria.

Una memoria archivada sigue en MITIKUS Cloud, pero no se considera activa y no
alimenta el Brain cloud porque CLOUD7 filtra `status = "active"`.

## Cambios implementados

### API

Archivo modificado:

- `apps/web/src/app/api/workspace/[workspaceId]/memory/route.ts`

`GET /api/workspace/[workspaceId]/memory` ahora acepta:

- sin query: lista `status = "active"`
- `?status=archived`: lista `status = "archived"`

`PATCH /api/workspace/[workspaceId]/memory` ahora acepta:

- `{ id, action: "restore" }`

Restaurar cambia `status` a `active`.

### UI

Archivo modificado:

- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/MemoryCloudPanel.tsx`

Cambios:

- Selector simple `Activas / Archivadas`.
- La vista activa conserva crear, editar y archivar.
- La vista archivada oculta creación y edición.
- Cada memoria archivada muestra botón `Restaurar`.
- Restaurar elimina el item de la vista archivada y vuelve a dejarlo activo.
- Empty state específico para archivadas.

## Qué no se hizo

- No se tocó `mitikus-ai`.
- No se cambió el contrato del Core.
- No se añadieron endpoints en el Core.
- No se hizo `db push`.
- No se implementó borrado definitivo.
- No se implementó sync de restore hacia Core local.

## Brecha residual

El Brain cloud respeta inmediatamente el restore porque lee MITIKUS DB.

El Core local puede conservar copias antiguas o no reflejar restauraciones porque
el contrato actual del Core no tiene actualización, archivado ni restore de notas.
Esto queda fuera del MVP: MITIKUS Cloud es la fuente de verdad.

## Siguiente paso recomendado

CLOUD10 — Memory Search & Filter UX.

Añadir búsqueda local en la pestaña "Memoria" por título/contenido y filtro por
tipo (`note`, `decision`, `hypothesis`, `context`) para manejar listas más largas.
