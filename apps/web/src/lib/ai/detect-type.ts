import type { AIResponseType } from './types'
import { SECTION_PATTERNS } from './section-markers'

const REPORT_MARKERS = Object.values(SECTION_PATTERNS)

/**
 * Detecta el tipo de respuesta IA a partir del contenido.
 * Si se pasa un hint explícito, tiene prioridad sobre la detección.
 */
export function detectResponseType(text: string, hint?: AIResponseType): AIResponseType {
  if (hint && hint !== 'unknown' as AIResponseType) return hint

  const trimmed = text.trim()

  // JSON: empieza con { o [ y parsea correctamente
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed)
      return 'json'
    } catch { /* sigue al siguiente detector */ }
  }

  // Report: al menos 2 de los 4 marcadores de sección están presentes
  const found = REPORT_MARKERS.filter((p) => p.test(text)).length
  if (found >= 2) return 'report'

  // Tabla markdown: líneas con pipe + separador de cabecera
  if (/^\|.+\|$/m.test(text) && /^\|[-: |]+\|$/m.test(text)) return 'table'

  // Fallback: texto conversacional o markdown sin estructura
  return 'conversation'
}
