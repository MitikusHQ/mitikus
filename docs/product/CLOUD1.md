# CLOUD1 — MITIKUS Cloud Data Model

**Estado:** Definición arquitectónica (2026-08-21)
**Sprint:** MITIKUS AI Core integration series — Cloud layer
**Archivos relacionados:** `apps/web/prisma/schema.prisma`, `docs/product/INTG7.md`
**Sin cambios de código ni migración en este ticket.**

---

## 1. Visión cloud

MITIKUS es **online-first**. La cuenta MITIKUS es el centro de gravedad del usuario.

```
┌─────────────────────────────────────────────────────┐
│              MITIKUS Cloud (source of truth)        │
│  PostgreSQL via Prisma · Auth via Clerk             │
│  Organization → Workspace → Memoria → Auditoría     │
└────────────────────┬────────────────────────────────┘
                     │ HTTP proxy (CoreClient)
                     ▼
┌─────────────────────────────────────────────────────┐
│         MITIKUS AI Core (motor, no owner)           │
│  SQLite local · 127.0.0.1:47382                     │
│  Procesa memoria · Genera respuestas Brain          │
│  No posee los datos · No toma decisiones de negocio │
└─────────────────────────────────────────────────────┘
                     │ futuro
                     ▼
┌─────────────────────────────────────────────────────┐
│         Desktop / Offline (cache)                   │
│  Cola append-only · Sync cuando vuelve online       │
└─────────────────────────────────────────────────────┘
```

**Reglas de propiedad:**

| Dato | Owner |
|------|-------|
| Identidad del usuario | Clerk (delegado) → MITIKUS User |
| Workspaces y proyectos | MITIKUS Cloud |
| MemoryItems / notas base | MITIKUS Cloud (hoy: Core SQLite provisional) |
| Respuestas Brain y fuentes | MITIKUS Cloud (hoy: no persistidas) |
| Auditoría y eventos | MITIKUS Cloud |
| Índices de búsqueda vectorial | Core (puede reconstruirse desde MITIKUS) |

El Core **no decide** qué persiste. Solo propone respuestas y drafts.
MITIKUS Cloud acepta o descarta.

---

## 2. Entidades — modelo lógico

### 2.1 Entidades existentes hoy en Prisma

| Entidad Prisma | Tabla | Campos clave | Relevancia para memoria |
|----------------|-------|--------------|------------------------|
| `Organization` | `organizations` | `id`, `clerkOrgId`, `plan` | Raíz multi-tenant |
| `User` | `users` | `id`, `clerkId`, `email`, `orgId` | Actor de todas las acciones |
| `Workspace` | `workspaces` | `id`, `orgId`, `slug` | Unidad de memoria por proyecto |
| `CompanyProfile` | — | `companyName`, `sector`, `services`, `products` | Memoria estructurada de empresa |
| `CompanyObjective` | — | `title`, `description`, `status` | Objetivos por workspace |
| `CompanyAsset` / `CompanyProcess` / `CompanyRisk` | — | varios | Memoria operativa |
| `MissionIntelligence` | — | — | Señales de inteligencia por workspace |
| `BrainQuery` | `brain_queries` | `workspaceId`, `userId`, `query`, `sources` (count) | Log parcial de consultas al Brain |
| `AuditLog` | `audit_logs` | `action`, `entityType`, `entityId`, `metadata` | Auditoría general de la plataforma |
| `CopilotConversation` | — | — | Conversaciones con el Copilot cloud |

### 2.2 Entidades ausentes o incompletas

| Entidad lógica | Estado | Descripción |
|----------------|--------|-------------|
| `MemoryItem` | **Ausente** | Nota de memoria base creada por el usuario — hoy vive solo en Core SQLite |
| `EvidenceSource` | **Ausente** | Fuente citada en una respuesta Brain — hoy no se persiste en MITIKUS |
| `BrainResult` | **Ausente** | Respuesta completa del Brain (mode, answer, warnings) — hoy solo se guarda el count de fuentes |
| `CoreLink` / `coreProjectId` | **Ausente** | Vínculo persistido workspace → Core project — hoy es provisional por nombre de convenio |
| `SyncEvent` / `ChangeLog` | **Ausente** | Cola append-only para sincronización offline — solo definida conceptualmente |

---

## 3. Qué existe hoy vs qué falta

### Estado actual de BrainQuery

