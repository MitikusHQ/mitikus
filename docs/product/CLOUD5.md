# CLOUD5 — Memory Items MVP

**Estado:** Implementado (2026-08-21)
**Sprint:** MITIKUS AI Cloud Data Model series
**DB push:** aplicado ✅ (`memory_items` tabla creada en Postgres)
**Prisma generate:** aplicado ✅

---

## Qué hace

Añade `MemoryItem` como modelo cloud en MITIKUS para guardar memoria libre del workspace
como **source of truth inicial** en MITIKUS PostgreSQL.

Antes de CLOUD5:
- La memoria base creada desde `CoreMemoryPanel` se guardaba solo en MITIKUS AI Core SQLite (local)
- MITIKUS no era dueño de esa memoria — el Core lo era de facto

Después de CLOUD5:
- El usuario puede crear MemoryItems directamente en MITIKUS Cloud
- MITIKUS DB es la fuente de verdad de estos registros
- El Core local **aún no los consume automáticamente** — esa brecha se cerrará en CLOUD6
- La creación de notas en Core (CoreMemoryPanel) sigue funcionando igual — no se toca

---

## Archivos creados/modificados

| Archivo | Cambio |
|---------|--------|
| `apps/web/prisma/schema.prisma` | Modelo `MemoryItem` + relaciones en `Organization`, `Workspace`, `User` |
| `apps/web/src/app/api/workspace/[workspaceId]/memory/route.ts` | GET + POST con auth + ownership |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/MemoryCloudPanel.tsx` | UI: lista + formulario de creación |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/BrainTabs.tsx` | Cuarto tab "Memoria" |
| `docs/product/CLOUD5.md` | Este documento |

`mitikus-ai` no fue tocado. Sin llamadas al Core.

---

## Modelo Prisma

```prisma
model MemoryItem {
  id          String   @id @default(cuid())
  workspaceId String
  orgId       String
  userId      String?  // null si creado por sistema/importación
  title       String
  content     String   @db.Text
  type        String   @default("note")    // note | decision | hypothesis | context
  status      String   @default("active")  // active | archived
  source      String   @default("manual")  // manual | import | core-sync (futuro)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  org       Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  user      User?        @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([workspaceId, createdAt])
  @@index([orgId, createdAt])
  @@index([status])
  @@map("memory_items")
}
```

Migración aditiva. No afecta a modelos existentes. `userId` es nullable para compatibilidad
con creaciones futuras por sistema.

---

## API Routes

`GET /api/workspace/[workspaceId]/memory`
- Auth Clerk + ownership por orgId
- `findMany({ where: { workspaceId, status: "active" }, orderBy: { createdAt: "desc" }, take: 50 })`
- Devuelve `{ items }`

`POST /api/workspace/[workspaceId]/memory`
- Auth Clerk + ownership por orgId
- Body: `{ title, content, type? }` (JSON)
- Validaciones: title trim no vacío, content trim no vacío, title ≤ 200 chars
- Devuelve `{ item }` con status 201

Ambas routes son `force-dynamic`. Sin llamadas al Core.

---

## UI — MemoryCloudPanel

Pestaña "Memoria" en `/workspace/[workspaceId]/brain`.

### Características

| Feature | Descripción |
|---------|-------------|
| Aviso cloud | Banner informativo que explica que Brain local aún no consume estos items (CLOUD6 pendiente) |
| Formulario | Título + tipo (dropdown) + contenido (textarea) + botón "Guardar en cloud" |
| Lista expandible | Cada item muestra título, fecha, tipo badge, badge "cloud"; expandible para ver contenido |
| Optimistic insert | El item nuevo se añade al principio de la lista al guardar sin recargar |
| Empty state | Mensaje claro cuando no hay memoria todavía |
| Error handling | Mensajes de error en formulario y en carga de lista |

### Tipos de MemoryItem

| type | Label UI |
|------|----------|
| `note` | Nota |
| `decision` | Decisión |
| `hypothesis` | Hipótesis |
| `context` | Contexto |

---

## ⚠️ Brecha documentada — Core no consume MemoryItem automáticamente

**Estado actual tras CLOUD5:**

```
Usuario crea MemoryItem en pestaña "Memoria"
  → Se persiste en MITIKUS PostgreSQL ✅
  → MITIKUS es dueño del dato ✅
  → Brain cloud (FTS en Postgres) puede indexarlo en el futuro ✅
  
  ❌ MITIKUS AI Core local NO indexa este MemoryItem automáticamente
  ❌ Brain local (CoreMemoryPanel) no lo ve
  ❌ Las consultas al Core no encuentran estos items
```

**Cómo crear notas que el Core SÍ indexa hoy:**
Usar la pestaña "Memoria local" (CoreMemoryPanel) — escribe directamente al Core SQLite.

**Próximo paso para cerrar la brecha:**

`CLOUD6 — Feed Core from MITIKUS Memory`

Cuando el usuario crea un MemoryItem en MITIKUS Cloud, CLOUD6 lo enviará
al Core automáticamente via `CoreClient.createNote()` después de persistirlo.
De esta forma:
1. MITIKUS Cloud = source of truth (escribe primero)
2. Core SQLite = índice derivado (se actualiza a partir de MITIKUS)
3. Brain local puede consultar la memoria cloud porque está replicada en Core

El diseño de CLOUD6 debe garantizar que:
- Si el Core está caído, el MemoryItem se guarda igualmente en MITIKUS (non-fatal)
- Si el Core ya tiene la nota (importación previa), no se duplica
- `source: "core-sync"` en MemoryItem marca los items que también están en Core

---

## Qué NO hace CLOUD5

| Feature | Estado |
|---------|--------|
| Edición de MemoryItems | No implementado — solo creación y listado |
| Archivado de MemoryItems | No implementado — campo `status` existe en DB |
| Envío automático al Core | No implementado — CLOUD6 |
| Brain cloud buscando en MemoryItem | No implementado — requiere FTS sobre `memory_items` |
| Paginación más allá de 50 items | No implementado — límite fijo |
| Import desde Core (sync inversa) | No implementado — futuro |

---

## TypeScript

`npx tsc --noEmit` pasa sin errores tras la implementación.

---

## Principio arquitectónico cumplido

> MITIKUS owns the user and their data.
> MITIKUS AI Core processes memory but does not own the product.

Antes de CLOUD5: el Core era de facto dueño de la memoria libre del workspace.
Después de CLOUD5: MITIKUS PostgreSQL es el dueño. El Core es un índice derivado
(aunque la sincronización automática todavía no existe — eso es CLOUD6).

---

## Referencias

- `docs/product/CLOUD1.md` — arquitectura cloud, sección 2.2 "Entidades ausentes" → `MemoryItem`
- `docs/product/CLOUD2.md` — BrainQuery/BrainSource
- `docs/product/CLOUD4.md` — Brain Query History UI
- `apps/web/prisma/schema.prisma` — modelo `MemoryItem`
- `apps/web/src/app/api/workspace/[workspaceId]/memory/route.ts` — GET + POST
