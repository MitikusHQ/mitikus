# CLOUD2B — Core Memory Query Audit Integration

**Estado:** Implementado (2026-08-21)
**Sprint:** MITIKUS AI Cloud Data Model series
**Sin cambios de schema ni db push** — usa los modelos de CLOUD2 (BrainQuery/BrainSource)

---

## Qué hace

Persiste en MITIKUS DB las respuestas del MITIKUS AI Core local cuando el usuario
consulta desde la pestaña "Memoria local" (`CoreMemoryPanel`).

Antes de CLOUD2B:
- Brain cloud (`/api/brain/query`) → persistido en `BrainQuery` + `BrainSource` con `origin: "cloud-memory"` ✅
- Brain local (`CoreMemoryPanel`) → respuesta en UI, sin persistencia en MITIKUS ❌

Después de CLOUD2B:
- Ambos flujos persisten en el mismo modelo `BrainQuery` + `BrainSource`
- Las fuentes del Core se guardan con `origin: "local-memory"`
- MITIKUS DB tiene historial unificado de todas las consultas Brain

---

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/app/api/core/workspace/[workspaceId]/brain/answer/route.ts` | Nueva route workspace-aware (CLOUD2B) |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/CoreMemoryPanel.tsx` | URL de query actualizada |
| `docs/product/CLOUD2B.md` | Este documento |

`mitikus-ai` no fue tocado. Sin cambios de schema. Sin `db push`.

---

## Route elegida: Opción B — workspace-aware

`GET /api/core/workspace/[workspaceId]/brain/answer?query=...`

El cliente pasa `workspaceId` en el path — no necesita conocer `coreProjectId`.
La route lo resuelve internamente desde MITIKUS DB (CLOUD3 fast path).

### Flujo completo

```
1. auth() → userId (401 si no autenticado)
2. db.user.findUnique → { id, orgId }
3. db.workspace.findFirst({ id: workspaceId, orgId: user.orgId })
   → ownership check, 404 si no pertenece
4. workspace.coreProjectId !== null → fast path (CLOUD3)
   workspace.coreProjectId === null → listProjects + buscar "MITIKUS:<workspaceId>"
     → 404 si no existe ("Abre la pestaña Memoria local primero")
5. CoreClient.brainAnswer(coreProjectId, query) → BrainAnswer
6. db.$transaction:
     brainQuery.create({ ..., origin implícito en sources })
     brainSource.createMany({ origin: "local-memory" })
   → non-fatal: si falla el log, la respuesta llega igual
7. return NextResponse.json(answer)  ← contrato sin modificar
```

---

## Persistencia de BrainQuery (Core queries)

```
workspaceId      → del path
orgId            → del usuario autenticado
userId           → del usuario autenticado
query            → answer.query (original del Core)
normalizedQuery  → answer.normalizedQuery
mode             → answer.mode ("evidence"|"insufficient"|"orientation")
answer           → answer.answer (verbatim, no reescrito)
evidenceCount    → answer.evidenceCount
warnings         → answer.warnings ?? [] (verbatim, no reescritos)
sources          → answer.sources.length (campo legacy count)
```

## Persistencia de BrainSource (Core sources)

```
sourceType  → s.type  ("ProjectNote"|"Knowledge"|"Decision"|...)
sourceId    → String(s.id)
title       → s.title
excerpt     → s.excerpt
score       → s.score ?? null
origin      → "local-memory"   ← distingue del Brain cloud ("cloud-memory")
```

El campo `field` de `EvidenceSource` (qué campo del documento Core coincidió)
no tiene columna en `BrainSource` — se omite. El dato relevante está en `excerpt`.

---

## Cambio en CoreMemoryPanel

Un único cambio de URL en `handleQuery()`:

```typescript
// Antes (INTG4–INTG7)
`/api/core/projects/${selectedId}/brain/answer?query=...`

// Después (CLOUD2B)
`/api/core/workspace/${workspaceId}/brain/answer?query=...`
```

`selectedId` sigue disponible para el selector debug. No afecta a la query path.
La UI no cambia — respuesta y sources se muestran exactamente igual.

---

## Reglas de integridad

| Regla | Cómo se cumple |
|-------|----------------|
| Warnings verbatim | `warnings: answer.warnings ?? []` — sin transformación |
| Answer verbatim | `answer: answer.answer` — sin transformación |
| Sources no ocultas | `BrainSource.createMany` persiste todas las fuentes |
| Si log falla, respuesta llega | `try/catch` en bloque de transacción, no en el return |
| No escritura al Core | Solo lectura via `CoreClient.brainAnswer()` |
| Contrato Core invariante | `return NextResponse.json(answer)` devuelve la respuesta sin modificar |

---

## Qué queda pendiente

| Concepto | Estado |
|----------|--------|
| Historial de Brain queries en UI | ❌ — dato en DB, sin visualización |
| Deduplicar queries idénticas en ventana temporal | ❌ — cada request crea un registro |
| Rate limiting en Brain local | ❌ — Brain cloud tiene `checkPlanLimit`, el local no |
| `field` de EvidenceSource en BrainSource | ❌ — no hay columna; se puede añadir en futuro si hay caso de uso |

---

## Estado del log unificado tras CLOUD2B

| Flujo | Ruta | `BrainQuery.mode` | `BrainSource.origin` |
|-------|------|-------------------|----------------------|
| Brain cloud (FTS + Claude) | `POST /api/brain/query` | `"evidence"` \| `"insufficient"` | `"cloud-memory"` |
| Brain local (Core) | `GET /api/core/workspace/[id]/brain/answer` | `"evidence"` \| `"insufficient"` \| `"orientation"` | `"local-memory"` |

`origin` es la clave de lectura para distinguir de qué sistema vino cada fuente.

---

## Siguiente paso recomendado

**`CLOUD4 — Brain Query History UI`**

Añadir una vista de historial en `/workspace/[workspaceId]/brain` que muestre
las últimas N consultas `BrainQuery` del workspace, con `mode`, `answer` resumido
y count de fuentes. Los datos ya están en DB — falta la UI.

Alternativa: **`CLOUD3B — Rate Limit Core Brain`**
Aplicar `checkPlanLimit('brainQueriesPerMonth')` también a la route de Core Brain
para unificar el contador de uso independientemente del flujo.

---

## Referencias

- `docs/product/CLOUD2.md` — BrainQuery/BrainSource schema
- `docs/product/CLOUD3.md` — Workspace.coreProjectId + auth pattern
- `apps/web/src/lib/core-client/types.ts` — BrainAnswer, EvidenceSource (contrato Core)
- `apps/web/src/app/api/brain/query/route.ts` — patrón de referencia (Brain cloud)
