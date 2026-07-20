# AI Workflow Generation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que el usuario describa un proceso en lenguaje natural y la IA genere automáticamente un workflow completo con nodos, conexiones e instalación de herramientas.

**Architecture:** Un wizard modal de 3 pasos (Client Component) llama a `POST /api/workflows/generate` en dos fases: primero genera preguntas de contexto, luego genera el grafo. El servidor instala automáticamente las herramientas pendientes usando `installToolFromRegistry`, crea el workflow con `createWorkflow` y guarda el grafo con `saveWorkflowGraph`. El CTA aparece en `/workflows/new` y en el canvas vacío.

**Tech Stack:** Next.js 15 App Router, React, Anthropic claude-sonnet-4-6, ReactFlow, Prisma, Server Actions existentes.

---

## Mapa de ficheros

### Nuevos
- `apps/web/src/app/api/workflows/generate/route.ts` — endpoint que orquesta las dos llamadas a Claude
- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/workflows/_components/AIWorkflowModal.tsx` — modal 3 pasos (Client Component)

### Modificados
- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/workflows/new/page.tsx` — añadir columna con CTA "Generar con IA"
- `apps/web/src/app/(dashboard)/workspace/[workspaceId]/workflows/[workflowId]/_components/WorkflowEditor.tsx` — detectar canvas vacío y mostrar CTA

---

## Task 1: Endpoint `POST /api/workflows/generate`

**Files:**
- Create: `apps/web/src/app/api/workflows/generate/route.ts`

- [ ] **Step 1: Crear el fichero con la lógica de preguntas**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'
import { checkAllLimits } from '@/lib/ai-rate-limit'
import { createWorkflow, saveWorkflowGraph } from '@/app/actions/workflows'

export const runtime = 'nodejs'
export const maxDuration = 60

const client = new Anthropic()
const MODEL = 'claude-sonnet-4-6'

interface ToolOption {
  id: string
  slug: string
  name: string
  description: string
  category: string
}

interface QuestionsRequest {
  step: 'questions'
  objective: string
  sector: string
}

interface GenerateRequest {
  step: 'generate'
  objective: string
  sector: string
  answers: string[]
  workspaceId: string
}

