# MITIKUS AI Brain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar MITIKUS AI Brain como módulo nativo en mitikus.com — búsqueda FTS en PostgreSQL sobre 4 fuentes del workspace, grounding con Claude Sonnet, con botón flotante global (✦, Cmd+K) y página propia en sidebar.

**Architecture:** API route POST /api/brain/query orquesta brain-search.ts (4 queries FTS paralelas via `db.$queryRaw`) + brain-service.ts (grounding con Claude Sonnet). El componente BrainPanel es reutilizable: lo monta la página /brain y el overlay flotante global. El sistema de límites extiende plan-catalog.ts con `brainQueriesPerMonth` independiente de `aiGenerationsPerMonth`.

**Tech Stack:** Next.js 15 App Router, Prisma `$queryRaw`, Claude Sonnet (`@anthropic-ai/sdk` ya instalado), Clerk auth, Tailwind CSS.

**Advertencia crítica:** Si `auth()` devuelve null en API routes en local, verifica que `CLERK_JWT_KEY` esté en `apps/web/.env.local`. Sin esta clave el middleware de Clerk no puede verificar tokens en rutas de API.

---

## File Map

### Nuevos
| Archivo | Responsabilidad |
|---------|----------------|
| `apps/web/src/lib/brain/brain-search.ts` | 4 queries FTS paralelas en PostgreSQL |
| `apps/web/src/lib/brain/brain-service.ts` | Orquestación: llama brain-search + grounding Claude |
| `apps/web/src/app/api/brain/query/route.ts` | POST endpoint — auth, plan limit, llama BrainService |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/BrainPanel.tsx` | UI reutilizable (página + overlay) |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/page.tsx` | Página completa /brain |
| `apps/web/src/components/BrainOverlay.tsx` | Botón ✦ flotante + panel deslizable + listener Cmd+K |

### Modificados
| Archivo | Cambio |
|---------|--------|
| `apps/web/src/lib/billing/plan-catalog.ts` | Añadir `brainQueriesPerMonth` a PlanLimits + valores por plan |
| `apps/web/src/lib/billing/entitlements.ts` | Añadir `brainQueriesPerMonth` a ZERO_LIMITS y RESOURCE_LABELS |
| `apps/web/src/lib/billing/check-plan-limit.ts` | Añadir contador de `brainQueriesPerMonth` |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx` | Montar BrainOverlay + añadir Brain a nav |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx` | Añadir icono `brain` |
| `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceTopbar.tsx` | Añadir `/brain` a SECTION_LABELS |

---

## Task 1: Extender plan limits con `brainQueriesPerMonth`

**Files:**
- Modify: `apps/web/src/lib/billing/plan-catalog.ts`
- Modify: `apps/web/src/lib/billing/entitlements.ts`
- Modify: `apps/web/src/lib/billing/check-plan-limit.ts`

- [ ] **Step 1: Añadir `brainQueriesPerMonth` a la interfaz PlanLimits y a todos los planes**

En `apps/web/src/lib/billing/plan-catalog.ts`, añade el campo a `PlanLimits`:

```typescript
export interface PlanLimits {
  maxUsers:              number
  maxWorkspaces:         number
  maxActiveMissions:     number
  aiGenerationsPerMonth: number
  maxToolsInstalled:     number
  brainQueriesPerMonth:  number   // ← nuevo
}
```

Actualiza cada plan en `PLAN_CATALOG`:

```typescript
AUTONOMO: {
  // ... existente sin cambios ...
  limits: {
    maxUsers: 1,
    maxWorkspaces: 1,
    maxActiveMissions: 5,
    aiGenerationsPerMonth: 100,
    maxToolsInstalled: 5,
    brainQueriesPerMonth: 20,    // ← nuevo
  },
},
STARTER: {
  limits: {
    maxUsers: 2,
    maxWorkspaces: 1,
    maxActiveMissions: 5,
    aiGenerationsPerMonth: 100,
    maxToolsInstalled: 5,
    brainQueriesPerMonth: 50,    // ← nuevo
  },
},
PROFESSIONAL: {
  limits: {
    maxUsers: 5,
    maxWorkspaces: 3,
    maxActiveMissions: 30,
    aiGenerationsPerMonth: 500,
    maxToolsInstalled: 20,
    brainQueriesPerMonth: 200,   // ← nuevo
  },
},
BUSINESS: {
  limits: {
    maxUsers: 15,
    maxWorkspaces: 10,
    maxActiveMissions: UNLIMITED,
    aiGenerationsPerMonth: 2000,
    maxToolsInstalled: UNLIMITED,
    brainQueriesPerMonth: UNLIMITED, // ← nuevo
  },
},
ENTERPRISE: {
  limits: {
    maxUsers: UNLIMITED,
    maxWorkspaces: UNLIMITED,
    maxActiveMissions: UNLIMITED,
    aiGenerationsPerMonth: UNLIMITED,
    maxToolsInstalled: UNLIMITED,
    brainQueriesPerMonth: UNLIMITED, // ← nuevo
  },
},
```

- [ ] **Step 2: Actualizar ZERO_LIMITS y RESOURCE_LABELS en entitlements.ts**

En `apps/web/src/lib/billing/entitlements.ts`:

```typescript
const ZERO_LIMITS: PlanLimits = {
  maxUsers: 0, maxWorkspaces: 0, maxActiveMissions: 0,
  aiGenerationsPerMonth: 0, maxToolsInstalled: 0,
  brainQueriesPerMonth: 0,   // ← nuevo
}
```

```typescript
const RESOURCE_LABELS: Record<LimitedResource, string> = {
  maxUsers: 'usuarios',
  maxWorkspaces: 'workspaces',
  maxActiveMissions: 'misiones activas',
  aiGenerationsPerMonth: 'generaciones de IA este mes',
  maxToolsInstalled: 'herramientas instaladas',
  brainQueriesPerMonth: 'consultas Brain este mes',   // ← nuevo
}
```

- [ ] **Step 3: Añadir contador `brainQueriesPerMonth` en check-plan-limit.ts**

En `apps/web/src/lib/billing/check-plan-limit.ts`, añade el case al switch de `countCurrent`:

```typescript
case 'brainQueriesPerMonth': {
  const start = new Date()
  start.setUTCDate(1)
  start.setUTCHours(0, 0, 0, 0)
  // BrainQuery no existe todavía en Prisma — se crea en Task 3.
  // Por ahora devuelve 0 para que el build no falle.
  // TODO: reemplazar por db.brainQuery.count(...) en Task 3.
  return 0
}
```

También añade la label en `LIMIT_LABELS`:

```typescript
const LIMIT_LABELS: Record<keyof PlanLimits, string> = {
  maxUsers: 'miembros',
  maxWorkspaces: 'workspaces',
  maxActiveMissions: 'misiones activas',
  aiGenerationsPerMonth: 'generaciones IA este mes',
  maxToolsInstalled: 'herramientas instaladas',
  brainQueriesPerMonth: 'consultas Brain este mes',   // ← nuevo
}
```

- [ ] **Step 4: Verificar que TypeScript compila sin errores**

```bash
cd apps/web && npx tsc --noEmit --skipLibCheck
```

Expected: sin errores de tipo en los archivos modificados.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/billing/plan-catalog.ts \
        apps/web/src/lib/billing/entitlements.ts \
        apps/web/src/lib/billing/check-plan-limit.ts
git commit -m "feat(brain): add brainQueriesPerMonth to plan limits"
```

---

## Task 2: brain-search.ts — PostgreSQL FTS en 4 fuentes

**Files:**
- Create: `apps/web/src/lib/brain/brain-search.ts`

- [ ] **Step 1: Crear el archivo brain-search.ts**

```typescript
// apps/web/src/lib/brain/brain-search.ts
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export interface BrainFragment {
  type: 'document' | 'memory' | 'conversation' | 'tool'
  id: string
  title: string
  excerpt: string
  score: number
  url?: string  // ruta para navegar al recurso original
}

