# ProTools Hub — Documentación Oficial

## Documento 13 — Analytics y Audit Trail

---

**Versión del documento:** 1.0  
**Fecha:** 2026-06-29  
**Estado:** Publicado  
**Archivos fuente:** `apps/web/src/lib/audit.ts`, páginas de analytics/audit/usage

---

## Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Analytics — Métricas de Uso](#2-analytics--métricas-de-uso)
3. [Audit Trail — Rastro de Auditoría](#3-audit-trail--rastro-de-auditoría)
4. [IA Usage — Consumo de IA](#4-ia-usage--consumo-de-ia)
5. [Los 44 Tipos de Acción del Audit](#5-los-44-tipos-de-acción-del-audit)
6. [Fire-and-Forget Pattern](#6-fire-and-forget-pattern)
7. [Consultas de Reporting](#7-consultas-de-reporting)

---

## 1. Visión General

ProTools Hub tiene tres capas de observabilidad complementarias:

| Capa | Modelo DB | Página | Propósito |
|---|---|---|---|
| **Analytics** | `ToolExecution` + `WorkflowExecution` | `/analytics` | Métricas de negocio y uso de herramientas |
| **Audit Trail** | `AuditLog` | `/audit` | Rastro inmutable de acciones para compliance |
| **IA Usage** | `AIUsage` | `/usage` | Consumo de tokens y costes de IA |

Cada capa sirve a un público diferente:
- **Analytics:** Directores y managers — ¿Qué usamos más? ¿Qué genera más valor?
- **Audit:** Auditores y compliance — ¿Quién hizo qué y cuándo?
- **Usage:** Administradores — ¿Cuánto gastamos en IA?

---

## 2. Analytics — Métricas de Uso

**Página:** `apps/web/src/app/(dashboard)/workspace/[workspaceId]/analytics/`

### Métricas Principales

| Métrica | Cálculo | Modelo |
|---|---|---|
| Total de ejecuciones | COUNT ToolExecution | ToolExecution |
| Tasa de éxito | COMPLETED / total | ToolExecution |
| Herramientas más usadas | COUNT by toolInstanceId | ToolExecution |
| Coste total IA | SUM estimatedCostEUR | ToolExecution |
| Workflows ejecutados | COUNT WorkflowExecution | WorkflowExecution |
| Tiempo medio de ejecución | AVG durationMs | ToolExecution |
| Registros creados | COUNT ToolRecord | ToolRecord |

### Componentes de UI

**MetricCard** — Tarjeta de métrica numérica:
```typescript
interface MetricCardProps {
  label:     string
  value:     number | string
  trend?:    number      // positivo = verde, negativo = rojo
  suffix?:   string      // "€", "ms", "%"
}
```

**BarChart** — Gráfico de barras para distribución por herramienta:
- Eje X: herramientas (top 10)
- Eje Y: número de ejecuciones

**DonutChart** — Distribución por categoría o estado:
- COMPLETED vs FAILED
- Por dominio de herramienta

**HorizontalBarList** — Ranking de herramientas más usadas:
- Herramienta + barra de uso relativo + número de ejecuciones

**AnalyticsInsights** — Insights generados con IA:
- Detecta patrones en los datos
- Sugiere herramientas no utilizadas
- Alerta sobre tasas de error altas

**RangeSelector** — Selector de período:
```typescript
type DateRange = '7d' | '30d' | '90d' | '1y' | 'custom'
```

### Query de Analytics

```typescript
// Carga de datos del server component
const [executions, workflowExecutions, records] = await Promise.all([
  db.toolExecution.findMany({
    where: {
      workspaceId,
      createdAt: { gte: rangeStart },
    },
    select: {
      status: true,
      estimatedCostEUR: true,
      durationMs: true,
      createdAt: true,
      toolInstance: {
        select: { name: true, toolDefinition: { select: { category: true } } }
      },
    },
  }),
  db.workflowExecution.findMany({ where: { workspaceId, ... } }),
  db.toolRecord.count({ where: { toolInstance: { workspaceId } } }),
])
```

---

## 3. Audit Trail — Rastro de Auditoría

**Página:** `apps/web/src/app/(dashboard)/workspace/[workspaceId]/audit/`

### Qué Registra el Audit

El `AuditLog` registra **toda acción relevante** en el sistema. Las acciones se clasifican por `entityType`:

| Entity Type | Acciones registradas |
|---|---|
| `tool_instance` | install, uninstall, archive |
| `tool_execution` | execute, execute.fail, rate_limited |
| `tool_record` | create, delete, view |
| `workflow` | create, update, delete, execute, execute.fail |
| `workspace` | create, update, delete, member.invite, member.remove |
| `client` | create, update, archive |
| `import` | start, complete, fail |
| `memory` | profile.update, objective.create, asset.create, process.create, risk.create |
| `copilot` | start, message, plan.select, workflow.generate |
| `auth` | denied |
| `permission` | denied |
| `rate_limit` | exceeded |

### Campos del AuditLog

```typescript
{
  id:            string    // CUID
  orgId:         string    // Organización
  workspaceId:   string?   // Workspace (si aplica)
  actorUserId:   string?   // Usuario que realizó la acción
  action:        string    // "tool.execute"
  entityType:    string    // "tool_execution"
  entityId:      string?   // ID de la entidad
  result:        string    // "success" | "failure" | "denied"
  metadata:      Json?     // Datos adicionales
  ipHint:        string?   // IP del cliente (para seguridad)
  userAgentHint: string?   // User agent
  createdAt:     DateTime  // Inmutable
}
```

### Componentes de UI del Audit

**AuditTimeline** — Lista cronológica de eventos:
- Ordenada descendente (más reciente primero)
- Paginación de 50 eventos por página
- Carga incremental

**AuditFilters** — Panel de filtros:
- Por tipo de acción
- Por tipo de entidad
- Por resultado (success/failure/denied)
- Por actor (usuario)
- Por rango de fechas

**AuditEventRow** — Fila de un evento:
- Icono del resultado (✓ ✗ ⚠)
- Acción + entidad
- Actor (nombre del usuario)
- Timestamp relativo + absoluto al hover
- Botón de expandir metadata

**AuditEntityBadge** — Badge de tipo de entidad:
```typescript
const colors: Record<string, string> = {
  tool_instance:  'bg-blue-100 text-blue-700',
  workflow:       'bg-purple-100 text-purple-700',
  workspace:      'bg-green-100 text-green-700',
  ...
}
```

**AuditResultBadge:**
```typescript
const variants: Record<string, string> = {
  success: 'bg-green-100 text-green-700',
  failure: 'bg-red-100 text-red-700',
  denied:  'bg-yellow-100 text-yellow-700',
}
```

---

## 4. IA Usage — Consumo de IA

**Página:** `apps/web/src/app/(dashboard)/workspace/[workspaceId]/usage/`

### Métricas de Usage

| Métrica | Descripción |
|---|---|
| Tokens de entrada (período) | SUM inputTokens |
| Tokens de salida (período) | SUM outputTokens |
| Coste total (período) | SUM estimatedCostEUR |
| Llamadas IA exitosas | COUNT WHERE status='success' |
| Tasa de error | COUNT error / total |
| Distribución por modelo | GROUP BY model |
| Coste por día | GROUP BY date(createdAt) |

### Panel de Admin (AdminPanel)

Visible solo para OWNER/ADMIN. Muestra:
- Límites actuales configurados
- Uso actual vs. límites
- Porcentaje de consumo del período
- Lista de usuarios con más consumo

### Límites y Alertas

El sistema alerta cuando:
- El consumo diario supera el 80% del límite
- Un usuario supera el 50% de su cuota
- El coste estimado supera el umbral configurado

---

## 5. Los 44 Tipos de Acción del Audit

**Archivo:** `apps/web/src/lib/audit.ts`

```typescript
type AuditAction =
  // Herramientas
  | 'tool.view'
  | 'tool.install'
  | 'tool.uninstall'
  | 'tool.fork'
  | 'tool.generate'
  | 'tool.generate.fail'
  | 'tool.publish'
  | 'tool.archive'
  | 'tool.execute'
  | 'tool.execute.fail'
  | 'tool.execute.rate_limited'
  // Registros
  | 'tool.record.create'
  | 'tool.record.delete'
  | 'tool.record.view'
  // Compartir
  | 'tool.share.enable'
  | 'tool.share.disable'
  // Workflows
  | 'workflow.create'
  | 'workflow.update'
  | 'workflow.delete'
  | 'workflow.execute'
  | 'workflow.execute.fail'
  // Workspace
  | 'workspace.create'
  | 'workspace.update'
  | 'workspace.delete'
  | 'workspace.member.invite'
  | 'workspace.member.remove'
  // Clientes
  | 'client.create'
  | 'client.update'
  | 'client.archive'
  // Import
  | 'import.start'
  | 'import.complete'
  | 'import.fail'
  // Registry
  | 'registry.search'
  // Memory
  | 'memory.profile.update'
  | 'memory.objective.create'
  | 'memory.asset.create'
  | 'memory.process.create'
  | 'memory.risk.create'
  // Copilot
  | 'copilot.start'
  | 'copilot.message'
  | 'copilot.plan.select'
  | 'copilot.workflow.generate'
  // Seguridad
  | 'auth.denied'
  | 'permission.denied'
  | 'rate_limit.exceeded'
```

---

## 6. Fire-and-Forget Pattern

**Archivo:** `apps/web/src/lib/audit.ts`

```typescript
export interface AuditInput {
  orgId:        string
  workspaceId?: string
  actorUserId?: string
  action:       AuditAction
  entityType:   string
  entityId?:    string
  result?:      'success' | 'failure' | 'denied'
  metadata?:    Record<string, unknown>
  ipHint?:      string
  userAgentHint?: string
}

export function audit(input: AuditInput): void {
  // Fire-and-forget: no await, no throw
  db.auditLog.create({ data: input }).catch((err) => {
    console.error('[audit] Failed to write audit log:', err)
    // No propaga el error — el flujo principal nunca se interrumpe
  })
}

export function auditDenied(
  input: Omit<AuditInput, 'result'>
): void {
  audit({ ...input, result: 'denied' })
}
```

**Por qué fire-and-forget:**
- Un error en el audit log no debe interrumpir la operación de negocio
- PostgreSQL es altamente disponible — los errores son raros
- El audit es observabilidad, no parte del flujo crítico

**Uso en la codebase:**
```typescript
// En una API Route, después de completar la operación:
void audit({
  orgId: user.orgId,
  workspaceId,
  actorUserId: user.id,
  action: 'tool.execute',
  entityType: 'tool_execution',
  entityId: executionId,
  result: 'success',
  metadata: { model, inputTokens, outputTokens, costEUR },
})
```

---

## 7. Consultas de Reporting

### Audit Export (para auditoras externas)

```typescript
// Exportar todos los eventos de una org en un período
const events = await db.auditLog.findMany({
  where: {
    orgId,
    createdAt: { gte: startDate, lte: endDate },
  },
  include: {
    actorUser: { select: { name: true, email: true } },
  },
  orderBy: { createdAt: 'asc' },
})
```

### Resumen de Costes IA

```typescript
// Coste total por usuario en el período
const costByUser = await db.aIUsage.groupBy({
  by: ['userId'],
  where: {
    orgId,
    createdAt: { gte: startDate },
    status: 'success',
  },
  _sum: { estimatedCostEUR: true, totalTokens: true },
  _count: { id: true },
})
```

### Herramientas Más Usadas

```typescript
const topTools = await db.toolExecution.groupBy({
  by: ['toolInstanceId'],
  where: { workspaceId, status: 'COMPLETED' },
  _count: { id: true },
  _sum: { estimatedCostEUR: true },
  orderBy: { _count: { id: 'desc' } },
  take: 10,
})
```