type RequestBody = QuestionsRequest | GenerateRequest

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true, role: true },
  })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const limits = await checkAllLimits(user.id, user.orgId)
  if (!limits.allowed) {
    return NextResponse.json({ error: limits.reason }, { status: 429 })
  }

  const body: RequestBody = await req.json().catch(() => null)
  if (!body?.step) return NextResponse.json({ error: 'Parámetro step requerido' }, { status: 400 })

  if (body.step === 'questions') {
    return handleQuestions(body)
  }
  if (body.step === 'generate') {
    return handleGenerate(body, user.id, user.orgId)
  }
  return NextResponse.json({ error: 'step inválido' }, { status: 400 })
}
```

- [ ] **Step 2: Añadir la función `handleQuestions` al mismo fichero**

```typescript
async function handleQuestions(body: QuestionsRequest): Promise<NextResponse> {
  const { objective, sector } = body
  if (!objective?.trim() || !sector?.trim()) {
    return NextResponse.json({ error: 'objective y sector son obligatorios' }, { status: 400 })
  }

  const prompt = `Eres un consultor de procesos empresariales. El usuario quiere crear un workflow automatizado.

Objetivo: ${objective}
Sector: ${sector}

Genera exactamente 3 preguntas cortas y concretas (máximo 15 palabras cada una) para entender mejor el proceso y poder elegir las herramientas correctas. Las preguntas deben ayudar a decidir qué pasos incluir.

Responde SOLO con un JSON válido en este formato exacto:
{"questions": ["pregunta 1", "pregunta 2", "pregunta 3"]}`

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''
  const parsed = JSON.parse(text) as { questions: string[] }

  return NextResponse.json({ questions: parsed.questions })
}
```

- [ ] **Step 3: Añadir la función `handleGenerate` al mismo fichero**

```typescript
async function handleGenerate(
  body: GenerateRequest,
  userId: string,
  orgId: string,
): Promise<NextResponse> {
  const { objective, sector, answers, workspaceId } = body
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId requerido' }, { status: 400 })

  // Verificar que el workspace pertenece a la org del usuario
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId },
  })
  if (!workspace) return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })

  // Obtener catálogo público de herramientas
  const tools = await db.toolDefinition.findMany({
    where: { isPublic: true },
    select: { id: true, slug: true, name: true, description: true, category: true },
    orderBy: { name: 'asc' },
  })

  const toolList = tools.map((t) =>
    `- id:"${t.id}" slug:"${t.slug}" nombre:"${t.name}" categoría:${t.category} — ${t.description.slice(0, 80)}`,
  ).join('\n')

  const answersText = answers.map((a, i) => `Respuesta ${i + 1}: ${a}`).join('\n')

  const prompt = `Eres un experto en automatización de procesos empresariales para la plataforma MITIKUS.

El usuario quiere crear un workflow con estas características:
Objetivo: ${objective}
Sector: ${sector}
${answersText}

Herramientas disponibles en el catálogo:
${toolList}

Selecciona entre 3 y 6 herramientas del catálogo que formen un proceso lógico y secuencial para este objetivo. Ordénalas en el orden de ejecución correcto.

REGLAS:
- Solo puedes usar herramientas de la lista de arriba (por su id exacto)
- Si ninguna herramienta encaja para un paso, omítelo (no inventes herramientas)
- El workflow debe tener sentido como proceso de negocio
- El nombre del workflow debe ser conciso (máximo 60 caracteres)

Responde SOLO con un JSON válido en este formato exacto:
{
  "workflowName": "nombre del workflow",
  "nodes": [
    {"toolId": "id-exacto", "toolSlug": "slug-exacto", "toolName": "nombre", "label": "Descripción del paso", "reason": "Por qué este paso"}
  ]
}`

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''
  const generated = JSON.parse(text) as {
    workflowName: string
    nodes: Array<{ toolId: string; toolSlug: string; toolName: string; label: string; reason: string }>
  }

  // Detectar qué herramientas no están instaladas en el workspace
  const installedInstances = await db.toolInstance.findMany({
    where: {
      workspaceId,
      status: 'ACTIVE',
      toolDefinitionId: { in: generated.nodes.map((n) => n.toolId) },
    },
    select: { toolDefinitionId: true, id: true },
  })
  const installedMap = new Map(installedInstances.map((i) => [i.toolDefinitionId, i.id]))

  const nodesWithInstallStatus = generated.nodes.map((n) => ({
    ...n,
    needsInstall: !installedMap.has(n.toolId),
    instanceId: installedMap.get(n.toolId) ?? null,
  }))

  return NextResponse.json({
    workflowName: generated.workflowName,
    nodes: nodesWithInstallStatus,
    workspaceId,
  })
}
```

- [ ] **Step 4: Añadir el endpoint `POST /api/workflows/generate/confirm`** — acepta la preview, instala herramientas, crea workflow y guarda grafo

Añadir al mismo fichero `route.ts` una segunda función exportada:

```typescript
// Segunda ruta en el mismo fichero: /api/workflows/generate/confirm
// No es posible en Next.js — crear fichero separado en el step 5
```

- [ ] **Step 5: Crear `apps/web/src/app/api/workflows/generate/confirm/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { createWorkflow, saveWorkflowGraph } from '@/app/actions/workflows'
import { installToolFromRegistry } from '@/app/actions/registry'

export const runtime = 'nodejs'

interface ConfirmNode {
  toolId: string
  toolName: string
  label: string
  needsInstall: boolean
}

interface ConfirmRequest {
  workspaceId: string
  workflowName: string
  nodes: ConfirmNode[]
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true },
  })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const body: ConfirmRequest = await req.json().catch(() => null)
  if (!body?.workspaceId || !body?.workflowName || !body?.nodes?.length) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const { workspaceId, workflowName, nodes } = body

  // Verificar workspace
  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!workspace) return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })

  // 1. Instalar herramientas pendientes
  for (const node of nodes.filter((n) => n.needsInstall)) {
    const result = await installToolFromRegistry(node.toolId, workspaceId)
    if ('error' in result) {
      return NextResponse.json(
        { error: `No se pudo instalar "${node.toolName}": ${result.error}` },
        { status: 400 },
      )
    }
  }

  // 2. Obtener instancias recién instaladas
  const instances = await db.toolInstance.findMany({
    where: {
      workspaceId,
      status: 'ACTIVE',
      toolDefinitionId: { in: nodes.map((n) => n.toolId) },
    },
    select: { toolDefinitionId: true, id: true },
  })
  const instanceMap = new Map(instances.map((i) => [i.toolDefinitionId, i.id]))

  // 3. Crear workflow
  const workflowResult = await createWorkflow(workspaceId, workflowName)
  if ('error' in workflowResult) {
    return NextResponse.json({ error: workflowResult.error }, { status: 500 })
  }
  const workflowId = workflowResult.id

  // 4. Construir grafo lineal con posiciones
  const SPACING_X = 250
  const BASE_Y = 200
  const ZIGZAG_Y = 350

  const graphNodes = nodes.map((n, i) => ({
    id: `ai-node-${i}`,
    toolDefinitionId: n.toolId,
    label: n.label,
    positionX: 100 + i * SPACING_X,
    positionY: nodes.length > 5 && i % 2 !== 0 ? ZIGZAG_Y : BASE_Y,
    inputMapping: {} as Record<string, string>,
    configOverride: {} as Record<string, unknown>,
    isDisabled: false,
  }))

  const graphConnections = graphNodes.slice(0, -1).map((n, i) => ({
    sourceNodeId: n.id,
    targetNodeId: graphNodes[i + 1]!.id,
    sourceHandle: 'output',
    targetHandle: 'input',
  }))

  // 5. Guardar grafo
  const saveResult = await saveWorkflowGraph(workflowId, workspaceId, {
    nodes: graphNodes,
    connections: graphConnections,
  })
  if ('error' in saveResult) {
    return NextResponse.json({ error: saveResult.error }, { status: 500 })
  }

  return NextResponse.json({ workflowId, workspaceId })
}
```

- [ ] **Step 6: Verificar que compila**

```bash
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | head -20
```

Salida esperada: sin errores.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/api/workflows/generate/
git commit -m "feat(api): POST /api/workflows/generate and /confirm for AI workflow creation"
```

