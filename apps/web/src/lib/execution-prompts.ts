import type { ToolCategory } from '@prisma/client'
import type { DataSchema } from '@protools/schema'
import { SECTION_HEADINGS } from './ai/section-markers'

const CATEGORY_INSTRUCTIONS: Record<ToolCategory, string> = {
  AUDIT: 'Genera una auditoría profesional y completa. En el INFORME COMPLETO incluye hallazgos clave, riesgos detectados y recomendaciones accionables organizados por secciones.',
  EVALUATION: 'Realiza una evaluación detallada y objetiva. En el INFORME COMPLETO incluye fortalezas, áreas de mejora y recomendaciones concretas con próximos pasos.',
  CHECKLIST: 'Analiza el contexto del checklist. En el INFORME COMPLETO incluye estado de cumplimiento, puntos críticos pendientes y análisis de cada área.',
  CRM: 'Genera un análisis de la relación con el cliente. En el INFORME COMPLETO incluye histórico, oportunidades, riesgos y contexto completo del cliente.',
  REPORT: 'Redacta un informe profesional completo. En el INFORME COMPLETO incluye desarrollo con datos, análisis, contexto y todas las observaciones relevantes.',
  HR: 'Proporciona un análisis de recursos humanos completo y objetivo. En el INFORME COMPLETO incluye valoración detallada, observaciones y contexto.',
  OPERATIONS: 'Analiza las operaciones en profundidad. En el INFORME COMPLETO incluye ineficiencias detectadas, oportunidades de mejora, quick wins y análisis del contexto.',
  FINANCE: 'Genera un análisis financiero profesional. En el INFORME COMPLETO incluye interpretación de datos, tendencias, riesgos y contexto completo.',
  CUSTOM: 'Procesa la información y genera una respuesta profesional y accionable. En el INFORME COMPLETO desarrolla el análisis completo adaptado al contexto.',
}

// Estructura obligatoria para output en markdown: el usuario obtiene valor en los primeros segundos
const STRUCTURE_INSTRUCTION = `
ESTRUCTURA OBLIGATORIA DE LA RESPUESTA (usa exactamente estos encabezados, en este orden, sin excepciones):

${SECTION_HEADINGS.conclusion}
Máximo 4 frases. Responde únicamente: ¿Qué está ocurriendo? ¿Qué significa? ¿Qué prioridad tiene?
No expliques metodología ni contexto — solo el estado actual y su importancia.

${SECTION_HEADINGS.action}
Una única acción prioritaria, clara y accionable. Ejemplos: "Llama hoy a [nombre]", "Envía el presupuesto antes de las 17:00", "Programa una reunión esta semana", "Espera, todavía no es el momento".
Si hay varias acciones, lístalas ordenadas por prioridad. La más urgente, primero.

${SECTION_HEADINGS.why}
Solo los puntos clave (en bullets) que justifican la conclusión y la acción recomendada. Sin texto de relleno.

${SECTION_HEADINGS.report}
Aquí va el análisis completo y detallado: datos, contexto, patrones, histórico, riesgos, score, observaciones y todo lo relevante.`

export interface PromptInput {
  toolName: string
  toolDescription: string
  category: ToolCategory
  fields: DataSchema['fields']
  variables: Record<string, unknown>
  // Prompt específico definido en la herramienta (más específico que CATEGORY_INSTRUCTIONS)
  aiPrompt?: string | null
  // Config per-installation
  language?: string | null
  outputFormat?: string | null
  systemPromptOverride?: string | null
  customInstructions?: string | null
  // Contexto de empresa inyectado desde BusinessContext
  companyContextBlock?: string | null
}

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  es: 'Responde siempre en español.',
  en: 'Always respond in English.',
  fr: 'Réponds toujours en français.',
  de: 'Antworte immer auf Deutsch.',
  pt: 'Responda sempre em português.',
}

const OUTPUT_FORMAT_INSTRUCTIONS: Record<string, string> = {
  markdown: 'Usa Markdown estructurado: títulos (##, ###), listas y negritas para destacar lo importante.',
  plain: 'Usa texto plano sin formato Markdown ni etiquetas HTML.',
  json: 'Genera ÚNICAMENTE JSON válido sin ningún texto ni bloque Markdown a su alrededor.',
}

function buildUserPrompt(input: PromptInput): string {
  const filledFields = Object.entries(input.variables).filter(
    ([, v]) => v !== null && v !== undefined && v !== '',
  )

  if (filledFields.length === 0) {
    return `Genera el output completo de "${input.toolName}" con las instrucciones definidas en la herramienta. Crea un ejemplo representativo y útil.`
  }

  const lines = filledFields
    .map(([fieldId, value]) => {
      const field = input.fields[fieldId]
      const label = field?.label ?? fieldId
      return `- **${label}**: ${String(value)}`
    })
    .join('\n')

  return `Datos proporcionados:\n\n${lines}\n\nGenera el output completo y profesional de "${input.toolName}" basándote en estos datos.`
}

export function buildExecutionPrompts(input: PromptInput): {
  systemPrompt: string
  userPrompt: string
} {
  const userPrompt = buildUserPrompt(input)

  // Si hay override completo, úsalo directamente
  if (input.systemPromptOverride?.trim()) {
    const extra = input.customInstructions?.trim()
      ? `\n\nInstrucciones adicionales: ${input.customInstructions.trim()}`
      : ''
    return { systemPrompt: input.systemPromptOverride.trim() + extra, userPrompt }
  }

  const langKey = input.language ?? 'es'
  const fmtKey = input.outputFormat ?? 'markdown'
  const langInstruction = LANGUAGE_INSTRUCTIONS[langKey] ?? LANGUAGE_INSTRUCTIONS['es']
  const fmtInstruction = OUTPUT_FORMAT_INSTRUCTIONS[fmtKey] ?? OUTPUT_FORMAT_INSTRUCTIONS['markdown']
  // aiPrompt de la herramienta tiene prioridad sobre la instrucción genérica de categoría
  const categoryInstruction = input.aiPrompt?.trim() || CATEGORY_INSTRUCTIONS[input.category]

  const customPart = input.customInstructions?.trim()
    ? `\n\nInstrucciones adicionales: ${input.customInstructions.trim()}`
    : ''

  const structurePart = fmtKey !== 'json' && fmtKey !== 'plain' ? STRUCTURE_INSTRUCTION : ''

  const contextPart = input.companyContextBlock?.trim()
    ? `\n\n${input.companyContextBlock.trim()}`
    : ''

  const systemPrompt = `Eres un asistente profesional especializado en herramientas de negocio para MITIKUS.

Herramienta activa: "${input.toolName}"
Descripción: ${input.toolDescription}

Tu tarea: ${categoryInstruction}

FORMATO DE RESPUESTA:
- ${fmtInstruction}
- ${langInstruction}
- Sé directo, profesional y accionable — cada frase debe aportar valor
- Adapta la respuesta a los datos concretos proporcionados, no uses texto genérico
- No incluyas disclaimers sobre ser IA — genera el contenido directamente${structurePart}${customPart}${contextPart}`

  return { systemPrompt, userPrompt }
}
