import { tokenize, jaccardSimilarity, overlapCoefficient } from './similarity'

const WEIGHTS = {
  name: 0.40,
  description: 0.25,
  category: 0.15,
  capabilities: 0.10,
  fields: 0.10,
} as const

// Keyword sets for each category — used for category score when prompt text matches
const CATEGORY_KEYWORDS: Record<string, Set<string>> = {
  audit: new Set(['audit', 'auditoria', 'seguridad', 'security', 'compliance', 'cumplimiento', 'inspeccion', 'inspection', 'revision', 'verificacion', 'control']),
  evaluation: new Set(['evaluacion', 'evaluation', 'assessment', 'valoracion', 'calificacion', 'puntuacion', 'score', 'rating', 'nota']),
  checklist: new Set(['checklist', 'check', 'lista', 'tareas', 'tasks', 'items', 'puntos', 'pasos', 'steps']),
  crm: new Set(['crm', 'cliente', 'client', 'customer', 'seguimiento', 'tracking', 'contacto', 'contact', 'ventas', 'sales']),
  report: new Set(['report', 'informe', 'reporte', 'resumen', 'summary', 'documento', 'document']),
  hr: new Set(['hr', 'rrhh', 'recursos', 'humanos', 'human', 'empleado', 'employee', 'contratacion', 'hiring', 'onboarding']),
  operations: new Set(['operations', 'operaciones', 'proceso', 'process', 'workflow', 'procedimiento', 'protocolo']),
  finance: new Set(['finance', 'finanzas', 'presupuesto', 'budget', 'contabilidad', 'accounting', 'gasto', 'expense', 'factura']),
  custom: new Set([]),
}

export interface ScoreBreakdown {
  name: number
  description: number
  category: number
  capabilities: number
  fields: number
}

export interface RankedResult {
  score: number
  breakdown: ScoreBreakdown
  reason: string
}

interface ToolData {
  name: string
  description: string
  category: string
  capabilityLabels: string[]
  fieldLabels: string[]
}

function categoryScore(promptTokens: Set<string>, category: string): number {
  const keywords = CATEGORY_KEYWORDS[category.toLowerCase()] ?? new Set<string>()
  if (keywords.size === 0) return 0
  const hits = [...promptTokens].filter(t => keywords.has(t)).length
  return Math.min(1, hits / 2)  // 2 keyword hits = full score
}

function buildReason(bd: ScoreBreakdown): string {
  if (bd.name >= 40) return 'Name closely matches your description'
  if (bd.description >= 30) return 'Description overlaps with your requirements'
  if (bd.category >= 50) return 'Same category as requested tool'
  if (bd.capabilities >= 30) return 'Similar capabilities detected'
  if (bd.fields >= 30) return 'Similar data fields'
  return 'Partial match with your requirements'
}

export function rankTool(prompt: string, tool: ToolData): RankedResult {
  const promptTokens = tokenize(prompt)
  const nameTokens = tokenize(tool.name)
  const descTokens = tokenize(tool.description)
  const capTokens = tokenize(tool.capabilityLabels.join(' '))
  const fieldTokens = tokenize(tool.fieldLabels.join(' '))

  // Name: blend of Jaccard + overlap (handles short prompts matching longer names)
  const nameScore = Math.round(
    (jaccardSimilarity(promptTokens, nameTokens) * 0.4 +
      overlapCoefficient(promptTokens, nameTokens) * 0.6) * 100,
  )

  // Description: equal blend
  const descScore = Math.round(
    (jaccardSimilarity(promptTokens, descTokens) * 0.5 +
      overlapCoefficient(promptTokens, descTokens) * 0.5) * 100,
  )

  // Category: keyword matching
  const catScore = Math.round(categoryScore(promptTokens, tool.category) * 100)

  // Capabilities: overlap (shorter text)
  const capScore = Math.round(overlapCoefficient(promptTokens, capTokens) * 100)

  // Fields: overlap
  const fieldScore = Math.round(overlapCoefficient(promptTokens, fieldTokens) * 100)

  const total = Math.round(
    nameScore * WEIGHTS.name +
    descScore * WEIGHTS.description +
    catScore * WEIGHTS.category +
    capScore * WEIGHTS.capabilities +
    fieldScore * WEIGHTS.fields,
  )

  const breakdown: ScoreBreakdown = {
    name: nameScore,
    description: descScore,
    category: catScore,
    capabilities: capScore,
    fields: fieldScore,
  }

  return { score: total, breakdown, reason: buildReason(breakdown) }
}
