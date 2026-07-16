# Diseño: Control Horario

**Fecha:** 2026-07-17
**Estado:** Aprobado
**Scope:** Fichaje de entrada/salida + imputación de horas por proyecto para todos los trabajadores del workspace

---

## 1. Contexto

MITIKUS necesita un sistema de control horario con dos capas:
1. **Fichaje legal**: registro de entrada/salida por trabajador (base para cumplimiento RD-ley 8/2019)
2. **Imputación de horas**: qué tiempo se dedica a cada misión/cliente

Acceso desde dos puntos: widget en "Mi día" (acción rápida) y sección propia en la sidebar (historial + gestión).

---

## 2. Modelos de datos

### Nuevo modelo: `TimeEntry`

```prisma
model TimeEntry {
  id          String    @id @default(cuid())
  workspaceId String
  userId      String
  date        DateTime  @db.Date
  clockIn     DateTime
  clockOut    DateTime?
  note        String?
  editReason  String?
  editedAt    DateTime?
  editedBy    String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id])
  imputations TimeImputation[]

  @@index([workspaceId, userId, date])
}
```

### Nuevo modelo: `TimeImputation`

```prisma
model TimeImputation {
  id          String    @id @default(cuid())
  timeEntryId String
  objectiveId String?
  clientId    String?
  hours       Decimal   @db.Decimal(4, 2)
  description String?
  createdAt   DateTime  @default(now())

  timeEntry   TimeEntry        @relation(fields: [timeEntryId], references: [id], onDelete: Cascade)
  objective   CompanyObjective? @relation(fields: [objectiveId], references: [id])
  client      Client?           @relation(fields: [clientId], references: [id])
}
```

---

## 3. Flujo de usuario

### Fichaje desde "Mi día"

1. El usuario llega al dashboard → ve el widget de fichaje
2. Si no ha fichado hoy: botón grande **"Fichar entrada"** → registra `clockIn = now()`
3. Si está fichado (sin `clockOut`): botón **"Fichar salida"** + contador "Llevas Xh Ym" en tiempo real (cliente)
4. Si ya ha completado el día (entrada + salida): resumen "Entrada 09:02 · Salida 17:34 · 8h 32m" + link "Ver en Control horario"

### Sección Control horario

URL: `/workspace/[workspaceId]/timelog`

**Panel superior**: mismo widget entrada/salida + campos editables para la hora de hoy

**Panel central — historial semanal**:
- Tabla: Día | Entrada | Salida | Total | Imputaciones | Acciones
- Acción "Editar" → modal con campos `clockIn`, `clockOut` y `editReason` (obligatorio)
- Acción "Eliminar" → confirmación (solo el propio usuario o admin)
- Navegación semana anterior / siguiente
- Total semanal al pie

**Panel inferior — imputaciones del día seleccionado**:
- Lista de imputaciones del día
- Botón "Añadir imputación" → modal: seleccionar misión (opcional), cliente (opcional), horas (decimal), descripción
- Editar / eliminar imputación existente

---

## 4. Arquitectura

### Server Actions

`apps/web/src/app/actions/timelog.ts`

```typescript
clockIn(workspaceId: string, userId: string): Promise<TimeEntry>
clockOut(workspaceId: string, userId: string): Promise<TimeEntry>
getTodayEntry(workspaceId: string, userId: string): Promise<TimeEntry | null>
getWeekEntries(workspaceId: string, userId: string, weekStart: Date): Promise<TimeEntry[]>
updateEntry(entryId: string, data: { clockIn: Date, clockOut: Date, editReason: string }): Promise<TimeEntry>
deleteEntry(entryId: string, workspaceId: string): Promise<void>
addImputation(data: { timeEntryId, objectiveId?, clientId?, hours, description? }): Promise<TimeImputation>
deleteImputation(imputationId: string): Promise<void>
```

### Componentes

- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/today/_components/ClockWidget.tsx` — Client Component con timer en vivo
- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/timelog/page.tsx` — Server Component (página principal)
- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/timelog/_components/WeekTable.tsx` — Client Component (navegación de semana)
- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/timelog/_components/EditEntryModal.tsx` — Client Component
- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/timelog/_components/ImputationPanel.tsx` — Client Component

### Icono en sidebar

Nuevo ítem "Control horario" en la sidebar del workspace, después de "Mi día", con icono de reloj.

---

## 5. UI

- **Widget en Mi día**: card compacta en la parte superior de la página, siempre visible. En estado "sin fichar" ocupa poco espacio. En estado "fichado" muestra el contador vivo.
- **Contador vivo**: Client Component con `setInterval` de 1 minuto para actualizar "Llevas Xh Ym". No hace polling al servidor.
- **Tabla semanal**: días en columnas o filas, cada celda con entrada/salida/total. Fin de semana visible pero deshabilitado para fichar.
- **Modal de edición**: dos campos de hora (`<input type="time">`), campo "Motivo de corrección" (requerido), botón guardar.
- **Panel imputaciones**: acordeón o sección inferior. Selector de misión con búsqueda, selector de cliente, campo horas (número decimal 0.5-24), descripción libre.

---

## 6. Reglas de negocio

- Solo se puede tener **un `TimeEntry` abierto** por usuario por día (un `clockIn` sin `clockOut`)
- Si hay un fichaje abierto de días anteriores (olvidó fichar salida), se permite crear uno nuevo para hoy pero se avisa al usuario
- El `editReason` es obligatorio al editar un fichaje ya cerrado
- `clockOut` debe ser posterior a `clockIn`
- Las horas imputadas por día no tienen límite impuesto por sistema (pueden superar las horas fichadas)
- El `editedBy` registra el userId de quien hizo la corrección (puede ser otro usuario admin)

---

## 7. Qué NO entra en este scope

- Vista de manager con el horario de todo el equipo (solo propio por ahora)
- Exportación PDF/Excel para inspección de trabajo
- Aprobación de fichajes por manager
- Geolocalización o IP de fichaje
- Notificaciones de olvido de fichaje
- Tipos de jornada (presencial / remoto / vacaciones)
- Integración con nóminas
