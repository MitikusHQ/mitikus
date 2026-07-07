# ADR-003: Performance & Scalability Audit — SP-ARCH-003

**Status:** Accepted (PERF-1/PERF-2) | RFC Pending (PERF-3)
**Date:** 2026-06-29
**Context:** CTO Performance & Scalability Audit — SUPERPROMPT SP-ARCH-003 v1

---

## Context

Auditoría de rendimiento y escalabilidad con el sistema listo para beta privada (86/100 Production Readiness, post SP-ARCH-002). El objetivo es identificar y corregir los cuellos de botella más impactantes antes de que lleguen usuarios reales.

---

## Hallazgos implementados automáticamente (PERF-1 + PERF-2)

### S-01 / S-02 / S-03 / S-04 — Índices compuestos en schema.prisma

**Problema:** Cuatro patrones de query muy frecuentes usaban índices simples en vez de compuestos, forzando a PostgreSQL a hacer table scans o bitmap AND de dos índices.

| Modelo | Índice anterior | Índice nuevo | Patrón de query cubierto |
|--------|----------------|-------------|--------------------------|
| `ToolRecord` | `(toolInstanceId)`, `(isDeleted)` separados | `(toolInstanceId, isDeleted)` + `(toolInstanceId, isDeleted, createdAt)` | Listado de registros activos de una instancia |
| `ToolInstance` | `(workspaceId)` | `(workspaceId, status)` | Herramientas activas/archivadas por workspace |
| `WorkflowNode` | `(workflowId)` | `(workflowId, isDisabled, executionOrder)` | Carga ordenada de nodos activos por workflow |
| `AIUsage` | `(userId, createdAt)`, `(orgId, createdAt)` | + `(status, createdAt)` | `checkGlobalLimit()` sin filtro user/workspace |

**Impacto esperado:** -40% a -60% en queries de listado bajo carga real. Especialmente relevante en `ToolRecord` que crece con cada ejecución.

**Acción pendiente (requiere acceso a BD):** `npx prisma db push` o `npx prisma migrate dev --name perf-composite-indexes`

---

### W-01 — log() fire-and-forget en workflow-engine.ts

**Problema:** La función `log()` era `async` y se llamaba con `await` — bloqueando la ejecución entre cada nodo. En un workflow de 5 nodos con ~2 logs por nodo, esto añadía ~10 roundtrips a la BD bloqueantes de puro logging observacional.

**Solución:** Convertida a función síncrona que dispara la escritura sin `await`, con `.catch()` silencioso en producción. La ejecución ya no espera a que los logs se escriban.

**Garantía:** El resultado de la ejecución siempre es fiable. Si un log falla (BD sobrecargada, desconexión), la ejecución continúa y el error se reporta en dev.

---

### W-02 — createMany para inicialización de nodos IDLE

**Problema:** Bucle secuencial `await db.workflowNodeExecution.create()` por cada nodo — N roundtrips a la BD en serie.

**Solución:** `db.workflowNodeExecution.createMany({ data: [...] })` — 1 INSERT con N filas en vez de N INSERTs secuenciales.

**Impacto:** Para un workflow de 10 nodos: ~10 roundtrips → 1 roundtrip.

---

### W-03 — Paralelización de update(RUNNING) + workflow load

**Problema:** `executeWorkflow` hacía 3 queries secuenciales al inicio: (1) `update(RUNNING)`, (2) `findUniqueOrThrow(execution)`, (3) `findUniqueOrThrow(workflow)`.

**Solución:** Firma extendida con `workflowId` y `executionVariables` como parámetros (ya disponibles en el call site). Las queries (1) y (3) ahora van en `Promise.all`. La query (2) se elimina completamente.

**Roundtrips eliminados:** 1 SELECT por ejecución de workflow.

---

### W-04 — Pre-fetch de virtual instances antes del loop de nodos

**Problema:** `getOrCreateVirtualInstance()` se llamaba dentro del loop por cada nodo — hasta N queries adicionales de `findFirst` al inicio de cada ToolExecution creation.

**Solución:** Pre-fetch de todas las instancias existentes en 1 `findMany` antes del loop. Las faltantes se crean en batch con `createManyAndReturn`. Se construye un `Map<toolDefinitionId, toolInstanceId>` que se consulta O(1) por nodo.

**Roundtrips eliminados:** De N+M queries (N nodos + M creaciones) a 1-2 queries antes del loop.

---

### AI-1 — Deduplicación de startOfTodayUTC() en rate-limit checks

**Problema:** `checkAllLimits()` invocaba `startOfTodayUTC()` 4 veces: una en `checkPlanLimits`, tres más en las funciones del parallel block. Cada una crea un objeto `Date` separado con `new Date()`.

**Solución:** Se añade `todayStart` como parámetro opcional con default a todas las funciones de check. `checkAllLimits()` computa el valor una vez y lo pasa a todos los checks. Las funciones siguen siendo usables standalone sin parámetro.

---

## RFC — PERF-3: Paralelización de nodos en el Workflow Engine

**Status:** RFC — requiere aprobación explícita antes de implementar

### Contexto

El engine ejecuta nodos en orden topológico **estrictamente secuencial**. En workflows donde múltiples nodos no tienen dependencias entre sí (ramas paralelas del DAG), estos se ejecutan uno a uno cuando podrían ejecutarse concurrentemente.

### Ejemplo de impacto