---

## Task 2: Modal `AIWorkflowModal.tsx`

**Files:**
- Create: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/workflows/_components/AIWorkflowModal.tsx`

- [ ] **Step 1: Crear el componente — tipos y estado**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'context' | 'questions' | 'preview'

interface GeneratedNode {
  toolId: string
  toolSlug: string
  toolName: string
  label: string
  reason: string
  needsInstall: boolean
}

interface Props {
  workspaceId: string
  trigger?: React.ReactNode  // Si se omite, el modal se muestra directamente (modo canvas vacío)
}
```

- [ ] **Step 2: Añadir el estado y los handlers**

```typescript
export function AIWorkflowModal({ workspaceId, trigger }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(!trigger)  // Abierto por defecto si no hay trigger
  const [step, setStep] = useState<Step>('context')

  // Paso 1
  const [objective, setObjective] = useState('')
  const [sector, setSector] = useState('')

  // Paso 2
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])

  // Paso 3
  const [workflowName, setWorkflowName] = useState('')
  const [nodes, setNodes] = useState<GeneratedNode[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGetQuestions() {
    if (!objective.trim() || !sector.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/workflows/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'questions', objective, sector }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setQuestions(data.questions)
      setAnswers(data.questions.map(() => ''))
      setStep('questions')
    } catch { setError('Error de red') } finally { setLoading(false) }
  }

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/workflows/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'generate', objective, sector, answers, workspaceId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setWorkflowName(data.workflowName)
      setNodes(data.nodes)
      setStep('preview')
    } catch { setError('Error de red') } finally { setLoading(false) }
  }

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/workflows/generate/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, workflowName, nodes }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push(`/workspace/${workspaceId}/workflows/${data.workflowId}`)
    } catch { setError('Error de red') } finally { setLoading(false) }
  }

  function reset() {
    setStep('context')
    setObjective('')
    setSector('')
    setQuestions([])
    setAnswers([])
    setWorkflowName('')
    setNodes([])
    setError(null)
  }
```

- [ ] **Step 3: Añadir el JSX del modal**

