import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'
import { checkAllLimits } from '@/lib/ai-rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 60

const MODEL = 'claude-sonnet-4-6'

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

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  return new Anthropic({ apiKey })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true, role: true },
  })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Proveedor IA no configurado.' }, { status: 503 })
  }

  const limitResult = await checkAllLimits(user.id, user.orgId)
  if (limitResult !== null) {
    return NextResponse.json({ error: limitResult.reason }, { status: 429 })
  }

  const body: RequestBody = await req.json().catch(() => null)
  if (!body?.step) return NextResponse.json({ error: 'Parámetro step requerido' }, { status: 400 })

  // Validar longitudes para mitigar prompt injection
  if ('objective' in body && body.objective.length > 300) {
    return NextResponse.json({ error: 'El objetivo no puede superar 300 caracteres' }, { status: 400 })
  }
  if ('sector' in body && body.sector.length > 150) {
    return NextResponse.json({ error: 'El sector no puede superar 150 caracteres' }, { status: 400 })
  }
  if ('answers' in body && body.answers.some((a: string) => a.length > 600)) {
    return NextResponse.json({ error: 'Cada respuesta no puede superar 600 caracteres' }, { status: 400 })
  }

  if (body.step === 'questions') {
    return handleQuestions(body)
  }
  if (body.step === 'generate') {
    return handleGenerate(body, user.orgId)
  }
  return NextResponse.json({ error: 'step inválido' }, { status: 400 })
}

async function handleQuestions(body: QuestionsRequest): Promise<NextResponse> {
  const { objective, sector } = body
  if (!objective?.trim() || !sector?.trim()) {
    return NextResponse.json({ error: 'objective y sector son obligatorios' }, { status: 400 })
  }

  const client = getAnthropicClient()
  if (!client) return NextResponse.json({ error: 'Proveedor IA no configurado.' }, { status: 503 })

  const prompt = `Eres un consultor de procesos empresariales. El usuario quiere crear un workflow automatizado.

Objetivo: ${objective}
Sector: ${sector}

Genera exactamente 3 preguntas cortas y concretas (máximo 15 palabras cada una) para entender mejor el proceso y poder elegir las herramientas correctas. Las preguntas deben ayudar a decidir qué pasos incluir.

Responde SOLO con un JSON válido en este formato exacto:
{"questions": ["pregunta 1", "pregunta 2", "pregunta 3"]}`

  let message: Awaited<ReturnType<typeof client.messages.create>>
  try {
    message = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })
  } catch {
    return NextResponse.json({ error: 'Proveedor IA no disponible. Inténtalo de nuevo en unos minutos.' }, { status: 503 })
  }

  const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''

  let questions: string[]
  try {
    // Claude a veces envuelve el JSON en markdown code fences — limpiarlos
    const clean = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    const parsed = JSON.parse(clean) as { questions: string[] }
    questions = parsed.questions
  } catch {
    return NextResponse.json({ error: 'Error al parsear respuesta de la IA' }, { status: 502 })
  }

  return NextResponse.json({ questions })
}

async function handleGenerate(
  body: GenerateRequest,
  orgId: string,
): Promise<NextResponse> {
  const { objective, sector, answers, workspaceId } = body
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId requerido' }, { status: 400 })

  const client = getAnthropicClient()
  if (!client) return NextResponse.json({ error: 'Proveedor IA no configurado.' }, { status: 503 })

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId },
  })
  if (!workspace) return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })

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

  let message: Awaited<ReturnType<typeof client.messages.create>>
  try {
    message = await client.messages.create({
      model: MODEL,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })
  } catch {
    return NextResponse.json({ error: 'Proveedor IA no disponible. Inténtalo de nuevo en unos minutos.' }, { status: 503 })
  }

  const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''

  let generated: { workflowName: string; nodes: Array<{ toolId: string; toolSlug: string; toolName: string; label: string; reason: string }> }
  try {
    const clean = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    generated = JSON.parse(clean)
  } catch {
    return NextResponse.json({ error: 'Error al parsear respuesta de la IA' }, { status: 502 })
  }

  // Filtrar nodos con toolId que no existan en el catálogo real
  const validToolIds = new Set(tools.map((t) => t.id))
  const validNodes = generated.nodes.filter((n) => validToolIds.has(n.toolId))
  if (validNodes.length === 0) {
    return NextResponse.json({ error: 'La IA no pudo seleccionar herramientas válidas para este objetivo' }, { status: 422 })
  }
  generated = { ...generated, nodes: validNodes }

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