```prisma
model BrainQuery {
  id          String   // ✅
  workspaceId String   // ✅
  orgId       String   // ✅
  userId      String   // ✅
  query       String   // ✅ — consulta original
  sources     Int      // ⚠️ solo el count; no las fuentes reales
  createdAt   DateTime // ✅
  // ❌ Falta: mode, normalizedQuery, answer, warnings, evidenceCount detallado
  // ❌ Falta: relación con EvidenceSource
}
```

### Estado actual de Workspace (memoria local)

```prisma
model Workspace {
  // ❌ Falta: coreProjectId Int?  — vínculo a Core project
  // ❌ Falta: relación con MemoryItem
  // ✅ Tiene: companyProfile, objectives, assets, processes, risks (memoria estructurada)
  // ✅ Tiene: brainQueries (log parcial)
}
```

### Tabla resumen: Existe / Falta / Prioridad

| Concepto | Existe | Campo que falta | MVP o Futuro |
|----------|--------|-----------------|--------------|
| Usuario autenticado | ✅ `User.clerkId` | — | — |
| Workspace por org | ✅ `Workspace` | `coreProjectId Int?` | MVP |
| Memoria estructurada empresa | ✅ `CompanyProfile` + familia | — | — |
| Nota de memoria libre (MemoryItem) | ❌ | Modelo `MemoryItem` completo | MVP |
| Log de consulta Brain | ✅ `BrainQuery` (parcial) | `mode`, `answer`, `evidenceCount` | MVP |
| Fuentes de evidencia persistidas | ❌ | Modelo `EvidenceSource` o JSON en BrainQuery | MVP |
| Vínculo workspace → Core project | ❌ | `Workspace.coreProjectId Int?` | MVP |
| Resultado completo Brain | ❌ | `BrainResult` o extensión de `BrainQuery` | MVP |
| Cola de sync offline | ❌ | `SyncEvent` append-only | Futuro |
| Backup de memoria Core | ❌ | Export/import de Core SQLite | Futuro |
| Memoria externa (research) | ❌ | `EvidenceSource.origin = "external-research"` | Futuro |

---

## 4. Escrituras — quién decide qué persiste

### MITIKUS puede escribir directamente:

- Crear / archivar workspaces y proyectos
- Crear `MemoryItem` (nota de memoria base, hoy va al Core via proxy)
- Crear `BrainQuery` con resultado (hoy se guarda solo la query parcialmente)
- Crear `EvidenceSource` ligada a un `BrainQuery`
- Crear entradas de `AuditLog`
- Actualizar `Workspace.coreProjectId` una vez resuelto

### MITIKUS AI Core puede proponer:

- Draft de respuesta Brain (mode, answer, normalizedQuery, warnings, sources)
- Señales (`brainSignals`) — indicadores de salud del proyecto en Core
- Orientación cuando la memoria es insuficiente

**Regla invariante:** el Core **nunca escribe** en MITIKUS DB.
MITIKUS recibe la propuesta del Core y decide si persistirla y cómo.

---

## 5. Fuentes y auditabilidad

Toda respuesta Brain que se persista en MITIKUS debe incluir sus fuentes.

### Orígenes válidos

| origin | Descripción | Estado |
|--------|-------------|--------|
| `local-memory` | Nota del Core SQLite del workspace | Activo (INTG2–INTG7) |
| `cloud-memory` | MemoryItem persistido en MITIKUS DB | Futuro (CLOUD2+) |
| `external-research` | Búsqueda web o documento externo | Futuro lejano |

### Reglas de fuentes

- `sources` es siempre array — nunca null (contrato CORE_CONTRACT2)
- Si `mode = "evidence"`, `sources.length > 0` obligatorio
- Las fuentes **no se ocultan** ni se reescriben en la UI
- Los `warnings` del Core **no se reescriben** — se muestran tal cual
- `origin` de cada fuente se muestra en la UI (badge en CoreMemoryPanel)

---

## 6. Sync futuro — solo modelo

**No implementar todavía.** Solo para guiar decisiones de diseño actuales.

```
Principios:
1. Cloud = source of truth siempre
2. Desktop = cache + cola offline
3. Eventos append-only (INSERT-only tables, no UPDATE destructivos)
4. Conflicto → conservar ambas versiones + marcar para revisión
5. El usuario aprueba la resolución; MITIKUS no decide por él
```

```
SyncEvent (futuro)
  id            String
  workspaceId   String
  entityType    String   // "memory_item" | "brain_query" | ...
  entityId      String
  operation     String   // "create" | "update" | "delete"
  payload       Json
  syncedAt      DateTime?
  origin        String   // "cloud" | "desktop"
```

