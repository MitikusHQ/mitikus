import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'
import { validateToolSchema } from '@protools/schema'
import type { ValidatedToolSchema } from '@protools/schema'
import { buildSimpleFallbackSchema } from '@/lib/tool-generation/simple-fallback'
import type { Prisma } from '@prisma/client'
import { estimateCostEUR } from '@/lib/ai-cost'
import { checkAllLimits } from '@/lib/ai-rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 60

const MODEL = 'claude-sonnet-4-6'

// Configurable via env — defaults are conservative for dev
const MAX_TOKENS = parseInt(process.env.MAX_AI_OUTPUT_TOKENS ?? '4000', 10)
const MAX_RETRIES = parseInt(process.env.MAX_AI_RETRIES ?? '2', 10)
const MAX_SCHEMA_BYTES = 50_000

const SYSTEM_PROMPT = `Eres un generador de herramientas profesionales para MITIKUS.
Genera un ToolSchemaV1 válido en JSON según la descripción del usuario.

FORMATO DE RESPUESTA:
Tu respuesta debe ser EXCLUSIVAMENTE el objeto JSON, comenzando con { y terminando con }.
NO incluyas texto antes ni después. NO uses bloques de código markdown. NO añadas explicaciones.

REGLAS CRÍTICAS — los errores más frecuentes son:
- "version" debe ser el STRING "1" (nunca el número 1)
- "instanceId" SOLO puede contener minúsculas, números y guiones. NUNCA guiones bajos. Ejemplo correcto: "tabla-principal" "form-datos" "checklist-items". INCORRECTO: "form_main" "tabla_datos"
- "slug" SOLO minúsculas, números y guiones (ej: "auditoria-proveedores"). Sin espacios, sin mayúsculas.
- Las claves de dataSchema.fields: solo letras/números/guiones_bajos, empezar por letra (ej: "empresa", "fecha_inicio", "puntuacion"). NUNCA guiones.
- Las columnas de TABLE deben referenciar fieldIds que EXISTEN en dataSchema.fields
- "category" debe ser uno de: audit, evaluation, checklist, crm, report, hr, operations, finance, custom
- "id" cualquier UUID v4
- "createdBy" debe ser "ai"
- "isPublic" debe ser false
- name: 3-80 caracteres; description: 20-500 caracteres
- FORM requiere "layout": "single-column" | "two-column" | "sections" — usa "sections" cuando hay más de 5 campos
- CHECKLIST requiere "items": array mín. 1 con {id, label} y "completionType": "check" | "yes_no"
- SCORING requiere "criteria": array mín. 1 con {id, label}
- TABLE requiere "columns": array mín. 1 con {fieldId, sortable?} donde fieldId existe en dataSchema.fields
- permissions: {"defaultMemberRole": "EDITOR", "allowPublicShare": false}
- Tipos de campo válidos: string | number | boolean | date | textarea | select | multiselect | email | phone | url

BUENAS PRÁCTICAS PARA TABLAS:
- Marca "sortable: true" en columnas de fecha, número e importe — permite ordenar la tabla
- Establece "defaultSortField" y "defaultSortDirection" en la TABLE config (típico: fecha más reciente primero)
- Incluye "showCreateButton: true" en TABLE para poder añadir registros
- pageSize: 25 como valor por defecto

CAMPOS RECOMENDADOS POR CONTEXTO:
- Seguimiento de documentos/clientes: incluye campos estado (select), responsable (string), fecha_documento (date), notas (textarea)
- CRM: incluye campos empresa, contacto, email (type: email), telefono (type: phone), estado (select)
- Evaluación/scoring: incluye criterios con peso (weight) que sumen 1.0 y thresholds por color
- RRHH: incluye campos nombre, departamento, fecha_inicio (date), estado (select)

ESTRUCTURA:
- Incluye TABLE y al menos una capability más (FORM, CHECKLIST o SCORING)
- FORM con layout "sections" cuando tienes más de 5 campos — agrupa campos relacionados en secciones
- Máximo 12 campos en dataSchema.fields, máximo 8 ítems por capability de checklist`

