# CLOUD3B — Rate Limit Core Brain

**Estado:** Implementado (2026-08-21)
**Sprint:** MITIKUS AI Cloud Data Model series
**Sin cambios de schema ni db push** — solo lógica de route

---

## Problema

`POST /api/brain/query` (Brain cloud) aplicaba `checkPlanLimit('brainQueriesPerMonth')`.
`GET /api/core/workspace/[workspaceId]/brain/answer` (Brain local/Core, CLOUD2B) no lo hacía.

Esto creaba una vía lateral: un usuario podía agotar el plan con Brain cloud,
cambiar a "Memoria local" y seguir consultando sin restricción.

---

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/app/api/core/workspace/[workspaceId]/brain/answer/route.ts` | Import + llamada a `checkPlanLimit` |
| `docs/product/CLOUD3B.md` | Este documento |

`mitikus-ai` no fue tocado. Sin cambios de schema. Sin `db push`.

---

## Dónde se añadió el rate limit

En la route CLOUD2B, **después** del ownership check del workspace y **antes** de
resolver el `coreProjectId` o llamar al Core:

```typescript
const limitCheck = await checkPlanLimit(user.orgId, "brainQueriesPerMonth");
if (!limitCheck.allowed) {
  return NextResponse.json({ error: limitCheck.message }, { status: 429 });
}
```

### Posición exacta en el flujo

```
1. auth()                          ← sin cambios
2. user lookup                     ← sin cambios
3. workspace ownership check       ← sin cambios
4. checkPlanLimit ✅ NUEVO         ← CLOUD3B — 429 si límite superado
5. resolve coreProjectId           ← solo si límite OK
6. CoreClient.brainAnswer()        ← solo si límite OK
7. persist BrainQuery/BrainSource  ← solo si límite OK
8. return answer                   ← solo si límite OK
```

Si el límite se supera: el Core no recibe ningún request, no se crea BrainQuery.

---

## Qué devuelve al superar el límite

```json
HTTP 429
{ "error": "Has alcanzado el límite de consultas Brain este mes de tu plan (N). Actualiza tu plan para continuar." }
```

Mismo shape y mismo status que Brain cloud — idéntico comportamiento de producto.

El mensaje viene verbatim de `checkPlanLimit` → `LIMIT_LABELS['brainQueriesPerMonth']`.

---

## Cómo lo ve el usuario en CoreMemoryPanel

`apiFetch` en `CoreMemoryPanel` captura el error de la respuesta:
```typescript
if (!res.ok) return { error: (json as { error?: string }).error ?? `HTTP ${res.status}` }
```
→ `setError(err)` → se muestra en el bloque rojo de error ya existente en la UI.
Sin cambios en el componente.

---

## Contador unificado

`checkPlanLimit('brainQueriesPerMonth')` cuenta:
```sql
SELECT COUNT(*) FROM brain_queries
WHERE org_id = $orgId AND created_at >= inicio_del_mes
```

Brain cloud y Brain local usan el mismo contador porque ambos crean registros
en `brain_queries` con el mismo `orgId`. El límite es por organización, no por flujo.

---

## Orden de operaciones y consistencia

`checkPlanLimit` usa `pg_advisory_xact_lock` para serializar comprobaciones
concurrentes del mismo `(orgId, limitKey)`. El contador se lee dentro de una
transacción bloqueada — no hay race condition entre Brain cloud y Brain local
si el usuario abre ambas pestañas simultáneamente.

---

## Riesgos residuales

| Riesgo | Severidad | Estado |
|--------|-----------|--------|
| Usuario con dos pestañas (cloud + local) simultáneas puede superar el límite en 1 | Muy baja | `pg_advisory_xact_lock` serializa — no es posible |
| `checkPlanLimit` falla (Sentry lo captura) → 500 en la route | Baja | Mismo comportamiento que Brain cloud |
| El mensaje de límite no menciona explícitamente "Brain local" | Cosmético | Mensaje genérico de plan — aceptable |

---

## Siguiente paso recomendado

**`CLOUD4 — Brain Query History UI`**

Los datos ya están en DB: `BrainQuery` unificado para Brain cloud y Brain local,
con `mode`, `answer`, `evidenceCount`, `origin` en `BrainSource`.

CLOUD4 añade una vista de historial en `/workspace/[workspaceId]/brain`
con las últimas N consultas del workspace, navegable y filtrable por origen.

---

## Referencias

- `apps/web/src/lib/billing/check-plan-limit.ts` — implementación con advisory lock
- `apps/web/src/app/api/brain/query/route.ts` — patrón de referencia (Brain cloud)
- `docs/product/CLOUD2B.md` — route CLOUD2B que ahora incluye el rate limit
