# CLOUD15 — Memory Source Deep Links

Fecha: 2026-08-22

## Estado

Completado.

## Contexto

CLOUD11–CLOUD14 hicieron que las fuentes `memory` del Brain y del Historial
puedan abrir el `MemoryItem` original de forma fiable.

Faltaba que ese estado pudiera sobrevivir a recargas o copiarse como URL.

## Cambio implementado

Archivo modificado:

- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/BrainTabs.tsx`

Se añadieron parámetros de URL:

- `?tab=local`
- `?tab=history`
- `?tab=memory`
- `?tab=memory&memory=<memoryItemId>`

Comportamiento:

- Sin `tab`, la vista por defecto sigue siendo `Brain`.
- Al cambiar de pestaña, se actualiza la URL con `history.replaceState`.
- Al pulsar `Ver memoria` desde Brain o Historial:
  - cambia a `Memoria`
  - enfoca la memoria
  - escribe `?tab=memory&memory=<id>` en la URL
- Al recargar una URL con `memory=<id>`, la pantalla entra directamente en
  `Memoria` y deja que `MemoryCloudPanel` resuelva el item por id.

## Qué no se hizo

- No se tocó `mitikus-ai`.
- No se cambió el contrato del Core.
- No se añadieron endpoints.
- No se modificó schema.
- No se hizo `db push`.
- No se cambió el routing server-side.
- No se añadió navegación profunda a otras fuentes que no sean `memory`.

## Decisión técnica

Se usó `window.history.replaceState` desde el componente cliente para mantener el
cambio acotado y evitar convertir la página server en una estructura más compleja.

No se usa `pushState` para no llenar el historial del navegador con cada cambio
de tab.

## Limitación

El deep link apunta al workspace actual y a una memoria concreta.

Si el usuario no tiene acceso al workspace o la memoria ya no existe, la API de
memoria devuelve 404 y la UI muestra un aviso legible.

## Siguiente paso recomendado

CLOUD16 — Brain/Memory UX QA Pass.

Revisar visualmente el flujo completo:

1. Crear memoria.
2. Preguntar al Brain.
3. Abrir fuente desde respuesta.
4. Abrir fuente desde historial.
5. Archivar/restaurar.
6. Recargar deep link.