Un workflow de análisis de contenido con 3 herramientas independientes (SEO, Sentiment, Keywords) seguido de un nodo de síntesis:

```
[SEO] ─┐
[Sentiment] ─┼─▶ [Síntesis]
[Keywords] ─┘
```

**Hoy:** ~4500ms (3 × 1500ms secuenciales + síntesis)
**Con paralelización:** ~1800ms (3 en paralelo 1500ms + síntesis 300ms)

### Propuesta técnica

Modificar el loop de `executeWorkflow` para detectar qué nodos pueden ejecutarse en paralelo en cada "nivel" del DAG:

```typescript
// Estructura actual (secuencial)
for (const nodeId of executionOrder) {
  await executeNode(...)
}

// Propuesta (por niveles del DAG)
const levels = computeDAGLevels(activeNodes, activeConnections)
for (const level of levels) {
  await Promise.all(level.map(nodeId => executeNode(...)))
}
```

`computeDAGLevels` agrupa nodos por su distancia desde el nodo raíz en el DAG — todos los nodos del mismo nivel pueden ejecutarse sin esperar a los otros del mismo nivel.

### Riesgos

1. **Concurrencia en context**: El `context.nodes[nodeId]` se escribe desde múltiples goroutines paralelas. Si dos nodos del mismo nivel intentan leer salidas de nodos del nivel anterior, hay una race condition. → Mitigation: copiar el contexto por nivel, no compartir escrituras entre nodos del mismo nivel.

2. **Rate limits**: `checkAllLimits()` se llama por cada nodo. Con ejecución paralela, varios nodos podrían pasar el check simultáneamente antes de que el usage se registre, superando el límite. → Mitigation: pre-check de `N × cost_estimate` antes de lanzar el nivel, o check secuencial antes de cada nodo aunque la llamada IA sea paralela.

3. **Complejidad de diagnóstico**: Los logs de ejecución ya no son estrictamente temporales — dos nodos del mismo nivel tienen logs entrelazados. → Mitigation: añadir `level` al log y garantizar que `workflowNodeId` está siempre presente.

4. **Rollback**: Si un nodo del nivel falla, ¿se cancelan los demás del nivel? → Decisión: sí, con `Promise.allSettled` + cancelación cooperativa por flag.

### Impacto estimado

- **Latencia:** -50% a -70% en workflows con ramas paralelas (frecuentes en el caso de uso de análisis multi-herramienta)
- **Complejidad de implementación:** Alta (2-3 días de desarrollo + testing extensivo)
- **Riesgo de regresión:** Medio-alto — el engine es la pieza más crítica del sistema

### Condición para aprobación

Esta RFC no debe implementarse antes de:
1. Tener un suite de tests de integración del workflow engine (actualmente no existe)
2. Confirmar que los casos de uso principales usan workflows con ramas paralelas (validar con datos de uso real en beta)
3. Aprobar explícitamente en esta conversación

---

## Otras optimizaciones identificadas pero no implementadas

### requireUser() over-fetches workspaces (PERF-3)

`requireUser()` en `auth.ts` siempre hace `include: { org: { include: { workspaces: { take: 1 } } } }`. La mayoría de usos de `requireUser()` no necesitan `user.org.workspaces[0]`. Esto añade un JOIN a la tabla `workspaces` en cada petición autenticada.

**Bloqueante:** Requiere auditar todos los callers de `requireUser()` y refactorizar los que usan `user.org.workspaces[0]`. Cambio de interfaz pública.

### Next.js cache() para tool definitions (PERF-3)

Las `ToolDefinition` del catálogo oficial son inmutables en runtime (solo cambian en deploys). Podrían cachearse con `React.cache()` o `unstable_cache`. Sin embargo, la carga actual de las definiciones se hace dentro del engine con `include: { toolDefinition: true }` en el `findMany` de nodos — no hay una query separada cacheable.

---

## Performance Score post-auditoría

| Área | Score | Notas |
|------|-------|-------|
| DB Indexes | 90/100 | 4 nuevos índices compuestos; pendiente `prisma migrate` |
| Query patterns | 85/100 | N+1 eliminados; pre-fetch de virtual instances |
| Workflow Engine | 80/100 | Logs fire-and-forget, createMany, paralelización pendiente (RFC) |
| Rate Limiting | 90/100 | startOfTodayUTC deduplicado; 4 checks en parallel |
| Auth overhead | 70/100 | requireUser() over-fetches; pendiente RFC de callers |
| Caching | 65/100 | Sin cache de nivel aplicación aún; ToolDefinitions son buena candidata |

**Score global: 80/100**

---

## Escalabilidad estimada

| Carga | Estado post-SP-ARCH-003 | Bottleneck principal |
|-------|------------------------|---------------------|
| 10 usuarios | Sin problemas | — |
| 100 usuarios | Sin problemas con índices | Rate limits correctamente dimensionados |
| 1.000 usuarios | Necesita `prisma migrate` de índices + connection pooling (PgBouncer) | DB connections bajo concurrencia alta |
| 10.000 usuarios | Requiere PERF-3 (paralelización engine) + cache de definiciones + escalado horizontal BD | Workflow engine secuencial + DB sin sharding |

---

## Acción pendiente (manual)

```bash
# Aplicar índices a la BD (requiere DATABASE_URL configurada)
cd apps/web
npx prisma migrate dev --name perf-composite-indexes
```

