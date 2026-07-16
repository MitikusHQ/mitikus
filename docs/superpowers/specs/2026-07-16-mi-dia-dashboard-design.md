# Diseño: Panel "Mi día"

**Fecha:** 2026-07-16
**Estado:** Aprobado
**Scope:** Página central de arranque diario que agrega pendientes personales y actividad del equipo

---

## 1. Contexto

MITIKUS tiene misiones, workflows, herramientas y clientes, pero no existe un punto de entrada único para el día de trabajo. Los usuarios (perfiles mixtos: consultor, equipo interno, solopreneur) tienen que navegar por varias secciones para saber qué tienen pendiente. El objetivo es una página que resuelva la pregunta "¿qué tengo que hacer hoy?" en un solo vistazo.

---

## 2. Flujo de usuario

1. El usuario abre MITIKUS → la sidebar muestra "Mi día" como primer ítem con badge numérico si hay pendientes
2. Hace clic → ve tres bloques en una sola página:
   - Sus pasos de misión pendientes (asignados a él)
   - Sus workflows pendientes de ejecutar
   - Feed de actividad del equipo en las últimas 24h
3. Desde cualquier ítem puede ir directamente a la tarea con un clic
4. Si no hay nada pendiente, ve un mensaje positivo

---

## 3. Contenido de la página

### Bloque 1 — Mis pendientes (misiones)

- Fuente: `MissionStep` donde `assigneeId = userId` y `status != DONE`
- Orden: por fecha límite ascendente (nulls al final)
- Máximo 10 ítems; enlace "Ver todos" si hay más
- Cada ítem muestra:
  - Nombre de la misión (breadcrumb)
  - Nombre del paso
  - Chip del cliente asociado (si existe)
  - Botón "Ir al paso" → `/workspace/[id]/missions/[objectiveId]`

### Bloque 2 — Workflows pendientes

- Fuente: `WorkflowExecution` del workspace con `status IN (PENDING, IN_PROGRESS)` + workflows publicados sin ejecución reciente del usuario (últimas 48h)
- Máximo 10 ítems; enlace "Ver todos" si hay más
- Cada ítem muestra:
  - Nombre del workflow
  - Estado de la última ejecución (badge)
  - Botón "Ejecutar" → `/workspace/[id]/workflows/[workflowId]`

### Bloque 3 — Actividad del equipo hoy

- Fuente: `AuditLog` del workspace de las últimas 24h, excluyendo eventos del propio usuario
- Máximo 20 eventos; sin paginación
- Cada ítem: avatar inicial + nombre + acción en lenguaje natural + tiempo relativo (ej. "Ana ejecutó *Análisis DAFO* hace 2h")
- Solo lectura, sin acciones

### Estado vacío

Si los bloques 1 y 2 están vacíos: mensaje "Todo al día. Buen trabajo." con icono.

---

## 4. Arquitectura

### Sin modelos nuevos de Prisma

Toda la información ya existe en la BD. No se añade ningún modelo.

### Server action: `getTodayData(workspaceId, userId)`

Ubicación: `apps/web/src/app/actions/today.ts`

Hace 3 queries en paralelo con `Promise.all`:
1. `MissionStep` pendientes asignados al usuario
2. `WorkflowExecution` pendientes + workflows sin ejecución reciente
3. `AuditLog` últimas 24h del workspace (excluye userId)

Devuelve:
```typescript
interface TodayData {
  pendingSteps: PendingStep[]
  pendingWorkflows: PendingWorkflow[]
  teamActivity: TeamActivityEvent[]
  pendingCount: number  // suma de steps + workflows para el badge
}
```

### Página Server Component

`apps/web/src/app/(dashboard)/workspace/[workspaceId]/today/page.tsx`

- Llama a `getTodayData(workspaceId, userId)` en el servidor
- Renderiza los tres bloques
- Sin estado cliente — recarga al navegar

### Badge en sidebar

`WorkspaceSidebar.tsx` — añadir "Mi día" como primer ítem con badge numérico.

El badge viene del `pendingCount` que devuelve la server action, llamado en el layout del workspace para que esté disponible en la sidebar.

---

## 5. UI

- **Saludo:** "Buenos días, [nombre]" + fecha actual (día de la semana, fecha)
- **Icono sidebar:** sol o calendario
- **Badge:** número rojo sobre el icono, solo visible si `pendingCount > 0`
- **Bloques:** tarjetas con título de sección, lista de ítems, enlace "Ver todos" si hay más de 10
- **Ítem de misión:** breadcrumb misión → paso, chip cliente, botón "Ir al paso"
- **Ítem de workflow:** nombre, badge de estado, botón "Ejecutar"
- **Ítem de actividad:** avatar con inicial, texto en lenguaje natural, tiempo relativo
- **Estado vacío global:** "Todo al día. Buen trabajo." con icono de check

---

## 6. Qué NO entra en este scope

- Tiempo real / websockets (la página se recarga al navegar, suficiente para uso diario)
- Notificaciones push o email
- Capacidad de crear tareas desde "Mi día" (solo lectura + navegación)
- Filtros o configuración de qué mostrar
- Vista del equipo separada (solo feed de actividad compacto)