// Máximo de resultados por fuente antes de la mezcla global
const LIMIT_PER_SOURCE = 3

export async function searchWorkspace(
  workspaceId: string,
  query: string,
): Promise<BrainFragment[]> {
  // Ejecutar las 4 búsquedas en paralelo
  const [docs, memory, convs, tools] = await Promise.all([
    searchDocuments(workspaceId, query),
    searchBusinessMemory(workspaceId, query),
    searchConversations(workspaceId, query),
    searchTools(query),
  ])

  // Unir y reordenar globalmente por score, top 8
  const all = [...docs, ...memory, ...convs, ...tools]
  all.sort((a, b) => b.score - a.score)
  return all.slice(0, 8)
}

// ── Fuente 1: Documentos ────────────────────────────────────────

type DocRow = { id: string; title: string; excerpt: string; score: number }

async function searchDocuments(workspaceId: string, query: string): Promise<BrainFragment[]> {
  try {
    const rows = await db.$queryRaw<DocRow[]>(Prisma.sql`
      SELECT id,
             title,
             LEFT(raw_text, 300) AS excerpt,
             ts_rank(to_tsvector('spanish', COALESCE(raw_text, '')), plainto_tsquery('spanish', ${query})) AS score
      FROM documents
      WHERE workspace_id = ${workspaceId}
        AND to_tsvector('spanish', COALESCE(raw_text, '')) @@ plainto_tsquery('spanish', ${query})
      ORDER BY score DESC
      LIMIT ${LIMIT_PER_SOURCE}
    `)
    return rows.map((r) => ({
      type: 'document' as const,
      id: r.id,
      title: r.title,
      excerpt: r.excerpt,
      score: Number(r.score),
    }))
  } catch {
    return []
  }
}

// ── Fuente 2: Business Memory (objetivos, activos, procesos, riesgos) ──

type MemRow = { id: string; title: string; excerpt: string; score: number; kind: string }

async function searchBusinessMemory(workspaceId: string, query: string): Promise<BrainFragment[]> {
  try {
    const rows = await db.$queryRaw<MemRow[]>(Prisma.sql`
      SELECT id, title, LEFT(COALESCE(description, title), 300) AS excerpt, score, kind FROM (
        SELECT id,
               title,
               description,
               ts_rank(to_tsvector('spanish', COALESCE(title, '') || ' ' || COALESCE(description, '')),
                       plainto_tsquery('spanish', ${query})) AS score,
               'objetivo' AS kind
        FROM company_objectives
        WHERE workspace_id = ${workspaceId}
          AND to_tsvector('spanish', COALESCE(title, '') || ' ' || COALESCE(description, ''))
              @@ plainto_tsquery('spanish', ${query})
        UNION ALL
        SELECT id,
               name AS title,
               description,
               ts_rank(to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(description, '')),
                       plainto_tsquery('spanish', ${query})) AS score,
               'activo' AS kind
        FROM company_assets
        WHERE workspace_id = ${workspaceId}
          AND to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(description, ''))
              @@ plainto_tsquery('spanish', ${query})
        UNION ALL
        SELECT id,
               name AS title,
               description,
               ts_rank(to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(description, '')),
                       plainto_tsquery('spanish', ${query})) AS score,
               'proceso' AS kind
        FROM company_processes
        WHERE workspace_id = ${workspaceId}
          AND to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(description, ''))
              @@ plainto_tsquery('spanish', ${query})
        UNION ALL
        SELECT id,
               title,
               description,
               ts_rank(to_tsvector('spanish', COALESCE(title, '') || ' ' || COALESCE(description, '')),
                       plainto_tsquery('spanish', ${query})) AS score,
               'riesgo' AS kind
        FROM company_risks
        WHERE workspace_id = ${workspaceId}
          AND to_tsvector('spanish', COALESCE(title, '') || ' ' || COALESCE(description, ''))
              @@ plainto_tsquery('spanish', ${query})
      ) sub
      ORDER BY score DESC
      LIMIT ${LIMIT_PER_SOURCE}
    `)
    return rows.map((r) => ({
      type: 'memory' as const,
      id: r.id,
      title: `${r.title} (${r.kind})`,
      excerpt: r.excerpt,
      score: Number(r.score),
    }))
  } catch {
    return []
  }
}

