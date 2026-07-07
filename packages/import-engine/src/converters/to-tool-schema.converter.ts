import type { NormalizedDocument } from '../types/normalized-document.js'

export interface ConversionContext {
  model?: string
  maxTokens?: number
  // Función inyectada desde el exterior para no acoplar este paquete a Anthropic SDK
  callAI: (systemPrompt: string, userPrompt: string) => Promise<string>
}

export interface ConversionResult {
  schema: unknown
  inputTokensEstimate: number
  warnings: string[]
}

export async function convertToToolSchema(
  doc: NormalizedDocument,
  ctx: ConversionContext,
): Promise<ConversionResult> {
  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildUserPrompt(doc)
  const warnings: string[] = [...doc.metadata.warnings]

  const raw = await ctx.callAI(systemPrompt, userPrompt)

  let schema: unknown
  try {
    // Claude devuelve JSON puro o dentro de ```json ... ```
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()
    schema = JSON.parse(cleaned)
  } catch {
    warnings.push('La IA devolvió un JSON no parseable — revisa el resultado manualmente')
    schema = null
  }

  return {
    schema,
    inputTokensEstimate: Math.ceil(userPrompt.length / 4),
    warnings,
  }
}

function buildSystemPrompt(): string {
  return `Eres un experto en diseño de herramientas profesionales para ProTools Hub.
Tu tarea es analizar documentos y convertirlos a un ToolSchema válido en formato JSON.

El ToolSchema sigue esta estructura:
{
  "version": "1.0",
  "title": "string",
  "description": "string",
  "category": "audit|checklist|scoring|form",
  "metadata": { "industry": "string", "purpose": "string" },
  "capabilities": {
    "type": "form|checklist|scoring|mixed",
    "fields": [
      { "id": "string", "label": "string", "type": "text|number|boolean|date|select|textarea", "required": true|false, "options": ["..."] }
    ],
    "checklists": [
      { "id": "string", "title": "string", "items": [ { "id": "string", "label": "string", "required": false } ] }
    ],
    "scoring": {
      "criteria": [ { "id": "string", "label": "string", "weight": 1, "min": 1, "max": 5 } ],
      "method": "weighted_average"
    }
  }
}

Reglas CRÍTICAS:
- Devuelve SOLO el JSON, sin texto explicativo ni bloques de código markdown
- Todos los "id" deben ser snake_case en minúsculas, sin tildes
- El campo "category" debe ser uno de: audit, checklist, scoring, form
- Si el documento tiene preguntas tipo sí/no → úsalos como checklist
- Si hay puntuaciones o pesos → úsalos en scoring
- Si hay campos de formulario → ponlos en fields
- Mantén el idioma original del documento`
}

function buildUserPrompt(doc: NormalizedDocument): string {
  const parts: string[] = []

  parts.push(`Archivo: ${doc.metadata.source}`)
  if (doc.metadata.title) parts.push(`Título detectado: ${doc.metadata.title}`)
  parts.push(`Formato origen: ${doc.metadata.format}`)

  if (doc.fields.length > 0) {
    parts.push(`\nCAMPOS DETECTADOS (${doc.fields.length}):`)
    doc.fields.slice(0, 30).forEach((f) => {
      const opts = f.options?.length ? ` [opciones: ${f.options.join(', ')}]` : ''
      parts.push(`- ${f.label} (${f.type}${f.required ? ', requerido' : ''}${opts})`)
    })
  }

  if (doc.tables.length > 0) {
    parts.push(`\nTABLAS (${doc.tables.length}):`)
    doc.tables.slice(0, 3).forEach((t) => {
      parts.push(`Tabla "${t.title ?? 'sin título'}": ${t.columns.map((c) => c.label).join(' | ')}`)
    })
  }

  if (doc.checklists.length > 0) {
    parts.push(`\nCHECKLISTS (${doc.checklists.length}):`)
    doc.checklists.slice(0, 3).forEach((cl) => {
      parts.push(`Checklist "${cl.title ?? ''}": ${cl.items.length} ítems`)
      cl.items.slice(0, 10).forEach((item) => parts.push(`  - ${item.label}`))
    })
  }

  if (doc.scoreCriteria.length > 0) {
    parts.push(`\nCRITERIOS DE PUNTUACIÓN (${doc.scoreCriteria.length}):`)
    doc.scoreCriteria.slice(0, 10).forEach((c) => {
      const weight = c.weight !== undefined ? ` (peso: ${c.weight})` : ''
      const range = c.min !== undefined ? ` [${c.min}–${c.max}]` : ''
      parts.push(`- ${c.label}${weight}${range}`)
    })
  }

  if (doc.sections.length > 0) {
    parts.push(`\nSECCIONES:`)
    doc.sections.slice(0, 5).forEach((s) => {
      parts.push(`[${s.level}] ${s.title}: ${s.content.slice(0, 200)}`)
    })
  }

  if (doc.rawText) {
    const truncated = doc.rawText.slice(0, 1500)
    parts.push(`\nTEXTO ORIGINAL (primeros 1500 chars):\n${truncated}`)
  }

  parts.push('\nGenera el ToolSchema JSON ahora:')

  return parts.join('\n')
}