const SIMPLE_SYSTEM_PROMPT = `Eres un generador de herramientas profesionales para MITIKUS.
Genera un ToolSchemaV1 válido en JSON según la descripción del usuario.

FORMATO DE RESPUESTA:
Tu respuesta debe ser EXCLUSIVAMENTE el objeto JSON, comenzando con { y terminando con }.
NO incluyas texto antes ni después. NO uses bloques de código markdown.

MODO SIMPLE — reglas estrictas:
- Máximo 8 campos en dataSchema.fields
- Exactamente 2 capabilities: TABLE + (FORM o CHECKLIST, elige el más apropiado)
- NO incluyas SCORING ni PDF_EXPORT
- Los ítems de CHECKLIST: máximo 6
- Las columnas de TABLE: máximo 5, todas referenciando fieldIds que existen en dataSchema.fields
- Marca "sortable: true" en columnas de fecha y número; pon "defaultSortField" y "defaultSortDirection"

REGLAS CRÍTICAS:
- "version" = STRING "1"
- "instanceId" SOLO guiones (kebab-case): "tabla-principal", "form-datos" — NUNCA guiones bajos
- "slug" SOLO minúsculas y guiones
- Claves de dataSchema.fields: letras/números/guiones_bajos, empezar por letra
- "category": audit | evaluation | checklist | crm | report | hr | operations | finance | custom
- "id" = UUID v4; "createdBy" = "ai"; "isPublic" = false
- CHECKLIST necesita "completionType": "check" | "yes_no"
- permissions: {"defaultMemberRole": "EDITOR", "allowPublicShare": false}
- Tipos de campo válidos: string | number | boolean | date | textarea | select | multiselect | email | phone | url`

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch?.[1]) return fenceMatch[1].trim()
  const objectMatch = text.match(/\{[\s\S]*\}/)
  if (objectMatch) return objectMatch[0].trim()
  return text.trim()
}

function sanitizeText(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim()
}

interface ZodIssue {
  path: Array<string | number>
  message: string
  code: string
  expected?: unknown
  received?: unknown
}

function formatZodErrors(issues: ZodIssue[]): string {
  return issues
    .slice(0, 6)
    .map((e) => {
      const path = e.path.join('.')
      const detail = e.expected !== undefined
        ? `expected=${String(e.expected)} received=${String(e.received)}`
        : e.message
      return `  - ${path}: ${detail}`
    })
    .join('\n')
}

function logZodErrors(issues: ZodIssue[], attempt: number): void {
  console.error(`[AI] Intento ${attempt} — falló validación Zod (${issues.length} errores):`)
  for (const e of issues.slice(0, 10)) {
    const path = e.path.join('.')
    const detail = e.expected !== undefined
      ? `expected=${String(e.expected)} received=${String(e.received)}`
      : e.message
    console.error(`  path="${path}" code=${e.code} ${detail}`)
  }
}

async function callClaude(
  client: Anthropic,
  systemPrompt: string,
  userPrompt: string,
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')

  return { text, inputTokens: msg.usage.input_tokens, outputTokens: msg.usage.output_tokens }
}

function validateGeneratedSchema(
  parsed: unknown,
  attempt: number,
): { ok: true; data: ValidatedToolSchema } | { ok: false; error: string; userMessage: string } {
  const serialized = JSON.stringify(parsed)
  if (serialized.length > MAX_SCHEMA_BYTES) {
    return {
      ok: false,
      error: `Schema demasiado grande (${serialized.length} bytes)`,
      userMessage: 'La herramienta generada no superó la validación. Prueba con una descripción más sencilla o reduce el número de secciones.',
    }
  }

  const result = validateToolSchema(parsed)
  if (!result.success) {
    const issues = result.error.errors as ZodIssue[]
    logZodErrors(issues, attempt)
    const errorDetail = formatZodErrors(issues)
    return {
      ok: false,
      error: `Zod validation failed:\n${errorDetail}`,
      userMessage: 'La herramienta generada no superó la validación. Prueba con una descripción más sencilla o reduce el número de secciones.',
    }
  }

  const validated = result.data

  if (Object.keys(validated.dataSchema.fields).length === 0) {
    return {
      ok: false,
      error: 'dataSchema.fields: debe tener al menos 1 campo',
      userMessage: 'La herramienta generada no superó la validación. Prueba con una descripción más sencilla o reduce el número de secciones.',
    }
  }

  const hasUsableCap = validated.capabilities.some(
    (c) => c.type === 'TABLE' || c.type === 'FORM' || c.type === 'CHECKLIST' || c.type === 'SCORING',
  )
  if (!hasUsableCap) {
    return {
      ok: false,
      error: 'capabilities: debe incluir TABLE, FORM, CHECKLIST o SCORING',
      userMessage: 'La herramienta generada no superó la validación. Prueba con una descripción más sencilla o reduce el número de secciones.',
    }
  }

  validated.name = sanitizeText(validated.name)
  validated.description = sanitizeText(validated.description)

  return { ok: true, data: validated }
}

