# MITIKUS AI Brain — Integration Design

> **For agentic workers:** Use `superpowers:executing-plans` or `superpowers:subagent-driven-development` to implement the plan derived from this spec.

**Goal:** Integrar MITIKUS AI (Brain — consulta de memoria inteligente) como módulo nativo dentro de mitikus.com, sin reemplazar ni mezclar con Arkos IA.

**Architecture:** Brain nativo en Next.js — nueva API Route + BrainService que busca en todas las tablas del workspace (Documents, Business Memory, Copilot, Tools) con PostgreSQL full-text search, y devuelve respuesta grounded via Claude Sonnet. UI en dos puntos de acceso: botón flotante global (entrada rápida) + página propia en sidebar (sesión completa).

**Tech Stack:** Next.js 15 App Router, Prisma + PostgreSQL, Claude Sonnet (ya integrado), Clerk (auth ya existente), Tailwind CSS.

---

## 1. Contexto y diferenciación

| | Arkos IA | MITIKUS AI Brain |
|---|---|---|
| **Naturaleza** | Proactivo — planifica, sugiere, orienta | Reactivo — responde preguntas sobre la memoria del workspace |
| **Cuándo usarlo** | "Ayúdame a pensar qué hacer con este objetivo" | "¿Cuál era la decisión que tomamos sobre X?" |
| **Flujo** | Conversación multi-turno | Query → evidencia → respuesta grounded |

Son complementarios, no competidores. No se mezclan en la misma UI.

---

## 2. Ubicación en mitikus.com

### Acceso primario — Botón flotante global
- Botón `✦` fijo en esquina inferior derecha de cualquier página del workspace
- Abre un panel lateral deslizable con el Brain (sin navegar, sin interrumpir)
- Atajo de teclado: `Cmd/Ctrl + K`
- El panel incluye: input de query, respuesta grounded, fuentes clicables, botón "Ver en Brain →"

### Acceso secundario — Página propia
- Ruta: `/workspace/[workspaceId]/brain`
- Entrada en la sidebar del workspace al mismo nivel que Arkos, Docs, Import
- Añade: historial de consultas de la sesión, evidencia expandida, acciones rápidas predefinidas

---

## 3. Archivos

### Nuevos
| Archivo | Responsabilidad |
|---------|----------------|
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/page.tsx` | Página completa del Brain |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/BrainPanel.tsx` | Componente reutilizable (página + overlay) |
| `apps/web/src/components/BrainOverlay.tsx` | Panel flotante global con botón ✦ |
| `apps/web/src/app/api/brain/query/route.ts` | API endpoint POST |
| `apps/web/src/lib/brain/brain-service.ts` | Orquestación: búsqueda + grounding con Claude |
| `apps/web/src/lib/brain/brain-search.ts` | Full-text search en PostgreSQL sobre 4 fuentes |

### Modificados
| Archivo | Cambio |
|---------|--------|
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx` | Montar `<BrainOverlay />` + listener Cmd+K |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceSidebar.tsx` | Añadir enlace Brain en nav |
| `apps/web/src/lib/plan-limits.ts` | Añadir `brainQueriesPerMonth` por plan (usado en la API route para gate de acceso) |

---

## 4. Flujo de una consulta

```
Usuario escribe query
  → BrainPanel → POST /api/brain/query { workspaceId, query }
    → auth check (Clerk) + plan limit check
    → BrainService.search(workspaceId, query)
      → brain-search.ts ejecuta FTS en paralelo:
          · documents          (rawText + title)
          · company_objectives + assets + processes + risks  (Business Memory)
          · copilot_conversations  (historial de Arkos)
          · tool_definitions   (nombre + descripción)
      → fragmentos ordenados por score (top 5-8)
    → BrainService.ground(query, fragments)
      → Claude Sonnet: system prompt + fragmentos como contexto
      → respuesta en lenguaje natural con referencias a fuentes
    → { answer, sources: [{ type, id, title, excerpt }] }
  → BrainPanel renderiza respuesta + fuentes clicables
```

Cada query consume 1 gen. IA del contador del plan (mismo sistema que Arkos y herramientas, sin contador separado).

---

## 5. BrainPanel — UI

El componente `BrainPanel` es el mismo en la página y en el overlay (mismas props, distinto contenedor).

**Elementos:**
- Input de texto: "¿Qué quieres consultar?"
- Acciones rápidas: "Qué hago ahora", "Decisiones recientes", "Objetivos activos", "Fricciones"
- Chip de estado: "Respuesta · N fuentes"
- Respuesta grounded (texto)
- Lista de fuentes: cada fuente muestra tipo (Document / Objetivo / Tool / Conversación) + título + fragmento. Clic → abre el recurso original en nueva pestaña o panel
- Botones: Copiar respuesta, Limpiar
- En overlay: botón adicional "Ver en Brain →" para ir a la página completa

---

## 6. Fuentes de datos — PostgreSQL FTS

```sql
-- Ejemplo de búsqueda en documents
SELECT id, title, LEFT(raw_text, 300) AS excerpt,
       ts_rank(to_tsvector('spanish', raw_text), query) AS score
FROM documents, plainto_tsquery('spanish', $1) query
WHERE workspace_id = $2
  AND to_tsvector('spanish', raw_text) @@ query
ORDER BY score DESC
LIMIT 3;
```

Se ejecutan 4 queries en paralelo (una por fuente). Los resultados se unen y se reordenan globalmente por score antes de pasarlos a Claude.

---

## 7. Acceso por plan

| Plan | Precio | Brain |
|------|--------|-------|
| Evaluación | Gratis 15 días | ✓ — 5 consultas (prueba) |
| Autónomo | €29/mes | ✓ — 20 consultas/mes |
| Starter | €39/mes | ✓ — 50 consultas/mes |
| Professional | €149/mes | ✓ — 200 consultas/mes |
| Business | €349/mes | ✓ — ilimitado |
| Enterprise | A medida | ✓ — a medida |

Se añade `brainQueriesPerMonth` como campo nuevo en `plan-limits.ts` (independiente de `aiGenerationsPerMonth`). La API route llama a `checkPlanLimits()` antes de ejecutar la búsqueda y devuelve 429 si el límite está agotado. Esto permite controlar Brain por separado sin afectar el contador de Arkos/herramientas.

---

## 8. Fuera de scope (primera versión)

- Búsqueda semántica / embeddings — la FTS de PostgreSQL es suficiente para MVP
- Historial persistente de consultas Brain en BD — solo en memoria de la sesión
- Brain en el plan Free (Evaluación sí tiene prueba limitada)
- Modo multi-workspace — el Brain consulta solo el workspace activo
- MITIKUS AI standalone en `ai.mitikus.com` — decisión diferida hasta validar demanda
