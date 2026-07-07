// Tipos centrales para el sistema de presentación de respuestas IA en MITIKUS.
// Todo output generado por IA pasa por esta taxonomía.

/** Tipos de respuesta que MITIKUS puede presentar */
export type AIResponseType =
  | 'report'        // Informe estructurado con 4 secciones (conclusión → acción → por qué → detalles)
  | 'conversation'  // Texto plano o markdown sin estructura de informe
  | 'json'          // JSON válido — se presenta como datos, no como informe
  | 'table'         // Tabla markdown — renderer propio pendiente, usa conversation como fallback
  | 'insight'       // Señal breve — pendiente, usa conversation como fallback
  | 'plan'          // Plan estructurado — pendiente, usa conversation como fallback

/** Secciones parseadas de un informe estructurado */
export interface ParsedReport {
  hasStructure: boolean
  conclusion: string
  action: string
  why: string
  report: string
}

/** Metadatos de ejecución IA (opcionales en cualquier renderer) */
export interface AIExecutionMeta {
  model?: string
  inputTokens?: number
  outputTokens?: number
  estimatedCostEUR?: number
  durationMs?: number
  executionId?: string
}

/** Props base que todos los renderers específicos reciben */
export interface RendererProps {
  text: string
}
