# Mi Día Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear la página `/workspace/[id]/today` que agrega en un solo vistazo los pasos de misión pendientes del usuario, sus workflows más relevantes y la actividad del equipo en las últimas 24h.

**Architecture:** Server action `getTodayData` hace 3 queries en paralelo sobre modelos existentes (sin schema nuevo). La página es un Server Component puro. El layout del workspace llama a `getPendingCount` para mostrar un badge numérico en el ítem de sidebar "Mi día".

**Tech Stack:** Next.js 15 App Router (Server Components), Prisma, TypeScript, Tailwind CSS.

---

## Mapa de ficheros

### Nuevos
- `apps/web/src/app/actions/today.ts` — server action con `getTodayData` y `getPendingCount`
- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/today/page.tsx` — página Server Component

### Modificados
- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx` — añadir icono `today`
- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx` — añadir "Mi día" al nav con badge

---

## Task 1: Server action `today.ts`

**Files:**
- Create: `apps/web/src/app/actions/today.ts`

- [ ] **Step 1: Crear el fichero con los tipos e imports**

```typescript
'use server'

import { db } from '@/lib/db'

export interface PendingStep {
  stepId: string
  stepTitle: string
  objectiveId: string
  objectiveLabel: string
  clientName: string | null
}

export interface PendingWorkflow {
  workflowId: string
  workflowName: string
  lastExecutionStatus: string | null  // 'PENDING'|'RUNNING'|'COMPLETED'|'FAILED'|'CANCELLED'|null
  lastExecutionAt: string | null      // ISO string
}

export interface TeamActivityEvent {
  actorName: string
  action: string          // acción en español, construida en el servidor
  entityLabel: string     // nombre legible de la entidad
  timeAgo: string         // "hace 2h", "hace 35m", etc.
  createdAt: string       // ISO string para ordenar
}