El diseño de sync debe empezar desde los eventos, no desde el estado compartido.

---

## 7. Relación con el Core actual (INTG6/INTG7)

| Aspecto | Hoy | Futuro |
|---------|-----|--------|
| Vínculo workspace → Core | Nombre convenido `MITIKUS:<id>` | `Workspace.coreProjectId Int?` en MITIKUS DB |
| Persistencia de memoria | Core SQLite (provisional) | `MemoryItem` en MITIKUS Postgres |
| Core como motor | HTTP local (`127.0.0.1:47382`) | HTTP local (dev) / Core cloud (prod) |
| Backup de memoria | Ninguno | Export SQLite periódico o MITIKUS como source |
| Duplicados en Core | Guard por nombre (INTG7) | Innecesario si `coreProjectId` persiste en DB |

Si MITIKUS DB persiste `MemoryItem`, el Core puede reconstruir su índice a partir
de MITIKUS — el SQLite del Core pasa a ser un índice derivado, no la fuente primaria.
Esto invierte la dependencia y alinea con el principio rector.

---

## 8. MVP recomendado — próximo paso

Tres opciones ordenadas por impacto/coste:

### Opción A — Extender BrainQuery (recomendada como CLOUD2)

**Coste:** migración pequeña, un modelo existente.
**Impacto:** MITIKUS registra qué respondió el Core, con qué modo y cuántas fuentes.
Permite mostrar historial de consultas Brain en la UI.

```prisma
model BrainQuery {
  // campos existentes ...
  mode            String?   // "evidence" | "insufficient" | "orientation"
  normalizedQuery String?
  answer          String?   @db.Text
  evidenceCount   Int       @default(0)
  warnings        Json      @default("[]")  // string[]
  // relación a fuentes:
  sources         BrainSource[]
}

model BrainSource {  // nuevo
  id          String     @id @default(cuid())
  brainQueryId String
  sourceType  String    // tipo del Core (e.g. "note")
  sourceId    Int       // id en Core
  title       String
  excerpt     String    @db.Text
  origin      String    // "local-memory" | "cloud-memory"
  brainQuery  BrainQuery @relation(fields: [brainQueryId], references: [id], onDelete: Cascade)
}
```

### Opción B — Persistir coreProjectId en Workspace

**Coste:** migración mínima, un campo nullable.
**Impacto:** elimina la race condition de INTG7 y hace el mapping robusto.

```prisma
model Workspace {
  // ...
  coreProjectId Int?  // ID del proyecto en MITIKUS AI Core local
}
```

### Opción C — Añadir MemoryItem

**Coste:** modelo nuevo, requiere cablear proxy INTG5 al nuevo modelo.
**Impacto:** MITIKUS DB como source of truth de notas de memoria.
Pero hasta que el Core sea cloud, el impacto práctico es menor que A o B.

---

## 9. Qué NO hacer ahora

- No implementar sync cloud-desktop
- No implementar billing de memoria
- No implementar research externo (`external-research`)
- No tocar MITIKUS AI Core
- No migración grande sin decisión de equipo
- No cambiar auth (Clerk)
- No cambiar iconos/logo
- No tocar Tauri desktop prototype
- No implementar backup automático del Core SQLite (no hay infra todavía)

---

## 10. Siguiente ticket recomendado

**`CLOUD2 — Brain Query Audit Log`**

Razón: `BrainQuery` ya existe en el schema. Extenderla con `mode`, `answer`,
`evidenceCount` y una tabla `BrainSource` es la migración más pequeña con el
mayor retorno — convierte un log parcial en un log completo y auditable.
No requiere nuevo modelo de usuario ni cambios en auth.

Una vez hecho CLOUD2, el siguiente es `CLOUD3 — Persist Workspace Core Link`
(añadir `coreProjectId Int?`) para eliminar la race condition residual de INTG7.

El `MemoryItem` como modelo propio en MITIKUS DB (Opción C) es el paso después,
cuando el Core tenga backup o esté en cloud.

---

## Referencias

- `apps/web/prisma/schema.prisma` — fuente de verdad del modelo actual
- `docs/product/INTG7.md` — vínculo provisional workspaceId → Core project
- `apps/web/src/lib/core-client/index.ts` — CoreClient (consumidor, no owner)
- `apps/web/src/app/api/core/` — proxy routes MITIKUS → Core
- `mitikus-ai/docs/product/CORE_CONTRACT2.md` — contrato del Core (solo lectura)