```typescript
  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-lg space-y-5 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <h2 className="text-base font-semibold">Generar workflow con IA</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step === 'context' && 'Describe el proceso que quieres automatizar'}
              {step === 'questions' && 'La IA necesita un poco más de contexto'}
              {step === 'preview' && 'Revisa el workflow antes de crearlo'}
            </p>
          </div>
          {trigger && (
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
          )}
        </div>

        {/* Paso 1 — Contexto */}
        {step === 'context' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Objetivo del workflow *</label>
              <input
                autoFocus
                type="text"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="ej. Onboarding de nuevos clientes"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Sector o tipo de empresa *</label>
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="ej. Consultoría IT, Retail, RRHH"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={100}
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-3 pt-1">
              {trigger && (
                <button onClick={() => setOpen(false)} className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-muted/30 transition-colors">
                  Cancelar
                </button>
              )}
              <button
                onClick={handleGetQuestions}
                disabled={loading || !objective.trim() || !sector.trim()}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {loading ? 'Analizando...' : 'Siguiente →'}
              </button>
            </div>
          </div>
        )}

        {/* Paso 2 — Preguntas */}
        {step === 'questions' && (
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="space-y-1.5">
                <label className="text-xs font-medium">{q}</label>
                <input
                  type="text"
                  value={answers[i] ?? ''}
                  onChange={(e) => setAnswers((prev) => prev.map((a, idx) => idx === i ? e.target.value : a))}
                  placeholder="Tu respuesta..."
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setStep('context')} className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-muted/30 transition-colors">
                ← Volver
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {loading ? 'Generando workflow...' : 'Generar workflow ✨'}
              </button>
            </div>
          </div>
        )}

        {/* Paso 3 — Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nombre del workflow</label>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pasos del workflow ({nodes.length})</p>
              <div className="rounded-xl border bg-card divide-y overflow-hidden">
                {nodes.map((node, i) => (
                  <div key={node.toolId} className="flex items-start gap-3 px-4 py-3">
                    <span className="text-xs font-mono text-muted-foreground mt-0.5 w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{node.label}</span>
                        {node.needsInstall && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
                            Se instalará
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{node.toolName} — {node.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
              {nodes.some((n) => n.needsInstall) && (
                <p className="text-xs text-muted-foreground">
                  Las herramientas marcadas se instalarán automáticamente en tu workspace.
                </p>
              )}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={reset} className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-muted/30 transition-colors">
                ← Volver a editar
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {loading ? 'Creando...' : 'Crear workflow →'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )

  if (!trigger) return open ? modalContent : null

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      {open && modalContent}
    </>
  )
}
```

- [ ] **Step 4: Verificar que compila**

```bash
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | head -20
```

Salida esperada: sin errores.

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/workflows/_components/AIWorkflowModal.tsx"
git commit -m "feat(ui): AIWorkflowModal — 3-step wizard for AI workflow generation"
```

---

## Task 3: CTA en `/workflows/new`

**Files:**
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/workflows/new/page.tsx`

- [ ] **Step 1: Reemplazar el contenido de la página por un layout de dos columnas**

El fichero actual es un Client Component con un formulario manual. Hay que añadir a la derecha un CTA que abre el `AIWorkflowModal`.

Sustituir el contenido del `return` (manteniendo toda la lógica de formulario existente):

```typescript
// Añadir al import existente:
import { AIWorkflowModal } from '../_components/AIWorkflowModal'

// Sustituir el return por:
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

        {/* Columna izquierda — formulario manual (código existente) */}
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <div className="text-4xl mb-4">🔗</div>
          <h1 className="text-xl font-semibold mb-1">Nuevo Workflow</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Define un nombre y descripción. Añadirás los pasos en el editor de canvas.
          </p>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Nombre del workflow *</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. Análisis estratégico completo"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Descripción <span className="text-muted-foreground">(opcional)</span></label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ej. DAFO → Análisis competencia → Plan de acción → Informe ejecutivo"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                maxLength={500}
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={!name.trim() || isCreating}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {isCreating ? 'Creando…' : 'Crear y abrir editor →'}
            </button>
          </form>
        </div>

        {/* Columna derecha — generar con IA */}
        <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 flex flex-col items-center text-center gap-4">
          <div className="text-4xl">✨</div>
          <div>
            <h2 className="text-lg font-semibold">Generar con IA</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Describe tu proceso en lenguaje natural y la IA crea el workflow automáticamente, eligiendo y conectando las herramientas por ti.
            </p>
          </div>
          <AIWorkflowModal
            workspaceId={workspaceId}
            trigger={
              <button className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                ✨ Generar con IA
              </button>
            }
          />
        </div>

      </div>
    </div>
  )
```

- [ ] **Step 2: Verificar que compila**

```bash
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/workflows/new/page.tsx"
git commit -m "feat(ui): add AI generation CTA to /workflows/new page"
```

---

## Task 4: CTA en el canvas vacío

**Files:**
- Modify: `apps/web/src/app/(dashboard)/workspace/[workspaceId]/workflows/[workflowId]/_components/WorkflowEditor.tsx`

El editor recibe `workflow` como prop — `workflow.nodes` es el array de nodos. Si está vacío, mostrar un CTA centrado en el canvas.

- [ ] **Step 1: Añadir import del modal y CTA dentro del canvas**

En `WorkflowEditor.tsx`, localizar el bloque del componente `ReactFlow` y añadir el CTA como overlay cuando no hay nodos.

Primero añadir el import al inicio del fichero:

```typescript
import { AIWorkflowModal } from '../../_components/AIWorkflowModal'
```

Nota: la ruta relativa sube dos niveles desde `[workflowId]/_components/` hasta `workflows/_components/`.

- [ ] **Step 2: Añadir estado para saber si el canvas está vacío**

