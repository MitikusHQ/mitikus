# CLOUD16 — Brain/Memory UX QA Pass

Fecha: 2026-08-22

## Estado

Completado con una limitación de QA manual.

## Objetivo

Revisar el flujo Brain/Memoria tras CLOUD5–CLOUD15:

1. Crear memoria.
2. Consultar Brain cloud.
3. Abrir fuente `memory` desde respuesta.
4. Abrir fuente `memory` desde historial.
5. Archivar/restaurar.
6. Recargar deep link `?tab=memory&memory=<id>`.

## Qué se verificó

### Verificación técnica

- `npx tsc --noEmit`
- `npm run lint`

Ambos pasan.

El lint mantiene warnings heredados fuera de esta zona:

- `SlideEditor.tsx`
- `ReceiptScanModal.tsx`
- `ReceiptsClient.tsx`
- `NotificationBell.tsx`
- `signature-canvas.tsx`

No hay warnings nuevos en los componentes Brain/Memoria.

### Verificación de navegación local

Se arrancó la app local en:

- `http://localhost:3002`

La app carga correctamente.

El navegador de QA no tenía sesión activa de MITIKUS y quedó en la landing/login,
por lo que no se pudo completar una prueba visual end-to-end dentro de un
workspace autenticado.

Chrome externo no estaba disponible para control automatizado desde Codex en esta
sesión.

## Bug encontrado y corregido

Archivo modificado:

- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/BrainTabs.tsx`

Problema:

Si el usuario abría una memoria desde una fuente (`Ver memoria`) y después
entraba manualmente a la pestaña `Memoria`, podía mantenerse el foco anterior
aunque la URL ya no tuviera `memory=`.

Corrección:

`selectTab()` ahora limpia siempre `focusedMemoryId` cuando el cambio de pestaña
es manual.

Resultado:

- Click manual en `Memoria`: abre la lista normal.
- Click en `Ver memoria`: abre y enfoca la memoria concreta.

## Qué no se pudo verificar automáticamente

Por falta de sesión autenticada en el navegador de QA:

- Crear memoria desde UI.
- Consultar Brain cloud con memoria real.
- Abrir fuente desde respuesta real.
- Abrir fuente desde historial real.
- Archivar/restaurar desde UI real.
- Recargar deep link dentro del workspace autenticado.

## Checklist manual pendiente

Cuando haya sesión activa en navegador:

1. Abrir `/workspace/[workspaceId]/brain`.
2. Entrar en `Memoria`.
3. Crear una memoria con una palabra única.
4. Ir a `Brain` y preguntar por esa palabra.
5. Confirmar que aparece fuente `Memoria`.
6. Pulsar `Ver memoria`.
7. Confirmar cambio a pestaña `Memoria`, tarjeta expandida y resaltada.
8. Ir a `Historial`, abrir la consulta y pulsar `Ver memoria`.
9. Archivar la memoria.
10. Confirmar que desaparece de `Activas` y aparece en `Archivadas`.
11. Restaurarla.
12. Confirmar que vuelve a `Activas`.
13. Copiar URL `?tab=memory&memory=<id>`, recargar y confirmar foco correcto.

## Qué no se tocó

- No se tocó `mitikus-ai`.
- No se tocó Core.
- No se modificó schema.
- No se hizo `db push`.
- No se tocó Tauri, instaladores, iconos ni release package.

## Siguiente paso recomendado

CLOUD17 — Authenticated Manual QA Run.

Ejecutar el checklist anterior con una sesión Clerk activa y capturar el resultado
real antes de añadir más features sobre Brain/Memoria.