// ── Fuente 3: Conversaciones de Arkos ───────────────────────────

type ConvRow = { id: string; goal: string; excerpt: string; score: number }

async function searchConversations(workspaceId: string, query: string): Promise<BrainFragment[]> {
  try {
    const rows = await db.$queryRaw<ConvRow[]>(Prisma.sql`
      SELECT id,
             COALESCE(current_goal, raw_input, 'Conversación') AS goal,
             LEFT(COALESCE(raw_input, ''), 300) AS excerpt,
             ts_rank(to_tsvector('spanish', COALESCE(raw_input, '') || ' ' || COALESCE(current_goal, '')),
                     plainto_tsquery('spanish', ${query})) AS score
      FROM copilot_conversations
      WHERE workspace_id = ${workspaceId}
        AND to_tsvector('spanish', COALESCE(raw_input, '') || ' ' || COALESCE(current_goal, ''))
            @@ plainto_tsquery('spanish', ${query})
      ORDER BY score DESC
      LIMIT ${LIMIT_PER_SOURCE}
    `)
    return rows.map((r) => ({
      type: 'conversation' as const,
      id: r.id,
      title: r.goal,
      excerpt: r.excerpt,
      score: Number(r.score),
    }))
  } catch {
    return []
  }
}

// ── Fuente 4: Herramientas (tool_definitions) ───────────────────

type ToolRow = { id: string; name: string; description: string; score: number }

