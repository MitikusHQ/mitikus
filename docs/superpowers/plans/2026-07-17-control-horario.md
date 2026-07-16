# Control Horario Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir fichaje de entrada/salida e imputación de horas por proyecto a MITIKUS, con widget en "Mi día" y sección propia en sidebar.

**Architecture:** Dos modelos Prisma nuevos (`TimeEntry`, `TimeImputation`) sin migraciones (db push). Server actions en `timelog.ts`. Widget Client Component en "Mi día" con timer vivo. Página `/timelog` con tabla semanal editable y panel de imputaciones.

**Tech Stack:** Next.js 15 App Router, Prisma + PostgreSQL (Railway), `'use server'` actions, React Client Components para interactividad (timer, modales, navegación de semana).

---

## Estructura de ficheros

| Acción | Ruta |
|--------|------|
| Modify | `apps/web/prisma/schema.prisma` — añadir `TimeEntry` y `TimeImputation` |
| Create | `apps/web/src/app/actions/timelog.ts` — todas las server actions |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/today/_components/ClockWidget.tsx` |
| Modify | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/today/page.tsx` — añadir ClockWidget |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/timelog/page.tsx` |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/timelog/_components/WeekTable.tsx` |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/timelog/_components/EditEntryModal.tsx` |
| Create | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/timelog/_components/ImputationPanel.tsx` |
| Modify | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx` — icono reloj |
| Modify | `apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx` — añadir ítem "Control horario" |

---

## Task 1: Modelos Prisma + db push

**Files:**
- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: Añadir relaciones en modelos existentes**

Abre `apps/web/prisma/schema.prisma`. Busca `model User {` (línea ~205) y añade dentro de las relaciones:

```prisma
  timeEntries    TimeEntry[]
```

Busca `model Workspace {` (línea ~247) y añade dentro de las relaciones:

```prisma
  timeEntries    TimeEntry[]
```

Busca `model Client {` y añade:

```prisma
  timeImputations TimeImputation[]
```

Busca `model CompanyObjective {` y añade:

```prisma
  timeImputations TimeImputation[]
```

- [ ] **Step 2: Añadir modelo TimeEntry al final del schema**

Al final del fichero, antes del último bloque de comentarios (o al final), añade:

```prisma
// ============================================================
// CONTROL HORARIO — Fichaje de entrada/salida
// ============================================================

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

  workspace   Workspace      @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  imputations TimeImputation[]

  @@index([workspaceId, userId, date])
  @@map("time_entries")
}

model TimeImputation {
  id          String   @id @default(cuid())
  timeEntryId String
  objectiveId String?
  clientId    String?
  hours       Decimal  @db.Decimal(4, 2)
  description String?
  createdAt   DateTime @default(now())

  timeEntry   TimeEntry        @relation(fields: [timeEntryId], references: [id], onDelete: Cascade)
  objective   CompanyObjective? @relation(fields: [objectiveId], references: [id], onDelete: SetNull)
  client      Client?           @relation(fields: [clientId], references: [id], onDelete: SetNull)

  @@index([timeEntryId])
  @@map("time_imputations")
}
```

- [ ] **Step 3: Ejecutar db push**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx prisma db push
```

Resultado esperado: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 4: Regenerar cliente Prisma**

```powershell
npx prisma generate
```

Resultado esperado: `Generated Prisma Client`.

- [ ] **Step 5: Verificar tipos**

```powershell
npx tsc --noEmit 2>&1 | Select-Object -First 10
```

Resultado esperado: sin errores.

- [ ] **Step 6: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add apps/web/prisma/schema.prisma
git commit -m "feat(db): add TimeEntry and TimeImputation models for time tracking"
```

---

## Task 2: Server actions `timelog.ts`

**Files:**
- Create: `apps/web/src/app/actions/timelog.ts`

- [ ] **Step 1: Crear el fichero con todos los tipos e imports**

```typescript
'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export interface TimeEntryData {
  id: string
  date: string          // ISO date string (YYYY-MM-DD)
  clockIn: string       // ISO datetime string
  clockOut: string | null
  note: string | null
  editReason: string | null
  editedAt: string | null
  imputations: ImputationData[]
}

export interface ImputationData {
  id: string
  timeEntryId: string
  objectiveId: string | null
  objectiveLabel: string | null
  clientId: string | null
  clientName: string | null
  hours: number
  description: string | null
}
```

- [ ] **Step 2: Añadir `getTodayEntry`**

```typescript
export async function getTodayEntry(
  workspaceId: string,
  userId: string
): Promise<TimeEntryData | null> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const entry = await db.timeEntry.findFirst({
    where: {
      workspaceId,
      userId,
      date: today,
    },
    include: {
      imputations: {
        include: {
          objective: { select: { id: true, label: true } },
          client: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!entry) return null
  return serializeEntry(entry)
}
```

- [ ] **Step 3: Añadir `clockIn`**

```typescript
export async function clockIn(
  workspaceId: string,
  userId: string
): Promise<TimeEntryData> {
  const now = new Date()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  // Verificar que no hay fichaje abierto hoy
  const existing = await db.timeEntry.findFirst({
    where: { workspaceId, userId, date: today },
  })
  if (existing) throw new Error('Ya existe un fichaje para hoy')

  const entry = await db.timeEntry.create({
    data: {
      workspaceId,
      userId,
      date: today,
      clockIn: now,
    },
    include: { imputations: true },
  })

  revalidatePath(`/workspace/${workspaceId}/today`)
  revalidatePath(`/workspace/${workspaceId}/timelog`)
  return serializeEntry(entry)
}
```

- [ ] **Step 4: Añadir `clockOut`**

```typescript
export async function clockOut(
  workspaceId: string,
  userId: string
): Promise<TimeEntryData> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const entry = await db.timeEntry.findFirst({
    where: { workspaceId, userId, date: today, clockOut: null },
  })
  if (!entry) throw new Error('No hay fichaje abierto hoy')

  const updated = await db.timeEntry.update({
    where: { id: entry.id },
    data: { clockOut: new Date() },
    include: { imputations: true },
  })

  revalidatePath(`/workspace/${workspaceId}/today`)
  revalidatePath(`/workspace/${workspaceId}/timelog`)
  return serializeEntry(updated)
}
```

- [ ] **Step 5: Añadir `getWeekEntries`**

```typescript
export async function getWeekEntries(
  workspaceId: string,
  userId: string,
  weekStart: Date
): Promise<TimeEntryData[]> {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const entries = await db.timeEntry.findMany({
    where: {
      workspaceId,
      userId,
      date: { gte: weekStart, lte: weekEnd },
    },
    include: {
      imputations: {
        include: {
          objective: { select: { id: true, label: true } },
          client: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { date: 'asc' },
  })

  return entries.map(serializeEntry)
}
```

- [ ] **Step 6: Añadir `updateEntry`**

```typescript
export async function updateEntry(
  entryId: string,
  workspaceId: string,
  data: { clockIn: string; clockOut: string; editReason: string }
): Promise<TimeEntryData> {
  const clockIn = new Date(data.clockIn)
  const clockOut = new Date(data.clockOut)

  if (clockOut <= clockIn) {
    throw new Error('La hora de salida debe ser posterior a la entrada')
  }

  const updated = await db.timeEntry.update({
    where: { id: entryId },
    data: {
      clockIn,
      clockOut,
      editReason: data.editReason,
      editedAt: new Date(),
    },
    include: {
      imputations: {
        include: {
          objective: { select: { id: true, label: true } },
          client: { select: { id: true, name: true } },
        },
      },
    },
  })

  revalidatePath(`/workspace/${workspaceId}/timelog`)
  revalidatePath(`/workspace/${workspaceId}/today`)
  return serializeEntry(updated)
}
```

- [ ] **Step 7: Añadir `deleteEntry`**

```typescript
export async function deleteEntry(
  entryId: string,
  workspaceId: string
): Promise<void> {
  await db.timeEntry.delete({ where: { id: entryId } })
  revalidatePath(`/workspace/${workspaceId}/timelog`)
  revalidatePath(`/workspace/${workspaceId}/today`)
}
```

- [ ] **Step 8: Añadir `addImputation`**

```typescript
export async function addImputation(data: {
  timeEntryId: string
  workspaceId: string
  objectiveId?: string
  clientId?: string
  hours: number
  description?: string
}): Promise<ImputationData> {
  const imp = await db.timeImputation.create({
    data: {
      timeEntryId: data.timeEntryId,
      objectiveId: data.objectiveId ?? null,
      clientId: data.clientId ?? null,
      hours: data.hours,
      description: data.description ?? null,
    },
    include: {
      objective: { select: { id: true, label: true } },
      client: { select: { id: true, name: true } },
    },
  })

  revalidatePath(`/workspace/${data.workspaceId}/timelog`)
  return serializeImputation(imp)
}
```

- [ ] **Step 9: Añadir `deleteImputation`**

```typescript
export async function deleteImputation(
  imputationId: string,
  workspaceId: string
): Promise<void> {
  await db.timeImputation.delete({ where: { id: imputationId } })
  revalidatePath(`/workspace/${workspaceId}/timelog`)
}
```

- [ ] **Step 10: Añadir funciones de serialización al final del fichero**

```typescript
// ── Helpers de serialización ─────────────────────────────────

type EntryWithImputations = Awaited<ReturnType<typeof db.timeEntry.findFirst>> & {
  imputations: Array<{
    id: string
    timeEntryId: string
    objectiveId: string | null
    clientId: string | null
    hours: { toNumber(): number }
    description: string | null
    objective: { id: string; label: string } | null
    client: { id: string; name: string } | null
  }>
}

function serializeEntry(entry: NonNullable<EntryWithImputations>): TimeEntryData {
  return {
    id: entry.id,
    date: entry.date.toISOString().slice(0, 10),
    clockIn: entry.clockIn.toISOString(),
    clockOut: entry.clockOut?.toISOString() ?? null,
    note: entry.note,
    editReason: entry.editReason,
    editedAt: entry.editedAt?.toISOString() ?? null,
    imputations: entry.imputations.map(serializeImputation),
  }
}

function serializeImputation(imp: {
  id: string
  timeEntryId: string
  objectiveId: string | null
  clientId: string | null
  hours: { toNumber(): number }
  description: string | null
  objective?: { id: string; label: string } | null
  client?: { id: string; name: string } | null
}): ImputationData {
  return {
    id: imp.id,
    timeEntryId: imp.timeEntryId,
    objectiveId: imp.objectiveId,
    objectiveLabel: imp.objective?.label ?? null,
    clientId: imp.clientId,
    clientName: imp.client?.name ?? null,
    hours: imp.hours.toNumber(),
    description: imp.description,
  }
}
```

- [ ] **Step 11: Verificar tipos**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | Select-Object -First 20
```

Resultado esperado: sin errores en `timelog.ts`.

- [ ] **Step 12: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add apps/web/src/app/actions/timelog.ts
git commit -m "feat(actions): add timelog server actions (clockIn, clockOut, CRUD entries and imputations)"
```

---

## Task 3: ClockWidget en "Mi día"

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/today/_components/ClockWidget.tsx`
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/today/page.tsx`

- [ ] **Step 1: Crear ClockWidget.tsx**

```typescript
'use client'

import { useState, useEffect, useTransition } from 'react'
import { clockIn, clockOut } from '@/app/actions/timelog'
import type { TimeEntryData } from '@/app/actions/timelog'

interface Props {
  workspaceId: string
  initialEntry: TimeEntryData | null
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ClockWidget({ workspaceId, initialEntry }: Props) {
  const [entry, setEntry] = useState<TimeEntryData | null>(initialEntry)
  const [elapsed, setElapsed] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Actualizar contador cada minuto si hay fichaje abierto
  useEffect(() => {
    if (!entry || entry.clockOut) {
      setElapsed('')
      return
    }
    const update = () => {
      const ms = Date.now() - new Date(entry.clockIn).getTime()
      setElapsed(formatDuration(ms))
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [entry])

  function handleClockIn() {
    setError(null)
    startTransition(async () => {
      try {
        const result = await clockIn(workspaceId, (await import('@/lib/auth').then(m => m.requireUser()).catch(() => null))?.id ?? '')
        setEntry(result)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al fichar')
      }
    })
  }

  function handleClockOut() {
    setError(null)
    startTransition(async () => {
      try {
        const result = await clockOut(workspaceId, '')
        setEntry(result)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al fichar salida')
      }
    })
  }

  const isOpen = entry && !entry.clockOut

  return (
    <div className="rounded-xl border bg-card px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
        <div>
          {!entry && (
            <p className="text-sm font-medium">Sin fichar</p>
          )}
          {isOpen && (
            <>
              <p className="text-sm font-medium">Trabajando · <span className="text-muted-foreground">{elapsed}</span></p>
              <p className="text-xs text-muted-foreground">Entrada: {formatTime(entry.clockIn)}</p>
            </>
          )}
          {entry && entry.clockOut && (
            <>
              <p className="text-sm font-medium">
                {formatTime(entry.clockIn)} → {formatTime(entry.clockOut)}
                {' · '}
                {formatDuration(new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime())}
              </p>
              <p className="text-xs text-muted-foreground">Jornada completada</p>
            </>
          )}
          {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!entry && (
          <button
            onClick={handleClockIn}
            disabled={isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {isPending ? 'Fichando...' : 'Fichar entrada'}
          </button>
        )}
        {isOpen && (
          <button
            onClick={handleClockOut}
            disabled={isPending}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted/30 disabled:opacity-60 transition-colors"
          >
            {isPending ? 'Fichando...' : 'Fichar salida'}
          </button>
        )}
        {entry && entry.clockOut && (
          <a
            href={`/workspace/${workspaceId}/timelog`}
            className="text-xs text-primary hover:underline"
          >
            Ver historial →
          </a>
        )}
      </div>
    </div>
  )
}
```

**Nota importante:** el `ClockWidget` necesita el `userId` para llamar a las server actions. Las server actions de `timelog.ts` deben obtenerlo internamente desde la sesión Clerk, NO recibirlo como parámetro del cliente (seguridad). Modifica `clockIn` y `clockOut` en `timelog.ts` para que NO reciban `userId` como parámetro, sino que lo obtengan internamente:

```typescript
// En timelog.ts, añadir al inicio:
import { auth } from '@clerk/nextjs/server'

// clockIn modificado — sin parámetro userId:
export async function clockIn(workspaceId: string): Promise<TimeEntryData> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('No autenticado')
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) throw new Error('Usuario no encontrado')
  const userId = user.id
  // ... resto igual
}

// clockOut modificado — sin parámetro userId:
export async function clockOut(workspaceId: string): Promise<TimeEntryData> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('No autenticado')
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) throw new Error('Usuario no encontrado')
  const userId = user.id
  // ... resto igual
}
```

Y simplificar el `ClockWidget` para que no pase userId:

```typescript
// handleClockIn simplificado:
async function handleClockIn() {
  setError(null)
  startTransition(async () => {
    try {
      const result = await clockIn(workspaceId)
      setEntry(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al fichar')
    }
  })
}

// handleClockOut simplificado:
async function handleClockOut() {
  setError(null)
  startTransition(async () => {
    try {
      const result = await clockOut(workspaceId)
      setEntry(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al fichar salida')
    }
  })
}
```

- [ ] **Step 2: Modificar today/page.tsx para añadir ClockWidget**

Abre `apps/web/src/app/(dashboard)/workspace/[workspaceId]/today/page.tsx`.

Añade el import al inicio del fichero:

```typescript
import { ClockWidget } from './_components/ClockWidget'
import { getTodayEntry } from '@/app/actions/timelog'
```

Modifica el cuerpo de `TodayPage` para obtener el entry en paralelo con `getTodayData`:

```typescript
export default async function TodayPage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])
  const [data, todayEntry] = await Promise.all([
    getTodayData(workspaceId, user.id),
    getTodayEntry(workspaceId, user.id),
  ])

  const isEmpty = data.pendingSteps.length === 0 && data.pendingWorkflows.length === 0

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

      <div>
        <h1 className="text-2xl font-semibold">{greeting()}, {user.name?.split(' ')[0] ?? 'equipo'}</h1>
        <p className="text-sm text-muted-foreground mt-0.5 capitalize">{todayLabel()}</p>
      </div>

      <ClockWidget workspaceId={workspaceId} initialEntry={todayEntry} />

      {/* ... resto igual ... */}
    </div>
  )
}
```

- [ ] **Step 3: Verificar tipos**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | Select-Object -First 20
```

- [ ] **Step 4: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/today/"
git add apps/web/src/app/actions/timelog.ts
git commit -m "feat(today): add ClockWidget with live timer and clock in/out"
```

---

## Task 4: Icono de reloj + ítem "Control horario" en sidebar

**Files:**
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx`
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx`

- [ ] **Step 1: Añadir icono `timelog` en WorkspaceIcons.tsx**

Abre `WorkspaceIcons.tsx`. Localiza el objeto `Icons` y añade la propiedad `timelog` junto a los otros iconos SVG:

```tsx
timelog: (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
),
```

- [ ] **Step 2: Añadir ítem en layout.tsx**

Abre `layout.tsx`. Localiza el array `mainItems` y añade "Control horario" como segundo ítem (después de "Mi día"):

```typescript
{
  label: 'Control horario',
  href: `${base}/timelog`,
  icon: Icons.timelog,
  description: 'Fichaje de entrada/salida e imputación de horas por proyecto',
},
```

- [ ] **Step 3: Verificar tipos**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | Select-Object -First 10
```

- [ ] **Step 4: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx"
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx"
git commit -m "feat(nav): add Control horario sidebar item with clock icon"
```

---

## Task 5: Página /timelog — estructura base

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/timelog/page.tsx`

- [ ] **Step 1: Crear la página Server Component**

```typescript
import { requireUser } from '@/lib/auth'
import { getWeekEntries, getTodayEntry } from '@/app/actions/timelog'
import { ClockWidget } from '../today/_components/ClockWidget'
import { WeekTable } from './_components/WeekTable'

interface Props {
  params: Promise<{ workspaceId: string }>
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function TimelogPage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const weekStart = getMonday(new Date())

  const [entries, todayEntry] = await Promise.all([
    getWeekEntries(workspaceId, user.id, weekStart),
    getTodayEntry(workspaceId, user.id),
  ])

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Control horario</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Registro de jornada e imputación de horas</p>
      </div>

      <ClockWidget workspaceId={workspaceId} initialEntry={todayEntry} />

      <WeekTable
        workspaceId={workspaceId}
        initialEntries={entries}
        weekStart={weekStart.toISOString()}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit parcial**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/timelog/page.tsx"
git commit -m "feat(timelog): add timelog page skeleton"
```

---

## Task 6: WeekTable — historial semanal navegable

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/timelog/_components/WeekTable.tsx`
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/timelog/_components/EditEntryModal.tsx`

- [ ] **Step 1: Crear EditEntryModal.tsx**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { updateEntry } from '@/app/actions/timelog'
import type { TimeEntryData } from '@/app/actions/timelog'

interface Props {
  entry: TimeEntryData
  workspaceId: string
  onClose: () => void
  onSaved: (updated: TimeEntryData) => void
}

export function EditEntryModal({ entry, workspaceId, onClose, onSaved }: Props) {
  const toTimeInput = (iso: string) => {
    const d = new Date(iso)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  const baseDate = entry.clockIn.slice(0, 10)

  const [clockInTime, setClockInTime] = useState(toTimeInput(entry.clockIn))
  const [clockOutTime, setClockOutTime] = useState(entry.clockOut ? toTimeInput(entry.clockOut) : '')
  const [editReason, setEditReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    if (!editReason.trim()) { setError('El motivo de corrección es obligatorio'); return }
    if (!clockOutTime) { setError('Indica la hora de salida'); return }

    setError(null)
    startTransition(async () => {
      try {
        const clockInISO = `${baseDate}T${clockInTime}:00`
        const clockOutISO = `${baseDate}T${clockOutTime}:00`
        const updated = await updateEntry(entry.id, workspaceId, {
          clockIn: clockInISO,
          clockOut: clockOutISO,
          editReason,
        })
        onSaved(updated)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al guardar')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-lg space-y-4">
        <h2 className="text-base font-semibold">Editar fichaje</h2>
        <p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Entrada</label>
            <input type="time" value={clockInTime} onChange={e => setClockInTime(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Salida</label>
            <input type="time" value={clockOutTime} onChange={e => setClockOutTime(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Motivo de corrección *</label>
          <input type="text" value={editReason} onChange={e => setEditReason(e.target.value)}
            placeholder="ej. Olvidé fichar la salida"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-muted/30 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={isPending}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Crear WeekTable.tsx**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { getWeekEntries, deleteEntry } from '@/app/actions/timelog'
import type { TimeEntryData } from '@/app/actions/timelog'
import { EditEntryModal } from './EditEntryModal'
import { ImputationPanel } from './ImputationPanel'

interface Props {
  workspaceId: string
  initialEntries: TimeEntryData[]
  weekStart: string  // ISO string del lunes
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(entry: TimeEntryData): string {
  if (!entry.clockOut) return '—'
  const ms = new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()
  const totalMinutes = Math.floor(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

function getMondayOf(iso: string): Date {
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function WeekTable({ workspaceId, initialEntries, weekStart }: Props) {
  const [monday, setMonday] = useState<Date>(getMondayOf(weekStart))
  const [entries, setEntries] = useState<TimeEntryData[]>(initialEntries)
  const [editingEntry, setEditingEntry] = useState<TimeEntryData | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const sunday = addDays(monday, 6)

  function navigateWeek(delta: number) {
    startTransition(async () => {
      const newMonday = addDays(monday, delta * 7)
      setMonday(newMonday)
      const data = await getWeekEntries(workspaceId, '', newMonday)
      setEntries(data)
    })
  }

  function handleDeleted(entryId: string) {
    startTransition(async () => {
      await deleteEntry(entryId, workspaceId)
      setEntries(prev => prev.filter(e => e.id !== entryId))
    })
  }

  function handleSaved(updated: TimeEntryData) {
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
    setEditingEntry(null)
  }

  // Calcular total semanal
  const totalMs = entries.reduce((acc, e) => {
    if (!e.clockOut) return acc
    return acc + (new Date(e.clockOut).getTime() - new Date(e.clockIn).getTime())
  }, 0)
  const totalH = Math.floor(totalMs / 3600000)
  const totalM = Math.floor((totalMs % 3600000) / 60000)

  // Construir los 7 días de la semana
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i)
    const dateStr = date.toISOString().slice(0, 10)
    const entry = entries.find(e => e.date === dateStr) ?? null
    return { date, dateStr, entry, dayName: DAY_NAMES[i] }
  })

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Semana del {monday.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} al {sunday.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={() => navigateWeek(-1)} disabled={isPending}
            className="text-xs px-2 py-1 rounded border hover:bg-muted/30 disabled:opacity-50">← Anterior</button>
          <button onClick={() => navigateWeek(1)} disabled={isPending}
            className="text-xs px-2 py-1 rounded border hover:bg-muted/30 disabled:opacity-50">Siguiente →</button>
        </div>
      </div>

      <div className="rounded-xl border bg-card divide-y overflow-hidden">
        {days.map(({ date, dateStr, entry, dayName }) => {
          const isWeekend = date.getDay() === 0 || date.getDay() === 6
          const isExpanded = expandedId === entry?.id
          return (
            <div key={dateStr}>
              <div className={`flex items-center gap-4 px-4 py-3 ${isWeekend ? 'opacity-50' : ''}`}>
                <div className="w-12 shrink-0">
                  <p className="text-xs font-medium">{dayName}</p>
                  <p className="text-xs text-muted-foreground">{date.getDate()}</p>
                </div>
                <div className="flex-1 min-w-0">
                  {entry ? (
                    <div className="flex items-center gap-3 text-sm">
                      <span>{formatTime(entry.clockIn)}</span>
                      <span className="text-muted-foreground">→</span>
                      <span>{entry.clockOut ? formatTime(entry.clockOut) : <span className="text-green-600 dark:text-green-400">En curso</span>}</span>
                      <span className="text-muted-foreground">{formatDuration(entry)}</span>
                      {entry.imputations.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{entry.imputations.length} imput.</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">{isWeekend ? '—' : 'Sin fichar'}</span>
                  )}
                </div>
                {entry && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="text-xs text-primary hover:underline"
                    >
                      {isExpanded ? 'Cerrar' : 'Imputaciones'}
                    </button>
                    <button onClick={() => setEditingEntry(entry)} className="text-xs text-muted-foreground hover:text-foreground">✏️</button>
                    <button onClick={() => handleDeleted(entry.id)} disabled={isPending}
                      className="text-xs text-destructive hover:text-destructive/80 disabled:opacity-50">🗑️</button>
                  </div>
                )}
              </div>
              {isExpanded && entry && (
                <div className="border-t bg-muted/10">
                  <ImputationPanel
                    workspaceId={workspaceId}
                    entry={entry}
                    onUpdated={(updated) => setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))}
                  />
                </div>
              )}
            </div>
          )
        })}

        <div className="flex items-center gap-4 px-4 py-3 bg-muted/20">
          <div className="w-12 shrink-0">
            <p className="text-xs font-semibold">Total</p>
          </div>
          <p className="text-sm font-semibold">{totalH}h {totalM.toString().padStart(2, '0')}m</p>
        </div>
      </div>

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          workspaceId={workspaceId}
          onClose={() => setEditingEntry(null)}
          onSaved={handleSaved}
        />
      )}
    </section>
  )
}
```

**Nota:** `getWeekEntries` en el cliente no puede obtener el userId internamente (es una server action, pero el userId debe venir de la sesión). Modifica `getWeekEntries` en `timelog.ts` para obtener el userId desde Clerk internamente, igual que `clockIn`/`clockOut`:

```typescript
export async function getWeekEntries(
  workspaceId: string,
  weekStart: Date
): Promise<TimeEntryData[]> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('No autenticado')
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) throw new Error('Usuario no encontrado')
  // ... resto igual con user.id
}
```

Actualiza la llamada en `timelog/page.tsx` y en `WeekTable.tsx` eliminando el parámetro `userId`.

- [ ] **Step 3: Verificar tipos**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | Select-Object -First 20
```

- [ ] **Step 4: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/timelog/"
git commit -m "feat(timelog): add WeekTable with navigation, edit modal, and entry deletion"
```

---

## Task 7: ImputationPanel

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/timelog/_components/ImputationPanel.tsx`

- [ ] **Step 1: Crear ImputationPanel.tsx**

Este componente necesita la lista de misiones y clientes para los selectores. Se los pasa desde el Server Component o los carga via server action. Para mantenerlo simple, añade una server action `getImputationOptions` que devuelva misiones activas y clientes del workspace:

Añade en `timelog.ts`:

```typescript
export interface ImputationOption {
  objectives: { id: string; label: string; clientName: string | null }[]
  clients: { id: string; name: string }[]
}

export async function getImputationOptions(workspaceId: string): Promise<ImputationOption> {
  const [objectives, clients] = await Promise.all([
    db.companyObjective.findMany({
      where: { workspaceId, status: 'active' },
      select: { id: true, label: true, client: { select: { name: true } } },
      orderBy: { label: 'asc' },
      take: 50,
    }),
    db.client.findMany({
      where: { workspaceId, isArchived: false },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: 50,
    }),
  ])

  return {
    objectives: objectives.map(o => ({
      id: o.id,
      label: o.label,
      clientName: o.client?.name ?? null,
    })),
    clients: clients.map(c => ({ id: c.id, name: c.name })),
  }
}
```

- [ ] **Step 2: Crear el componente**

```typescript
'use client'

import { useState, useEffect, useTransition } from 'react'
import { addImputation, deleteImputation, getImputationOptions } from '@/app/actions/timelog'
import type { TimeEntryData, ImputationData, ImputationOption } from '@/app/actions/timelog'

interface Props {
  workspaceId: string
  entry: TimeEntryData
  onUpdated: (updated: TimeEntryData) => void
}

export function ImputationPanel({ workspaceId, entry, onUpdated }: Props) {
  const [options, setOptions] = useState<ImputationOption | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [objectiveId, setObjectiveId] = useState('')
  const [clientId, setClientId] = useState('')
  const [hours, setHours] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getImputationOptions(workspaceId).then(setOptions)
  }, [workspaceId])

  function handleAdd() {
    const h = parseFloat(hours)
    if (isNaN(h) || h <= 0 || h > 24) { setError('Horas inválidas (0.5 – 24)'); return }
    setError(null)
    startTransition(async () => {
      try {
        const imp = await addImputation({
          timeEntryId: entry.id,
          workspaceId,
          objectiveId: objectiveId || undefined,
          clientId: clientId || undefined,
          hours: h,
          description: description || undefined,
        })
        onUpdated({ ...entry, imputations: [...entry.imputations, imp] })
        setShowForm(false)
        setObjectiveId('')
        setClientId('')
        setHours('')
        setDescription('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al añadir')
      }
    })
  }

  function handleDelete(impId: string) {
    startTransition(async () => {
      await deleteImputation(impId, workspaceId)
      onUpdated({ ...entry, imputations: entry.imputations.filter(i => i.id !== impId) })
    })
  }

  return (
    <div className="px-4 py-3 space-y-3">
      {entry.imputations.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground">Sin imputaciones para este día.</p>
      )}

      {entry.imputations.map((imp) => (
        <div key={imp.id} className="flex items-center gap-3 text-sm">
          <div className="flex-1 min-w-0">
            <span className="font-medium">{imp.hours}h</span>
            {imp.objectiveLabel && <span className="text-muted-foreground"> · {imp.objectiveLabel}</span>}
            {imp.clientName && <span className="text-muted-foreground"> · {imp.clientName}</span>}
            {imp.description && <span className="text-muted-foreground"> — {imp.description}</span>}
          </div>
          <button onClick={() => handleDelete(imp.id)} disabled={isPending}
            className="text-xs text-destructive hover:text-destructive/80 disabled:opacity-50 shrink-0">
            🗑️
          </button>
        </div>
      ))}

      {showForm && (
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Misión (opcional)</label>
              <select value={objectiveId} onChange={e => setObjectiveId(e.target.value)}
                className="w-full rounded-lg border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Sin misión</option>
                {options?.objectives.map(o => (
                  <option key={o.id} value={o.id}>{o.label}{o.clientName ? ` (${o.clientName})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Cliente (opcional)</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)}
                className="w-full rounded-lg border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Sin cliente</option>
                {options?.clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Horas *</label>
              <input type="number" min="0.5" max="24" step="0.5" value={hours}
                onChange={e => setHours(e.target.value)}
                placeholder="ej. 2.5"
                className="w-full rounded-lg border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Descripción</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="ej. Reunión de kick-off"
                className="w-full rounded-lg border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)}
              className="text-xs px-3 py-1.5 rounded border hover:bg-muted/30 transition-colors">
              Cancelar
            </button>
            <button onClick={handleAdd} disabled={isPending}
              className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {isPending ? 'Añadiendo...' : 'Añadir'}
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="text-xs text-primary hover:underline">
          + Añadir imputación
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verificar tipos**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | Select-Object -First 20
```

- [ ] **Step 4: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/timelog/"
git add apps/web/src/app/actions/timelog.ts
git commit -m "feat(timelog): add ImputationPanel with add/delete imputations"
```

---

## Task 8: Deploy y verificación

**Files:** ninguno (solo deploy)

- [ ] **Step 1: Verificación final de tipos**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | Select-Object -First 20
```

Resultado esperado: sin errores.

- [ ] **Step 2: Deploy a producción**

```powershell
cd C:\Users\priet\protools-hub
npx vercel deploy --prod
```

Resultado esperado: URL de producción `https://www.mitikus.com`.

- [ ] **Step 3: Verificar en producción**

Abre `https://www.mitikus.com`. Navega a cualquier workspace:
- ✅ "Control horario" aparece como segundo ítem en sidebar
- ✅ "Mi día" muestra el widget de fichaje
- ✅ La página `/timelog` carga sin errores
- ✅ Botón "Fichar entrada" funciona
- ✅ Aparece el contador "Llevas Xh Ym" tras fichar
- ✅ Botón "Fichar salida" cierra el fichaje
- ✅ La tabla semanal muestra el fichaje del día
- ✅ El botón editar abre el modal con campos de hora y motivo

---

## Notas para el implementador

### Patrón de autenticación en server actions

En este proyecto las server actions que leen datos del usuario deben obtener el `userId` de Clerk internamente, NO recibirlo como parámetro del cliente:

```typescript
import { auth } from '@clerk/nextjs/server'

export async function miAction(workspaceId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('No autenticado')
  const user = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) throw new Error('No encontrado')
  // Usa user.id para las queries
}
```

Las acciones que reciben `userId` como parámetro de Server Components del mismo servidor (como `getTodayEntry` y `getWeekEntries` llamadas desde el layout) pueden seguir recibiéndolo, siempre que el componente lo pase desde `requireUser()`, no desde el cliente.

### `@db.Date` en Prisma

El campo `date DateTime @db.Date` almacena solo la fecha (sin hora) en PostgreSQL. Al comparar:
```typescript
const today = new Date()
today.setHours(0, 0, 0, 0)
// Usar directamente en la query — Prisma lo convierte a DATE en PostgreSQL
```

### Serialización de Decimal

Prisma devuelve los campos `Decimal` como objetos con `.toNumber()`. La serialización en `serializeEntry` ya lo maneja. No convertir a string directamente.
