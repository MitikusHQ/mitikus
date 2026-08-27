# CLOUD14 — Memory Item Direct Lookup

Fecha: 2026-08-22

## Estado

Completado.

## Contexto

CLOUD13 abría fuentes de memoria históricas en `Activas` o `Archivadas`, pero
seguía dependiendo de que la memoria estuviera dentro de las últimas 50 devueltas
por la API.

Para que los enlaces desde Brain/Historial sean fiables, la UI necesita poder
pedir una memoria concreta por id.

## Cambio implementado

### API

Archivo modificado:

- `apps/web/src/app/api/workspace/[workspaceId]/memory/route.ts`

`GET /api/workspace/[workspaceId]/memory` ahora acepta:

- `?id=<memoryItemId>`

Respuesta:

- `200 { item }` si la memoria pertenece al workspace y organización del usuario.
- `404 { error: "Memoria no encontrada" }` si no existe o no pertenece al usuario.

El lookup por id ignora `status`, así puede devolver memorias activas o archivadas.

No se crea endpoint nuevo. Es una ampliación de lectura de la ruta existente.

### UI

Archivo modificado:

- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/MemoryCloudPanel.tsx`

Cambios:

- Cuando llega `focusMemoryId`, el panel llama a:
  - `/api/workspace/[workspaceId]/memory?id=<focusMemoryId>`
- Si la memoria existe:
  - abre `Activas` o `Archivadas` según `item.status`
  - limpia filtros
  - inserta el item en la lista actual si no estaba entre los 50 cargados
  - expande y resalta la tarjeta
- Si falla:
  - muestra aviso legible sin romper la vista

## Qué no se hizo

- No se tocó `mitikus-ai`.
- No se cambió el contrato del Core.
- No se añadió endpoint del Core.
- No se modificó schema.
- No se hizo `db push`.
- No se implementaron URLs profundas.

## Seguridad

El lookup por id mantiene el mismo patrón de auth y ownership:

- Clerk `auth()`
- `User` por `clerkId`
- `Workspace` por `workspaceId + orgId`
- `MemoryItem` por `id + workspaceId + orgId`

Esto evita abrir memorias de otros workspaces u organizaciones.

## Siguiente paso recomendado

CLOUD15 — Memory Source Deep Links.

Opcionalmente persistir el estado de tab/memoria en URL para poder compartir o
recargar una pantalla apuntando a una memoria concreta.