export interface TodayData {
  pendingSteps: PendingStep[]
  pendingWorkflows: PendingWorkflow[]
  teamActivity: TeamActivityEvent[]
  pendingCount: number
}
```

- [ ] **Step 2: Añadir la función `getPendingCount` (usada por el layout)**

```typescript
export async function getPendingCount(workspaceId: string, userId: string): Promise<number> {
  const [steps, workflows] = await Promise.all([
    db.missionStep.count({
      where: {
        workspaceId,
        assignedUserId: userId,
        status: { notIn: ['completed', 'skipped'] },
      },
    }),
    db.workflow.count({
      where: {
        workspaceId,
        status: 'PUBLISHED',
        isActive: true,
      },
    }),
  ])
  // El badge es solo pasos pendientes — workflows siempre hay, no queremos badge ruidoso
  return steps
}
```

- [ ] **Step 3: Añadir el helper `formatTimeAgo`**

```typescript
function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'ahora mismo'
  if (diffMin < 60) return `hace ${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `hace ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return `hace ${diffD}d`
}
```

- [ ] **Step 4: Añadir el helper `formatAction`**

```typescript
function formatAction(action: string, entityType: string): string {
  const map: Record<string, string> = {
    'tool.run': 'ejecutó una herramienta',
    'tool.install': 'instaló una herramienta',
    'workflow.executed': 'ejecutó un workflow',
    'workflow.create': 'creó un workflow',
    'mission.step_completed': 'completó un paso de misión',
    'record.create': 'creó un registro',
    'record.update': 'actualizó un registro',
    'client.create': 'añadió un cliente',
  }
  return map[action] ?? `actualizó ${entityType}`
}
```

- [ ] **Step 5: Añadir la función `getTodayData`**

```typescript
export async function getTodayData(workspaceId: string, userId: string): Promise<TodayData> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [rawSteps, rawWorkflows, rawActivity] = await Promise.all([
    // 1. Pasos de misión pendientes asignados al usuario
    db.missionStep.findMany({
      where: {
        workspaceId,
        assignedUserId: userId,
        status: { notIn: ['completed', 'skipped'] },
      },
      select: {
        id: true,
        title: true,
        objectiveId: true,
        objective: {
          select: {
            label: true,
            client: { select: { name: true } },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
      take: 10,
    }),

    // 2. Workflows publicados del workspace con su última ejecución
    db.workflow.findMany({
      where: { workspaceId, status: 'PUBLISHED', isActive: true },
      select: {
        id: true,
        name: true,
        executions: {
          where: { userId },
          select: { status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),

    // 3. Actividad del equipo últimas 24h (excluye al usuario actual)
    db.auditLog.findMany({
      where: {
        workspaceId,
        createdAt: { gte: since24h },
        actorUserId: { not: userId },
        result: 'success',
      },
      select: {
        action: true,
        entityType: true,
        createdAt: true,
        actorUser: { select: { name: true } },
        metadata: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  // Mapear steps
  const pendingSteps: PendingStep[] = rawSteps.map((s) => ({
    stepId: s.id,
    stepTitle: s.title,
    objectiveId: s.objectiveId,
    objectiveLabel: s.objective.label,
    clientName: s.objective.client?.name ?? null,
  }))

  // Mapear workflows
  const pendingWorkflows: PendingWorkflow[] = rawWorkflows.map((w) => {
    const lastExec = w.executions[0] ?? null
    return {
      workflowId: w.id,
      workflowName: w.name,
      lastExecutionStatus: lastExec?.status ?? null,
      lastExecutionAt: lastExec?.createdAt.toISOString() ?? null,
    }
  })

  // Mapear actividad del equipo
  const teamActivity: TeamActivityEvent[] = rawActivity.map((e) => {
    const meta = (e.metadata ?? {}) as Record<string, string>
    const entityLabel = meta.entityName ?? meta.name ?? e.entityType
    return {
      actorName: e.actorUser?.name ?? 'Alguien',
      action: formatAction(e.action, e.entityType),
      entityLabel,
      timeAgo: formatTimeAgo(e.createdAt),
      createdAt: e.createdAt.toISOString(),
    }
  })

  return {
    pendingSteps,
    pendingWorkflows,
    teamActivity,
    pendingCount: pendingSteps.length,
  }
}
```

- [ ] **Step 6: Verificar que compila**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | Select-Object -First 20
```

Salida esperada: sin errores. Si `objective.client` da error de tipos, verificar que en `MissionStep → objective` la relación `client` existe en el select (viene de `CompanyObjective.client` que es `Client?`).

- [ ] **Step 7: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add apps/web/src/app/actions/today.ts
git commit -m "feat(actions): getTodayData and getPendingCount server actions"
```

---

## Task 2: Página `/today/page.tsx`

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/today/page.tsx`

- [ ] **Step 1: Crear el fichero — imports, tipos y helpers de UI**

```typescript
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { getTodayData } from '@/app/actions/today'
import type { PendingStep, PendingWorkflow, TeamActivityEvent } from '@/app/actions/today'

interface Props {
  params: Promise<{ workspaceId: string }>
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function todayLabel(): string {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING:   { label: 'En cola',     className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
  RUNNING:   { label: 'Ejecutando',  className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  COMPLETED: { label: 'Completado',  className: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  FAILED:    { label: 'Fallido',     className: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  CANCELLED: { label: 'Cancelado',   className: 'bg-muted text-muted-foreground' },
}
```

- [ ] **Step 2: Añadir el componente principal**

```typescript
export default async function TodayPage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])
  const data = await getTodayData(workspaceId, user.id)

  const isEmpty = data.pendingSteps.length === 0 && data.pendingWorkflows.length === 0

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-semibold">{greeting()}, {user.name?.split(' ')[0] ?? 'equipo'}</h1>
        <p className="text-sm text-muted-foreground mt-0.5 capitalize">{todayLabel()}</p>
      </div>

      {/* Estado vacío */}
      {isEmpty && (
        <div className="rounded-2xl border border-dashed p-12 flex flex-col items-center text-center gap-3">
          <span className="text-3xl">✅</span>
          <p className="font-medium">Todo al día. Buen trabajo.</p>
          <p className="text-sm text-muted-foreground">No tienes pasos ni workflows pendientes.</p>
        </div>
      )}

      {/* Bloque 1 — Pasos de misión */}
      {data.pendingSteps.length > 0 && (
        <PendingStepsBlock steps={data.pendingSteps} workspaceId={workspaceId} />
      )}

      {/* Bloque 2 — Workflows */}
      {data.pendingWorkflows.length > 0 && (
        <WorkflowsBlock workflows={data.pendingWorkflows} workspaceId={workspaceId} />
      )}

      {/* Bloque 3 — Actividad del equipo */}
      {data.teamActivity.length > 0 && (
        <TeamActivityBlock events={data.teamActivity} />
      )}

    </div>
  )
}
```

- [ ] **Step 3: Añadir el componente `PendingStepsBlock`**

```typescript
function PendingStepsBlock({ steps, workspaceId }: { steps: PendingStep[]; workspaceId: string }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Mis pasos pendientes ({steps.length})
      </h2>
      <div className="rounded-xl border bg-card divide-y overflow-hidden">
        {steps.map((step) => (
          <div key={step.stepId} className="flex items-center gap-4 px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">{step.objectiveLabel}</span>
                <span className="text-muted-foreground/40">›</span>
                <span className="text-sm font-medium truncate">{step.stepTitle}</span>
              </div>
              {step.clientName && (
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  {step.clientName}
                </span>
              )}
            </div>
            <Link
              href={`/workspace/${workspaceId}/missions/${step.objectiveId}`}
              className="shrink-0 text-xs font-medium text-primary hover:underline"
            >
              Ir al paso →
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Añadir el componente `WorkflowsBlock`**

```typescript
function WorkflowsBlock({ workflows, workspaceId }: { workflows: PendingWorkflow[]; workspaceId: string }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Workflows ({workflows.length})
      </h2>
      <div className="rounded-xl border bg-card divide-y overflow-hidden">
        {workflows.map((wf) => {
          const badge = wf.lastExecutionStatus ? statusLabels[wf.lastExecutionStatus] : null
          return (
            <div key={wf.workflowId} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate">{wf.workflowName}</span>
                {badge && (
                  <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${badge.className}`}>
                    {badge.label}
                  </span>
                )}
                {!badge && (
                  <span className="ml-2 text-[10px] text-muted-foreground">Sin ejecutar</span>
                )}
              </div>
              <Link
                href={`/workspace/${workspaceId}/workflows/${wf.workflowId}`}
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                Ejecutar →
              </Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Añadir el componente `TeamActivityBlock`**

```typescript
function TeamActivityBlock({ events }: { events: TeamActivityEvent[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Actividad del equipo hoy
      </h2>
      <div className="rounded-xl border bg-card divide-y overflow-hidden">
        {events.map((event, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3">
            <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              {event.actorName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-sm">
              <span className="font-medium">{event.actorName}</span>
              {' '}{event.action}
              {event.entityLabel && (
                <span className="italic"> "{event.entityLabel}"</span>
              )}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{event.timeAgo}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Verificar que compila**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | Select-Object -First 20
```

Salida esperada: sin errores.

- [ ] **Step 7: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/today/"
git commit -m "feat(ui): Mi dia page with pending steps, workflows and team activity"
```

---

## Task 3: Nav item en sidebar + icono

**Files:**
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx`
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx`

- [ ] **Step 1: Añadir el icono `today` a `WorkspaceIcons.tsx`**

Abre el fichero y añade esta entrada al objeto `Icons`, después de `copilot`:

```typescript
  today: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <line x1="8" y1="14" x2="8.01" y2="14" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  ),
```

- [ ] **Step 2: Actualizar `layout.tsx` — importar `getPendingCount` y añadir el nav item**

Abre `apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx`.

Añade el import al inicio:
```typescript
import { getPendingCount } from '@/app/actions/today'
```

En la función `WorkspaceLayout`, después de obtener el `workspace`, añade la llamada al count en paralelo con lo que ya existe. Busca la línea:
```typescript
const workspace = await db.workspace.findFirst({
```
Y reemplaza el bloque de lookup por:
```typescript
const [workspace, pendingCount] = await Promise.all([
  db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true, name: true },
  }),
  getPendingCount(workspaceId, user.id),
])
```

- [ ] **Step 3: Añadir "Mi día" como primer ítem del nav**

En `layout.tsx`, busca la definición de `mainItems`. Añade "Mi día" como **primer elemento** del array `mainItems`:

```typescript
const mainItems: NavItem[] = [
  {
    label: 'Mi día',
    href: `${base}/today`,
    icon: Icons.today,
    description: 'Tus pendientes del día y actividad del equipo',
    badge: pendingCount > 0 ? String(pendingCount) : undefined,
  },
  {
    label: 'Copilot',
    // ... resto igual
```

- [ ] **Step 4: Verificar que compila**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | Select-Object -First 20
```

Salida esperada: sin errores.

- [ ] **Step 5: Commit**

```powershell
cd C:\Users\priet\protools-hub
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx"
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx"
git commit -m "feat(nav): add Mi dia nav item with pending count badge"
```

---

## Task 4: Deploy y verificación

- [ ] **Step 1: Type-check completo**

```powershell
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit
```

Salida esperada: sin errores.

- [ ] **Step 2: Push y deploy**

```powershell
cd C:\Users\priet\protools-hub
git push
npx vercel deploy --prod 2>&1 | Select-Object -Last 10
```

- [ ] **Step 3: Verificar en producción**

1. Abrir `mitikus.com/workspace/[id]/today`
2. Verificar que aparece el saludo con el nombre del usuario y la fecha
3. Si hay pasos de misión asignados, verificar que aparecen con "Ir al paso →"
4. Verificar que los workflows del workspace aparecen con el estado de la última ejecución
5. Verificar que el feed de equipo muestra actividad de las últimas 24h
6. Verificar que el badge numérico aparece en "Mi día" en la sidebar si hay pendientes
7. Si no hay nada pendiente, verificar que aparece "Todo al día. Buen trabajo."

---

## Self-Review

### Cobertura de spec

| Requisito spec | Task |
|---|---|
| Página `/workspace/[id]/today` | Task 2 |
| Server action `getTodayData` | Task 1 |
| Bloque 1 — pasos pendientes asignados al usuario | Task 1 + Task 2 |
| Bloque 2 — workflows del workspace | Task 1 + Task 2 |
| Bloque 3 — actividad equipo últimas 24h | Task 1 + Task 2 |
| Badge numérico en sidebar | Task 3 |
| "Mi día" como primer ítem del nav | Task 3 |
| Estado vacío "Todo al día. Buen trabajo." | Task 2 |
| Saludo + fecha | Task 2 |
| Máx 10 ítems por bloque | Task 1 (`take: 10`) |
| Máx 20 eventos de actividad | Task 1 (`take: 20`) |
| Chip cliente en paso de misión | Task 1 + Task 2 |

### Consistencia de tipos

- `PendingStep`, `PendingWorkflow`, `TeamActivityEvent`, `TodayData` — definidos en Task 1, usados en Task 2 via import
- `getPendingCount` retorna `Promise<number>`, usado en layout como `pendingCount: number` — consistente
- `NavItem.badge` es `string | undefined` — `String(pendingCount)` o `undefined` — correcto
- `MissionStep.assignedUserId` (campo real en schema), `MissionStep.status` con valores string (`'completed'`, `'skipped'`) — correcto
- `CompanyObjective.label` (no `name`) — correcto según schema
- `WorkflowExecution.status` es enum `ExecutionStatus` — en la query se obtiene como string serializable

### Sin placeholders

Todos los pasos tienen código completo.
