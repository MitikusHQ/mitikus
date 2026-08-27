# CLOUD4 — Brain Query History UI

**Estado:** Implementado (2026-08-21)
**Sprint:** MITIKUS AI Cloud Data Model series
**Sin cambios de schema ni db push** — usa los modelos de CLOUD2 (BrainQuery/BrainSource)

---

## Qué hace

Añade una tercera pestaña "Historial" en `/workspace/[workspaceId]/brain` que muestra
las últimas 20 consultas Brain del workspace — tanto cloud como local — usando los datos
ya persistidos en `BrainQuery` + `BrainSource` por CLOUD2 y CLOUD2B.

Lectura exclusiva de MITIKUS DB. Sin llamadas al Core. Sin reescritura de respuestas,
warnings ni fuentes.

---

## Archivos creados/modificados

| Archivo | Cambio |
|---------|--------|
| `apps/web/src/app/api/workspace/[workspaceId]/brain/history/route.ts` | Nueva API route — auth + ownership + `findMany` |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/BrainHistoryPanel.tsx` | Componente historial con filtro y expansión |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/BrainTabs.tsx` | Tercer tab "Historial" |
| `docs/product/CLOUD4.md` | Este documento |

`mitikus-ai` no fue tocado. Sin cambios de schema. Sin `db push`.

---

## API Route

`GET /api/workspace/[workspaceId]/brain/history`

### Flujo

```
1. auth() → userId (401 si no autenticado)
2. db.user.findUnique → { id, orgId }
3. db.workspace.findFirst({ id: workspaceId, orgId: user.orgId })
   → ownership check, 404 si no pertenece
4. db.brainQuery.findMany({
     where: { workspaceId },
     orderBy: { createdAt: "desc" },
     take: 20,
     select: { id, query, normalizedQuery, mode, answer, evidenceCount,
               warnings, sources, createdAt,
               sourcesList: { id, origin, sourceType, title, excerpt, score } }
   })
5. return { queries }
```

### Sin llamadas al Core

La route es `force-dynamic` y solo accede a Postgres. El Core no recibe ningún request.

---

## Componente BrainHistoryPanel

### Props

```typescript
interface Props { workspaceId: string }
```

### Estados

| Estado | Tipo | Descripción |
|--------|------|-------------|
| `queries` | `BrainQueryRecord[]` | Registros cargados de la API |
| `loading` | `boolean` | Spinner mientras carga |
| `error` | `string \| null` | Mensaje de error si falla la fetch |
| `filter` | `"all" \| "cloud-memory" \| "local-memory"` | Filtro de origen activo |
| `expandedId` | `string \| null` | ID del registro expandido (uno a la vez) |

### Filtro por origen

El filtro opera sobre `BrainSource.origin`. Si un registro no tiene fuentes, se infiere
el origen:

- `mode === "orientation"` → `"local-memory"` (modo exclusivo del Core)
- cualquier otro modo sin fuentes → `"cloud-memory"`

El filtro `"all"` muestra todos los registros sin distinción.

### Expansión por registro

Un clic en una fila la expande (toggle). Expandida, muestra:

1. Consulta normalizada (si difiere de la original)
2. Respuesta completa (`answer`) — verbatim, sin truncar
3. Warnings — verbatim, nunca reescritos
4. Lista de fuentes: origin badge, sourceType, title, excerpt, score

### Invariantes de integridad

| Regla | Cómo se cumple |
|-------|----------------|
| Answer verbatim | Renderizado tal cual desde DB |
| Warnings verbatim | Array extraído sin transformación |
| Sources no ocultas | `sourcesList` incluye todas las fuentes del registro |
| Sin escrituras | Solo `GET` — no hay side effects |
| Sin llamadas al Core | Toda la data viene de MITIKUS DB |

---

## BrainTabs — tercer tab

```typescript
type Tab = "cloud" | "local" | "history";
```

El tercer tab "Historial" monta `<BrainHistoryPanel workspaceId={workspaceId} />`.
La carga de datos se hace al montar el panel (primera vez que el usuario abre el tab).

---

## Estado vacío

Si no hay registros (o ninguno pasa el filtro), se muestra:

```
📭  No hay consultas registradas todavía.
    [si hay filtro activo] Prueba a seleccionar "Todos" para ver todas las fuentes.
```

---

## Badges visuales

| Concepto | Badge |
|----------|-------|
| `mode: evidence` | Chip verde "Evidencia" |
| `mode: insufficient` | Chip ámbar "Sin evidencia" |
| `mode: orientation` | Chip gris "Orientación" |
| `origin: cloud-memory` | Chip azul "cloud" |
| `origin: local-memory` | Chip violeta "local" |

---

## TypeScript

`npx tsc --noEmit` pasa sin errores tras la implementación.
No se usaron `any`. Los tipos de `warnings` (Prisma `Json?`) se deserializan
con una guarda de tipo inline antes de renderizar.

---

## Qué queda fuera de scope (CLOUD4)

| Feature | Estado |
|---------|--------|
| Paginación más allá de 20 registros | No implementado — límite fijo |
| Borrado de registros | No implementado — historial es append-only en MITIKUS |
| Re-ejecución de una consulta desde historial | No implementado |
| Búsqueda por texto en el historial | No implementado |

---

## Referencias

- `docs/product/CLOUD2.md` — BrainQuery/BrainSource schema
- `docs/product/CLOUD2B.md` — persistencia de Brain local (origin: "local-memory")
- `docs/product/CLOUD3.md` — auth pattern (workspaceId ownership check)
- `apps/web/prisma/schema.prisma` — modelos BrainQuery, BrainSource
