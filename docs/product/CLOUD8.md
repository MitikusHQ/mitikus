# CLOUD8 — Memory Item Edit & Archive UX

Fecha: 2026-08-22

## Estado

Completado.

## Contexto

CLOUD5 creó `MemoryItem` como memoria libre en MITIKUS Cloud.
CLOUD6 sincroniza nuevas memorias al Core local de forma secundaria.
CLOUD7 hace que el Brain cloud consulte `memory_items` activos.

Faltaba poder corregir y retirar memorias desde la UI sin borrar datos.

## Principio

MITIKUS Cloud es la fuente de verdad.

Archivar no elimina memoria. Solo cambia `status` a `archived`, de forma que la
memoria deja de aparecer en la lista activa y queda fuera del Brain cloud porque
CLOUD7 busca únicamente `status = "active"`.

## Cambios implementados

### API

Archivo modificado:

- `apps/web/src/app/api/workspace/[workspaceId]/memory/route.ts`

Se añadió:

- `PATCH /api/workspace/[workspaceId]/memory`

Operaciones soportadas:

1. Editar memoria:
   - body: `{ id, title, content, type }`
   - valida ownership por `workspaceId` + `orgId`
   - valida `title` y `content` no vacíos
   - valida `title <= 200`
   - normaliza `type` a `note | decision | hypothesis | context`

2. Archivar memoria:
   - body: `{ id, action: "archive" }`
   - cambia `status` a `archived`
   - no borra el registro

### UI

Archivo modificado:

- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/MemoryCloudPanel.tsx`

Cambios:

- Cada memoria expandida muestra acciones `Editar` y `Archivar`.
- `Editar` abre un formulario inline con título, tipo y contenido.
- `Guardar cambios` actualiza la lista sin recargar.
- `Archivar` pide confirmación y elimina el item de la lista activa.
- El aviso superior ya no dice que CLOUD6 está pendiente.

## Qué no se hizo

- No se tocó `mitikus-ai`.
- No se cambió el contrato del Core.
- No se añadieron endpoints en el Core.
- No se hizo `db push`.
- No se borran memorias.
- No se implementó vista de archivadas.
- No se implementó restaurar archivadas.

## Brecha residual

Las memorias nuevas se envían al Core local por CLOUD6, pero el Core MVP no tiene
contrato de actualizar o archivar notas ya indexadas.

Por eso:

- Brain cloud respeta edición y archivo inmediatamente porque lee MITIKUS DB.
- Brain local puede conservar una copia antigua si esa memoria ya había sido
  sincronizada al Core antes de editarse o archivarse.

Esto es aceptable en el MVP porque MITIKUS Cloud es la fuente de verdad y el Core
local es un índice derivado. La solución correcta requiere un contrato de sync
explícito, no un parche sobre el Core actual.

## Siguiente paso recomendado

CLOUD9 — Archived Memory View & Restore.

Permitir revisar memorias archivadas y restaurarlas si se archivaron por error.