Dentro de `WorkflowEditor`, añadir:

```typescript
const isEmpty = nodes.length === 0
```

- [ ] **Step 3: Añadir el overlay en el JSX del canvas**

Dentro del bloque `<ReactFlowProvider>` o del wrapper principal del editor, localizar el `<div ref={reactFlowWrapper}>` que contiene el `<ReactFlow ...>` y añadir el overlay antes del cierre del div:

```typescript
{isEmpty && (
  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
    <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-card/90 backdrop-blur-sm p-8 flex flex-col items-center text-center gap-4 max-w-sm pointer-events-auto">
      <div className="text-4xl">✨</div>
      <div>
        <h3 className="text-base font-semibold">Canvas vacío</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Arrastra herramientas desde el panel izquierdo, o deja que la IA monte el workflow por ti.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <AIWorkflowModal
          workspaceId={workflow.workspaceId}
          trigger={
            <button className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              ✨ Generar con IA
            </button>
          }
        />
        <p className="text-xs text-muted-foreground">o arrastra una herramienta para empezar</p>
      </div>
    </div>
  </div>
)}
```

El div padre del canvas debe tener `position: relative` — verificar que el wrapper ya lo tiene; si no, añadir `className="relative"`.

- [ ] **Step 4: Verificar que `workflow.workspaceId` existe en el tipo `WorkflowDetail`**

```bash
cd C:\Users\priet\protools-hub\apps\web
grep -n "workspaceId" src/app/actions/workflows.ts | head -20
```

Si `WorkflowDetail` no tiene `workspaceId`, añadirlo en `getWorkflowDetail`:

En `src/app/actions/workflows.ts`, en la interfaz `WorkflowDetail` añadir:
```typescript
workspaceId: string
```
Y en `getWorkflowDetail`, en el return añadir:
```typescript
workspaceId: workflow.workspaceId,
```

- [ ] **Step 5: Verificar que compila**

```bash
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit 2>&1 | head -30
```

Salida esperada: sin errores.

- [ ] **Step 6: Commit**

```bash
git add "apps/web/src/app/(dashboard)/workspace/[workspaceId]/workflows/[workflowId]/_components/WorkflowEditor.tsx"
git add apps/web/src/app/actions/workflows.ts
git commit -m "feat(ui): show AI generation CTA on empty workflow canvas"
```

---

## Task 5: Deploy y verificación

- [ ] **Step 1: Type-check completo**

```bash
cd C:\Users\priet\protools-hub\apps\web
npx tsc --noEmit
```

Salida esperada: sin errores.

- [ ] **Step 2: Push y deploy**

```bash
cd C:\Users\priet\protools-hub
git push
npx vercel deploy --prod 2>&1 | Select-String "Aliased|READY|error"
```

- [ ] **Step 3: Verificar flujo completo en producción**

1. Ir a `mitikus.com/workspace/[id]/workflows/new`
2. Hacer clic en "✨ Generar con IA"
3. Rellenar objetivo + sector → "Siguiente"
4. Responder las 3 preguntas → "Generar workflow"
5. Verificar que la preview muestra nodos y badges "Se instalará"
6. Hacer clic "Crear workflow"
7. Verificar que el editor se abre con los nodos ya conectados en el canvas

---

## Self-Review

### Cobertura de spec

| Requisito spec | Task |
|---|---|
| Botón en `/workflows/new` | Task 3 |
| Botón en canvas vacío | Task 4 |
| Modal paso 1 — objetivo + sector | Task 2 |
| Modal paso 2 — preguntas IA | Task 2 |
| Modal paso 3 — preview con badges | Task 2 |
| `POST /api/workflows/generate` step=questions | Task 1 |
| `POST /api/workflows/generate` step=generate | Task 1 |
| Instalación automática de herramientas | Task 1 (confirm route) |
| Creación de workflow + grafo lineal | Task 1 (confirm route) |
| Posicionamiento con zigzag >5 nodos | Task 1 (confirm route) |
| Rate limiting existente aplicado | Task 1 |

### Consistencia de tipos

- `GeneratedNode` se define en Task 2 y se usa en Tasks 2 y 1 (confirm).
- El confirm route espera `nodes: ConfirmNode[]` que tiene los mismos campos que `GeneratedNode` — son compatibles.
- `workflow.workspaceId` se verifica en Task 4 Step 4 antes de usarlo.
- `AIWorkflowModal` recibe `workspaceId: string` y `trigger?: React.ReactNode` — consistente en Tasks 3 y 4.

### Sin placeholders

Todos los pasos tienen código completo. No hay "TBD" ni "TODO".
