# Diseño: Tareas de equipo + Notificaciones

**Fecha:** 2026-07-18
**Estado:** Aprobado
**Scope:** Sistema de tareas libres con etiquetado colaborativo, vinculación a misiones/clientes, compartir tarea y notificaciones in-app + email.

---

## 1. Contexto

MITIKUS tiene Misiones (objetivos estratégicos) con MissionSteps asignados, pero no hay un sistema de tareas libres para el trabajo diario del equipo. Sin tareas, el equipo tiene que salir a Trello/Linear para coordinarse. Este módulo añade la capa de trabajo operativo sin reemplazar las Misiones — las tareas pueden (opcionalmente) vincularse a ellas.

---

## 2. Modelo de datos

### `Task`

```prisma
model Task {
  id          String   @id @default(cuid())
  workspaceId String
  title       String
  description String?
  status      TaskStatus @default(PENDING)
  priority    TaskPriority @default(MEDIUM)
  dueDate     DateTime?
  objectiveId String?   // vínculo opcional a CompanyObjective
  clientId    String?   // vínculo opcional a Client
  shareToken  String?   @unique
  createdBy   String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  workspace   Workspace        @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  creator     User             @relation("TaskCreator", fields: [createdBy], references: [id], onDelete: Restrict)
  objective   CompanyObjective? @relation(fields: [objectiveId], references: [id], onDelete: SetNull)
  client      Client?          @relation(fields: [clientId], references: [id], onDelete: SetNull)
  tags        TaskTag[]
  notifications Notification[]

  @@index([workspaceId, status])
  @@index([workspaceId, dueDate])
  @@index([createdBy])
  @@index([objectiveId])
  @@index([clientId])
  @@index([shareToken])
  @@map("tasks")
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  DONE
  CANCELLED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

### `TaskTag`

Relación many-to-many entre Task y User. Etiquetar a alguien genera una Notification.

```prisma
model TaskTag {
  id        String   @id @default(cuid())
  taskId    String
  userId    String
  taggedBy  String
  createdAt DateTime @default(now())

  task      Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user      User @relation("TaskTags", fields: [userId], references: [id], onDelete: Cascade)
  tagger    User @relation("TaskTaggers", fields: [taggedBy], references: [id], onDelete: Cascade)

  @@unique([taskId, userId])
  @@index([userId])
  @@index([taskId])
  @@map("task_tags")
}
```

### `Notification`

Buzón por usuario. Tipos iniciales: `tagged` (te han etiquetado) y `deadline` (tarea con vencimiento en 24h).

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // tagged | deadline
  taskId    String
  message   String
  readAt    DateTime?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([userId, readAt])
  @@index([userId, createdAt])
  @@map("notifications")
}
```

### Relaciones inversas a añadir

En `User`: `tasksCreated Task[] @relation("TaskCreator")`, `taskTags TaskTag[] @relation("TaskTags")`, `taskTagsMade TaskTag[] @relation("TaskTaggers")`, `notifications Notification[]`

En `Workspace`: `tasks Task[]`

En `CompanyObjective`: `tasks Task[]`

En `Client`: `tasks Task[]`

---

## 3. Server Actions

Fichero: `apps/web/src/app/actions/tasks.ts`

```typescript
// Lectura
getTasks(workspaceId, filters): Promise<TaskData[]>
getTask(taskId, workspaceId): Promise<TaskData>
getNotifications(workspaceId): Promise<NotificationData[]>
getUnreadCount(workspaceId): Promise<number>

// Mutaciones (auth interna via getAuthUserId())
createTask(workspaceId, data): Promise<TaskData>
updateTask(taskId, workspaceId, data): Promise<TaskData>
deleteTask(taskId, workspaceId): Promise<void>
tagUser(taskId, workspaceId, userId): Promise<void>
untagUser(taskId, workspaceId, userId): Promise<void>
markNotificationRead(notificationId, workspaceId): Promise<void>
markAllNotificationsRead(workspaceId): Promise<void>
generateShareToken(taskId, workspaceId): Promise<string>
```