async function recordUsage(data: {
  userId: string
  orgId: string
  workspaceId: string
  generationRequestId: string | null
  inputTokens: number
  outputTokens: number
  promptCharacters: number
  durationMs: number
  status: string
  errorMessage: string | null
  attempts: number
}): Promise<void> {
  const costEUR = estimateCostEUR(MODEL, data.inputTokens, data.outputTokens)
  try {
    await db.aIUsage.create({
      data: {
        userId: data.userId,
        orgId: data.orgId,
        workspaceId: data.workspaceId,
        generationRequestId: data.generationRequestId,
        model: MODEL,
        promptCharacters: data.promptCharacters,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        totalTokens: data.inputTokens + data.outputTokens,
        estimatedCostEUR: costEUR,
        durationMs: data.durationMs,
        status: data.status,
        errorMessage: data.errorMessage,
        attempts: data.attempts,
      },
    })
  } catch (err) {
    console.error('[AIUsage] Error registrando uso:', err)
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let body: { naturalLanguage?: string; workspaceId?: string; simpleMode?: boolean; locale?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { naturalLanguage, workspaceId, simpleMode = false, locale = 'es' } = body

  if (!naturalLanguage || typeof naturalLanguage !== 'string') {
    return NextResponse.json({ error: 'Description required' }, { status: 400 })
  }

  const trimmed = naturalLanguage.trim()
  if (trimmed.length < 10) {
    return NextResponse.json({ error: 'Description too short (minimum 10 characters)' }, { status: 400 })
  }
  if (trimmed.length > 2000) {
    return NextResponse.json({ error: 'Description too long (maximum 2000 characters)' }, { status: 400 })
  }

  if (!workspaceId || typeof workspaceId !== 'string') {
    return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
  }
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const limitFailed = simpleMode ? null : await checkAllLimits(user.id, workspaceId)
  if (limitFailed) {
    void recordUsage({
      userId: user.id, orgId: user.orgId, workspaceId,
      generationRequestId: null, inputTokens: 0, outputTokens: 0,
      promptCharacters: trimmed.length, durationMs: 0,
      status: 'rate_limited', errorMessage: limitFailed.reason ?? 'limit reached', attempts: 0,
    })
    return NextResponse.json(
      {
        error: 'AI generation is temporarily unavailable — daily limit reached for this environment.',
        limitReason: limitFailed.reason,
        current: limitFailed.current,
        limit: limitFailed.limit,
      },
      { status: 429 },
    )
  }

  const langInstruction = locale === 'es'
    ? '\n\nIDIOMA: Genera TODOS los textos en español. Nombres de herramientas, campos, etiquetas, ítems de checklist, columnas de tabla — todo en español. No mezcles idiomas.'
    : '\n\nLANGUAGE: Generate ALL text in English. Tool names, field labels, checklist items, table columns — everything in English. Do not mix languages.'

  const systemPrompt = (simpleMode ? SIMPLE_SYSTEM_PROMPT : SYSTEM_PROMPT) + langInstruction
  const startMs = Date.now()
  let totalInputTokens = 0
  let totalOutputTokens = 0
  let generatedSchema: ValidatedToolSchema | null = null
  let userFacingError: string | null = null
  let internalError: string | null = null
  let attempts = 0

  try {
    if (simpleMode) {
      generatedSchema = buildSimpleFallbackSchema(trimmed)
      attempts = 1
    } else if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI generation is not configured. Add ANTHROPIC_API_KEY to .env.local.' },
        { status: 503 },
      )
    } else {
      const client = new Anthropic()
      console.info(
        `[AI] Generating tool workspace=${workspaceId} user=${user.id} simpleMode=${simpleMode} locale=${locale} MAX_TOKENS=${MAX_TOKENS} MAX_RETRIES=${MAX_RETRIES}`,
      )

      let lastError = ''

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        attempts = attempt + 1

        const prefix = locale === 'es'
          ? 'Genera una herramienta profesional para'
          : 'Generate a professional tool for'
        const fixInstruction = locale === 'es'
          ? 'El intento anterior falló con estos errores de validación — corrígelos todos:\n'
          : 'The previous attempt failed with these validation errors — fix all of them:\n'
        const fixSuffix = locale === 'es'
          ? '\n\nDevuelve únicamente el JSON corregido y completo.'
          : '\n\nReturn only the corrected and complete JSON.'

        const userPrompt =
          attempt === 0
            ? `${prefix}:\n<user_input>\n${trimmed}\n</user_input>`
            : `${prefix}:\n<user_input>\n${trimmed}\n</user_input>\n\n${fixInstruction}${lastError}${fixSuffix}`

        const { text, inputTokens, outputTokens } = await callClaude(client, systemPrompt, userPrompt)
        totalInputTokens += inputTokens
        totalOutputTokens += outputTokens

        console.debug(`[AI] Attempt ${attempt + 1}: input=${inputTokens} output=${outputTokens}`)

        const stripped = extractJson(text)
        let parsed: unknown
        try {
          parsed = JSON.parse(stripped)
        } catch {
          lastError = 'Response is not valid JSON'
          console.error(`[AI] Attempt ${attempt + 1}: JSON parse failed`)
          continue
        }

        // Override server-controlled fields
        if (typeof parsed === 'object' && parsed !== null) {
          ;(parsed as Record<string, unknown>).id = crypto.randomUUID()
          ;(parsed as Record<string, unknown>).createdBy = 'ai'
          ;(parsed as Record<string, unknown>).isPublic = false
        }

        const validation = validateGeneratedSchema(parsed, attempt + 1)
        if (validation.ok) {
          generatedSchema = validation.data
          break
        } else {
          lastError = validation.error
          userFacingError = validation.userMessage
        }
      }

      if (!generatedSchema) {
        internalError = `Failed after ${attempts} attempt(s). Last error: ${userFacingError ?? 'unknown'}`
      }
    }
  } catch (err) {
    internalError = err instanceof Error ? err.message : 'Error calling AI'
    userFacingError = 'An error occurred while generating the tool. Please try again.'
  }

  const durationMs = Date.now() - startMs
  const totalTokens = totalInputTokens + totalOutputTokens
  const status = generatedSchema ? 'success' : 'error'
  const costEUR = estimateCostEUR(MODEL, totalInputTokens, totalOutputTokens)

  if (status === 'error') {
    console.warn(
      `[AI] Result: ${status} tokens=${totalTokens} cost≈€${costEUR.toFixed(4)} duration=${durationMs}ms attempts=${attempts}`,
    )
  } else {
    console.info(
      `[AI] Result: ${status} tokens=${totalTokens} cost≈€${costEUR.toFixed(4)} duration=${durationMs}ms attempts=${attempts}`,
    )
  }

  const genReq = await db.generationRequest.create({
    data: {
      orgId: user.orgId,
      userId: user.id,
      naturalLanguage: trimmed,
      ...(generatedSchema !== null
        ? { generatedSchema: generatedSchema as unknown as Prisma.InputJsonValue }
        : {}),
      accepted: false,
      errorMessage: internalError,
      tokensUsed: totalTokens,
      durationMs,
    },
  })

  void recordUsage({
    userId: user.id,
    orgId: user.orgId,
    workspaceId,
    generationRequestId: genReq.id,
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    promptCharacters: trimmed.length,
    durationMs,
    status,
    errorMessage: internalError,
    attempts,
  })

  if (internalError || !generatedSchema) {
    return NextResponse.json(
      { error: userFacingError ?? 'La herramienta generada no superó la validación. Prueba con una descripción más sencilla o reduce el número de secciones.' },
      { status: 422 },
    )
  }

  return NextResponse.json({
    schema: generatedSchema,
    generationRequestId: genReq.id,
    tokensUsed: totalTokens,
  })
}
