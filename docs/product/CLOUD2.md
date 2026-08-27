# CLOUD2 — Brain Query Audit Log

**Estado:** Implementado (2026-08-21)
**Sprint:** MITIKUS AI Cloud Data Model series
**Requiere:** `prisma db push` con dev server parado (ver Paso de activación)

---

## Qué hace

Extiende `BrainQuery` con el resultado completo de cada consulta al Brain cloud,
y añade `BrainSource` para persistir las fuentes reales que sustentaron la respuesta.

MITIKUS Cloud se convierte en source of truth del historial de Brain —
no solo del recuento de fuentes, sino de qué se respondió, con qué modo y desde qué fuentes.

---

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `apps/web/prisma/schema.prisma` | Extensión `BrainQuery` + nuevo modelo `BrainSource` |
| `apps/web/src/lib/brain/brain-service.ts` | `BrainResult` añade campo `mode` |
| `apps/web/src/app/api/brain/query/route.ts` | Persiste resultado completo en transacción |

`mitikus-ai` no fue tocado. Sin cambios en auth. Sin cambios en UI.

---

## Campos añadidos a BrainQuery

```prisma
normalizedQuery String?        // cloud: igual que query; Core: puede diferir
mode            String?        // "evidence" | "insufficient" | "orientation"
answer          String?        @db.Text
evidenceCount   Int?           // count explícito del resultado
warnings        Json?          // string[] — guardado verbatim, nunca reescrito
metadata        Json?          // reservado para uso futuro
sourcesList     BrainSource[]  // relación a fuentes reales
```

El campo `sources Int @default(0)` se mantiene para compatibilidad con UI existente.
`evidenceCount` y `sources` deben coincidir para queries del cloud Brain.

---

## Modelo BrainSource (nuevo)

```prisma
model BrainSource {
  id           String   @id @default(cuid())
  brainQueryId String
  sourceType   String   // "document" | "memory" | "conversation" | "tool" | "note" (Core)
  sourceId     String   // id del registro original en MITIKUS DB o en Core
  title        String
  excerpt      String   @db.Text
  score        Float?   // relevance score (FTS score para cloud, embedding score para Core)
  origin       String   @default("cloud-memory")
  createdAt    DateTime @default(now())
}
```

**Valores de `origin`:**

| origin | Fuente |
|--------|--------|
| `cloud-memory` | Brain cloud — PostgreSQL FTS (activo) |
| `local-memory` | MITIKUS AI Core — SQLite local (futuro: CLOUD2B) |
| `external-research` | Búsqueda web o documentos externos (futuro lejano) |

---

## Lógica de persistencia (route `/api/brain/query`)

```typescript
// Transacción atómica: BrainQuery + BrainSource[]
await db.$transaction(async (tx) => {
  const record = await tx.brainQuery.create({
    data: {
      query, normalizedQuery: query,
      mode: result.mode,           // "evidence" | "insufficient"
      answer: result.answer,
      evidenceCount: result.sources.length,
      warnings: [],                // cloud Brain sin warnings todavía
      sources: result.sources.length,
    },
  })
  if (result.sources.length > 0) {
    await tx.brainSource.createMany({
      data: result.sources.map((s) => ({
        brainQueryId: record.id,
        sourceType: s.type, sourceId: s.id,
        title: s.title, excerpt: s.excerpt,
        score: s.score, origin: 'cloud-memory',
      })),
    })
  }
})
```

Si Claude falla (excepción en `queryBrain`), la transacción no llega a ejecutarse.
Si la transacción falla (error de DB), el resultado ya fue calculado — se pierde solo el log,
no la respuesta al usuario.

---

## Modo en el cloud Brain

El cloud Brain (`brain-service.ts`) no tiene `mode` nativo — se derivó así:

| Condición | mode |
|-----------|------|
| `sources.length > 0` → Claude responde con contexto | `"evidence"` |
| `sources.length === 0` → respuesta de fallback | `"insufficient"` |

`"orientation"` no aplica al cloud Brain (es un concepto del MITIKUS AI Core).
Si en el futuro el cloud Brain implementa respuesta orientativa sin fuentes,
se añadirá como tercer caso.

---

## Qué NO se persistió todavía

| Concepto | Estado | Razón |
|----------|--------|-------|
| Fuentes del Core local (`local-memory`) | ❌ | Core Brain y cloud Brain son rutas separadas. El Core log queda en `CoreMemoryPanel` sin persistencia en MITIKUS DB. |
| `warnings` reales | ❌ | El cloud Brain no genera warnings todavía. Se guarda `[]`. |
| `normalizedQuery` diferente a `query` | ❌ | El cloud Brain no normaliza. Se guarda la query original. |
| Historial en UI | ❌ | BrainPanel no muestra historial todavía — solo el resultado en vivo. |

---

## Paso de activación (ejecutar una vez con dev server parado)

```bash
# 1. Parar el dev server (Ctrl+C)

# 2. Aplicar schema a la DB
cd apps/web
npx prisma db push

# 3. Regenerar cliente Prisma
npx prisma generate

# 4. Reiniciar dev server
cd ../..
turbo dev
```

`prisma db push` es seguro: los campos nuevos son todos nullable o tienen default.
No hay datos existentes que se vean afectados.

---

## Riesgos residuales

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| `BrainSource` del Core no se persiste | Media | CLOUD2B conectará CoreMemoryPanel al log |
| Si la transacción falla, el log se pierde pero la respuesta llega | Baja | Aceptable — el log es auditoría, no respuesta |
| `answer` puede ser largo — `@db.Text` cubre hasta 1GB en Postgres | Baja | OK |
| Historial de queries sin UI | Media | Dato disponible, visualización pendiente |

---

## Siguiente ticket recomendado

**`CLOUD3 — Persist Workspace Core Link`**

Añadir `coreProjectId Int?` al modelo Workspace para eliminar la race condition
residual de INTG7 y hacer el vínculo workspace→Core robusto.

Coste: una migración mínima (campo nullable), sin cambios en UI.

Después de CLOUD3: `CLOUD2B — Core Memory Query Audit Integration` para conectar
el log de consultas del Core (`CoreMemoryPanel`) al modelo `BrainQuery/BrainSource`
de MITIKUS DB, unificando ambos logs bajo el mismo modelo.

---

## Referencias

- `docs/product/CLOUD1.md` — definición del modelo cloud completo
- `docs/product/INTG7.md` — vínculo provisional workspace→Core
- `apps/web/src/lib/brain/brain-service.ts` — BrainResult con mode
- `apps/web/src/lib/brain/brain-search.ts` — BrainFragment (fuentes FTS)
- `apps/web/src/app/api/brain/query/route.ts` — persistencia en transacción