`createTask` y `tagUser` disparan el email de notificación a los etiquetados. `markNotificationRead` se llama al abrir el panel de notificaciones.

---

## 4. Notificaciones

### In-app

- `NotificationBell` — Client Component en `WorkspaceTopbar.tsx`
- Lee `getUnreadCount` en el Server Component del topbar; hidrata con `useEffect` para polling suave (cada 60s)
- Al hacer clic: panel lateral con lista de notificaciones (`NotificationPanel`)
- Cada ítem: tipo de notificación, mensaje ("Ana te etiquetó en: Revisar propuesta"), tiempo relativo, link a la tarea
- Clic en ítem → marca como leída + navega a `/tasks?task=<id>`
- "Marcar todas como leídas" en el header del panel

### Email (Resend)

Librería: `resend` (instalar en apps/web)

Fichero: `apps/web/src/lib/email.ts`

- Función `sendTagNotificationEmail({ to, taggerName, taskTitle, taskUrl })`
- Template HTML inline sencillo con nombre de la tarea y botón "Ver tarea"
- Se llama desde `tagUser()` server action para cada usuario etiquetado
- Solo se envía si el usuario tiene email verificado
- No bloquea la respuesta (fire-and-forget con `.catch(console.error)`)

---

## 5. Páginas y componentes

### `/workspace/[workspaceId]/tasks` — página principal

Server Component que carga la lista inicial con filtros desde searchParams.

**Filtros**: `status` (all/pending/in_progress/done), `mine` (solo etiquetadas a mí), `priority`, `clientId`, `objectiveId`

**Componentes:**
- `TaskList` (Client Component) — lista con filtros interactivos, navegación de tarea
- `TaskModal` (Client Component) — modal crear/editar. Campos: título, descripción, estado, prioridad, fecha límite, misión, cliente, etiquetados
- `TaskRow` — fila de la lista: check (cambia estado), dot de prioridad, título, avatares etiquetados, badge de misión/cliente, fecha

### Integración en Mi día (`/today`)

La sección "Mis tareas" ya existe en Mi día (muestra MissionSteps). Añadir debajo una sección "Tareas" que muestre:
- Tareas donde estoy etiquetado con status PENDING o IN_PROGRESS
- Ordenadas por dueDate ASC, luego createdAt ASC
- Máximo 5 tareas; enlace "Ver todas (N) →" a `/tasks?mine=true`

### Compartir tarea

Botón "Compartir" en el modal → genera `shareToken` si no existe → copia al portapapeles la URL pública `/t/[shareToken]`

Página pública: `apps/web/src/app/t/[shareToken]/page.tsx` — muestra título, descripción, estado, prioridad, fecha límite y personas etiquetadas (solo nombres/iniciales). Sin autenticación. Sin acciones.

---

## 6. Reglas de negocio

- Cualquier miembro del workspace puede crear tareas
- Cualquier miembro puede etiquetar a cualquier otro miembro del mismo workspace
- Solo el creador o un ADMIN/OWNER puede eliminar una tarea
- Cualquier etiquetado puede cambiar el estado de la tarea (marcarla como hecha)
- El `shareToken` se genera bajo demanda; revocar = borrar el token (null)
- Las notificaciones de deadline se generan mediante un cron job diario (fuera de scope de este sprint — se deja el modelo listo)
- No se envía email si el etiquetador y el etiquetado son la misma persona

---

## 7. Nav y badge

- Nueva entrada en `mainItems` del layout: **"Tareas"** con icono de checkbox, entre "Mi día" y "Copilot"
- Badge numérico con el conteo de tareas donde estoy etiquetado con status PENDING (mismo patrón que el badge de "Mi día")
- Icono `tasks` en `WorkspaceIcons.tsx`: checkbox SVG

---

## 8. Qué NO entra en este scope

- Comentarios en tareas
- Subtareas o dependencias entre tareas
- Notificaciones de deadline por cron (modelo listo, disparo no)
- Vista Kanban (solo lista en este sprint)
- Filtro por etiquetado a otro usuario específico
- Edición inline en la lista (solo modal)
- Historial de cambios en la tarea