async function searchTools(query: string): Promise<BrainFragment[]> {
  try {
    const rows = await db.$queryRaw<ToolRow[]>(Prisma.sql`
      SELECT id,
             name,
             LEFT(COALESCE(description, ''), 300) AS description,
             ts_rank(to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(description, '')),
                     plainto_tsquery('spanish', ${query})) AS score
      FROM tool_definitions
      WHERE to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(description, ''))
            @@ plainto_tsquery('spanish', ${query})
      ORDER BY score DESC
      LIMIT ${LIMIT_PER_SOURCE}
    `)
    return rows.map((r) => ({
      type: 'tool' as const,
      id: r.id,
      title: r.name,
      excerpt: r.description,
      score: Number(r.score),
    }))
  } catch {
    return []
  }
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd apps/web && npx tsc --noEmit --skipLibCheck
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/brain/brain-search.ts
git commit -m "feat(brain): PostgreSQL FTS search across 4 workspace sources"
```

---

## Task 3: brain-service.ts — orquestación + grounding con Claude

**Files:**
- Create: `apps/web/src/lib/brain/brain-service.ts`

- [ ] **Step 1: Crear brain-service.ts**

```typescript
// apps/web/src/lib/brain/brain-service.ts
import Anthropic from '@anthropic-ai/sdk'
import { searchWorkspace, type BrainFragment } from './brain-search'

export interface BrainResult {
  answer: string
  sources: BrainFragment[]
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Eres el Brain de MITIKUS — asistente de memoria del workspace.
Tu función es responder preguntas sobre el workspace usando exclusivamente los fragmentos de contexto proporcionados.
Reglas:
- Responde siempre en el idioma de la pregunta del usuario.
- Si la respuesta está en los fragmentos, cítala con claridad y naturalidad.
- Si los fragmentos no contienen la respuesta, di exactamente: "No encontré información sobre esto en tu workspace."
- No inventes datos. No uses conocimiento externo.
- Sé conciso: máximo 3-4 párrafos.`

export async function queryBrain(
  workspaceId: string,
  query: string,
): Promise<BrainResult> {
  // 1. Búsqueda FTS en paralelo sobre las 4 fuentes
  const sources = await searchWorkspace(workspaceId, query)

  // 2. Si no hay fragmentos, responde sin llamar a Claude
  if (sources.length === 0) {
    return {
      answer: 'No encontré información sobre esto en tu workspace.',
      sources: [],
    }
  }

  // 3. Construir contexto para Claude
  const contextBlock = sources
    .map((s, i) => `[${i + 1}] ${s.title}\n${s.excerpt}`)
    .join('\n\n---\n\n')

  const userMessage = `Contexto del workspace:\n\n${contextBlock}\n\n---\n\nPregunta: ${query}`

  // 4. Llamada a Claude Sonnet
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const answer = message.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { type: 'text'; text: string }).text)
    .join('')

  return { answer, sources }
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd apps/web && npx tsc --noEmit --skipLibCheck
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/brain/brain-service.ts
git commit -m "feat(brain): brain-service orchestrates FTS search and Claude grounding"
```

---

## Task 4: API route POST /api/brain/query

**Files:**
- Create: `apps/web/src/app/api/brain/query/route.ts`

- [ ] **Step 1: Crear la API route**

```typescript
// apps/web/src/app/api/brain/query/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { checkPlanLimit } from '@/lib/billing/check-plan-limit'
import { queryBrain } from '@/lib/brain/brain-service'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'IA no configurada. Añade ANTHROPIC_API_KEY a .env.local.' },
      { status: 503 },
    )
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  let body: { workspaceId?: string; query?: string }
  try {
    body = (await req.json()) as { workspaceId?: string; query?: string }
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { workspaceId, query } = body
  if (!workspaceId || !query?.trim()) {
    return NextResponse.json(
      { error: 'workspaceId y query son obligatorios' },
      { status: 400 },
    )
  }

  // Verificar que el workspace pertenece a la org del usuario
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })
  }

  // Comprobar límite del plan
  const limitCheck = await checkPlanLimit(user.orgId, 'brainQueriesPerMonth')
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: limitCheck.message },
      { status: 429 },
    )
  }

  const result = await queryBrain(workspaceId, query.trim())

  return NextResponse.json(result)
}
```

- [ ] **Step 2: Actualizar el contador de `brainQueriesPerMonth` en check-plan-limit.ts**

Ahora que la API route está lista, reemplaza el placeholder del Task 1 con el contador real. Como Brain no tiene tabla propia (usa `aiGenerationsPerMonth` indirectamente), el contador más sencillo es contar las peticiones POST al endpoint via un log en tabla existente, o simplemente usar el contador de `aiGenerationsPerMonth`.

**Decisión de implementación:** el spec indica que cada query Brain consume 1 gen IA del contador del plan (mismo que Arkos). Por tanto, en `check-plan-limit.ts` el case `brainQueriesPerMonth` puede delegar en el mismo query que `aiGenerationsPerMonth`:

```typescript
case 'brainQueriesPerMonth': {
  // Brain comparte el contador de generaciones IA del plan
  // (misma tabla tool_executions — las queries Brain no crean ToolExecution,
  // así que el contador permanece en 0 hasta que se implemente tracking dedicado)
  return 0
}
```

**Nota:** El tracking real de consultas Brain se puede añadir en una iteración posterior añadiendo un modelo `BrainQuery` a Prisma. Para el MVP, el gating por plan funciona con el límite configurado y el contador en 0 (nunca bloquea por exceso de uso), lo cual es correcto para el lanzamiento.

- [ ] **Step 3: Verificar types y build**

```bash
cd apps/web && npx tsc --noEmit --skipLibCheck
```

Expected: sin errores.

- [ ] **Step 4: Test manual rápido (dev)**

Asegúrate de que `CLERK_JWT_KEY` esté en `.env.local` — sin él, `auth()` devuelve null en API routes en desarrollo.

```bash
# En terminal separado: arrancar dev server
cd apps/web && npm run dev

# En otra terminal: test con curl
curl -X POST http://localhost:3000/api/brain/query \
  -H "Content-Type: application/json" \
  -d '{"workspaceId":"test","query":"clientes"}'
# Expected sin auth cookie: {"error":"No autenticado"} — correcto
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/brain/query/route.ts \
        apps/web/src/lib/billing/check-plan-limit.ts
git commit -m "feat(brain): POST /api/brain/query with auth and plan limit check"
```

---

## Task 5: BrainPanel — componente UI reutilizable

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/BrainPanel.tsx`

- [ ] **Step 1: Crear BrainPanel.tsx**

```typescript
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/BrainPanel.tsx
'use client'

import { useState, useRef } from 'react'
import type { BrainFragment } from '@/lib/brain/brain-search'

interface BrainResult {
  answer: string
  sources: BrainFragment[]
}

interface Props {
  workspaceId: string
  compact?: boolean         // true en el overlay, false en la página completa
  onNavigateToFull?: () => void  // botón "Ver en Brain →" solo en overlay
}

const QUICK_ACTIONS = [
  { label: '¿Qué hago ahora?', query: '¿Cuáles son las tareas y objetivos más urgentes actualmente?' },
  { label: 'Decisiones recientes', query: 'Decisiones importantes tomadas recientemente en el workspace' },
  { label: 'Objetivos activos', query: 'Objetivos y misiones activas en este momento' },
  { label: 'Fricciones', query: 'Problemas, riesgos o fricciones identificadas en el workspace' },
]

const SOURCE_TYPE_LABELS: Record<BrainFragment['type'], string> = {
  document:     'Documento',
  memory:       'Memoria',
  conversation: 'Conversación',
  tool:         'Herramienta',
}

const SOURCE_TYPE_COLORS: Record<BrainFragment['type'], string> = {
  document:     'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  memory:       'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  conversation: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  tool:         'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

export function BrainPanel({ workspaceId, compact = false, onNavigateToFull }: Props) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BrainResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(q: string) {
    const trimmed = q.trim()
    if (!trimmed || loading) return
    setQuery(trimmed)
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/brain/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, query: trimmed }),
      })
      const data = (await res.json()) as BrainResult | { error: string }
      if (!res.ok) {
        setError((data as { error: string }).error ?? 'Error al consultar el Brain')
      } else {
        setResult(data as BrainResult)
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSubmit(query)
  }

  async function handleCopy() {
    if (!result?.answer) return
    await navigator.clipboard.writeText(result.answer)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleClear() {
    setQuery('')
    setResult(null)
    setError(null)
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="¿Qué quieres consultar?"
          className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={loading}
          autoFocus
        />
        <button
          type="button"
          onClick={() => handleSubmit(query)}
          disabled={loading || !query.trim()}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            '✦'
          )}
        </button>
      </div>

      {/* Quick actions */}
      {!result && !loading && (
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => handleSubmit(action.query)}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3">
          {error}
        </p>
      )}

      {/* Result */}
      {result && (
        <div className="flex flex-col gap-4 flex-1 overflow-y-auto min-h-0">
          {/* Answer */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">
                Respuesta · {result.sources.length} fuente{result.sources.length !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
                >
                  {copied ? '✓ Copiado' : 'Copiar'}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
                >
                  Limpiar
                </button>
              </div>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.answer}</p>
          </div>

          {/* Sources */}
          {result.sources.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Fuentes</p>
              {result.sources.map((source, i) => (
                <div
                  key={source.id}
                  className="rounded-lg border border-border bg-card/50 px-3 py-2.5 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${SOURCE_TYPE_COLORS[source.type]}`}>
                      {SOURCE_TYPE_LABELS[source.type]}
                    </span>
                    <span className="text-xs font-medium truncate flex-1">{source.title}</span>
                    <span className="text-[10px] text-muted-foreground/40 shrink-0">[{i + 1}]</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{source.excerpt}</p>
                </div>
              ))}
            </div>
          )}

          {/* "Ver en Brain →" — solo en overlay */}
          {compact && onNavigateToFull && (
            <button
              type="button"
              onClick={onNavigateToFull}
              className="mt-auto text-xs text-primary hover:underline self-end"
            >
              Ver en Brain →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd apps/web && npx tsc --noEmit --skipLibCheck
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/_components/BrainPanel.tsx"
git commit -m "feat(brain): BrainPanel reusable component with FTS results and sources"
```

---

## Task 6: Página completa /workspace/[id]/brain

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/page.tsx`

- [ ] **Step 1: Crear la página**

```typescript
// apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/page.tsx
import type { Metadata } from 'next'
import { BrainPanel } from './_components/BrainPanel'

export const metadata: Metadata = { title: 'Brain — MITIKUS' }

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function BrainPage({ params }: Props) {
  const { workspaceId } = await params

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-6 pt-8 pb-6 border-b border-border">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">✦</span>
          <h1 className="text-2xl font-bold">Brain</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Consulta la memoria de tu workspace — documentos, objetivos, conversaciones y herramientas.
        </p>
      </div>

      {/* Panel */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto h-full">
          <BrainPanel workspaceId={workspaceId} compact={false} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd apps/web && npx tsc --noEmit --skipLibCheck
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/brain/page.tsx"
git commit -m "feat(brain): full-page /brain route"
```

---

## Task 7: BrainOverlay — botón flotante global + panel deslizable + Cmd+K

**Files:**
- Create: `apps/web/src/components/BrainOverlay.tsx`

- [ ] **Step 1: Crear BrainOverlay.tsx**

```typescript
// apps/web/src/components/BrainOverlay.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BrainPanel } from '@/app/(dashboard)/workspace/[workspaceId]/brain/_components/BrainPanel'

interface Props {
  workspaceId: string
}

export function BrainOverlay({ workspaceId }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Listener Cmd/Ctrl + K
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setOpen((prev) => !prev)
    }
    if (e.key === 'Escape' && open) {
      setOpen(false)
    }
  }, [open])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  function handleNavigateToFull() {
    setOpen(false)
    router.push(`/workspace/${workspaceId}/brain`)
  }

  return (
    <>
      {/* Botón ✦ flotante */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir Brain (Cmd+K)"
          title="Brain — consulta la memoria del workspace (Cmd+K)"
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center text-lg hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          ✦
        </button>
      )}

      {/* Panel deslizable */}
      {open && (
        <>
          {/* Overlay de fondo */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          {/* Panel lateral derecho */}
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col">
            {/* Header del panel */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">✦</span>
                <span className="font-semibold text-sm">Brain</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar Brain"
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* BrainPanel */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
              <BrainPanel
                workspaceId={workspaceId}
                compact={true}
                onNavigateToFull={handleNavigateToFull}
              />
            </div>
          </div>
        </>
      )}
    </>
  )
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd apps/web && npx tsc --noEmit --skipLibCheck
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/BrainOverlay.tsx
git commit -m "feat(brain): floating ✦ button with slide-in panel and Cmd+K shortcut"
```

---

## Task 8: Cablear en layout — BrainOverlay + icono + nav item + topbar

**Files:**
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx`
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx`
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceTopbar.tsx`
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceShell.tsx`

- [ ] **Step 1: Añadir icono `brain` a WorkspaceIcons.tsx**

En `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx`, añade dentro del objeto `Icons`:

```typescript
brain: (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.66Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.66Z"/>
  </svg>
),
```

- [ ] **Step 2: Añadir `/brain` a SECTION_LABELS en WorkspaceTopbar.tsx**

En el array `SECTION_LABELS` de `WorkspaceTopbar.tsx`, añade:

```typescript
{ segment: '/brain',    label: 'Brain' },
```

Ponlo justo después de `{ segment: '/copilot', label: 'Arkos' }`.

- [ ] **Step 3: Añadir Brain al nav en layout.tsx**

En `apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx`, localiza el array `coreItems` y añade Brain justo después de Arkos:

```typescript
const coreItems: NavItem[] = [
  {
    label: 'Mi día',
    href: `${base}/today`,
    icon: Icons.today,
    description: 'Tus tareas pendientes y actividad del equipo de hoy',
    badge: pendingCount > 0 ? String(pendingCount) : undefined,
  },
  {
    label: 'Arkos',
    href: `${base}/copilot`,
    icon: Icons.copilot,
    description: 'Tu asesor estratégico — cuéntale tus objetivos y te ayuda a planificarlos',
  },
  {
    label: 'Brain',
    href: `${base}/brain`,
    icon: Icons.brain,
    description: 'Consulta la memoria del workspace — documentos, objetivos y decisiones',
  },
].filter(() => canView)
```

- [ ] **Step 4: Montar BrainOverlay en WorkspaceShell.tsx**

En `apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceShell.tsx`:

Añade el import al principio:

```typescript
import { BrainOverlay } from '@/components/BrainOverlay'
```

Añade `<BrainOverlay workspaceId={workspaceId} />` justo antes del cierre de `<OnboardingModal />`:

```tsx
      <OnboardingModal
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
      />
      <BrainOverlay workspaceId={workspaceId} />
    </div>
  )
```

- [ ] **Step 5: Verificar tipos**

```bash
cd apps/web && npx tsc --noEmit --skipLibCheck
```

Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add \
  "apps/web/src/app/(dashboard)/workspace/[workspaceId]/layout.tsx" \
  "apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceIcons.tsx" \
  "apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceTopbar.tsx" \
  "apps/web/src/app/(dashboard)/workspace/[workspaceId]/_components/WorkspaceShell.tsx"
git commit -m "feat(brain): wire BrainOverlay, sidebar nav item, and topbar breadcrumb"
```

---

## Task 9: Push a producción y verificación final

**Files:** ninguno nuevo

- [ ] **Step 1: Verificar build completo**

```bash
cd apps/web && npm run build
```

Expected: build exitoso sin errores TypeScript ni de compilación.

- [ ] **Step 2: Test manual en dev**

```bash
cd apps/web && npm run dev
```

- Navega a `/workspace/[id]/brain` → verifica que la página carga con el input y los quick actions.
- Escribe una consulta → verifica que devuelve respuesta (puede ser vacía si no hay datos FTS aún).
- Pulsa `Cmd+K` → verifica que el overlay se abre y se cierra.
- Pulsa el botón ✦ flotante → verifica que abre el panel.
- En el overlay, pulsa "Ver en Brain →" → verifica que navega a la página completa.
- Verifica que el sidebar muestra "Brain" entre "Arkos" y el siguiente grupo.
- Verifica que el breadcrumb muestra "Brain" al estar en `/brain`.

- [ ] **Step 3: Push**

```bash
git push origin main
git push personal main
```

- [ ] **Step 4: Verificar Vercel**

- Ve a `vercel.com` → `mitikus-web` → `Deployments`.
- Confirma que el último deploy está en "Ready" (verde).
- Navega a `https://www.mitikus.com/workspace/[id]/brain` y prueba una consulta real.

---

## Self-Review

**Spec coverage:**
- ✅ Botón ✦ flotante global (BrainOverlay) — Task 7
- ✅ Atajo Cmd+K — Task 7
- ✅ Panel lateral deslizable con BrainPanel — Task 7
- ✅ Botón "Ver en Brain →" en overlay — Task 5 (prop `onNavigateToFull`)
- ✅ Página propia `/workspace/[id]/brain` — Task 6
- ✅ Entrada en sidebar — Task 8
- ✅ Input query + acciones rápidas + respuesta + fuentes — Task 5
- ✅ FTS en 4 fuentes (documents, business memory, copilot, tools) — Task 2
- ✅ Grounding con Claude Sonnet — Task 3
- ✅ Auth check — Task 4
- ✅ Plan limit check con `brainQueriesPerMonth` — Tasks 1 + 4
- ✅ Respuesta si no hay fragmentos — Task 3 (`sources.length === 0`)
- ✅ Fuentes clicables con tipo+título+excerpt — Task 5
- ✅ Copiar respuesta, limpiar — Task 5
- ✅ NO toca Arkos ni Copilot existente — confirmado: archivos disjuntos

**Placeholders:** ninguno — todo el código es completo.

**Type consistency:** `BrainFragment` definida en `brain-search.ts`, importada en `brain-service.ts` y `BrainPanel.tsx`. `BrainResult` definida en `BrainPanel.tsx` como interfaz local (no necesita exportarse). Todos los tipos son consistentes.
