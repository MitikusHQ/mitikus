'use client'

import { detectResponseType } from '@/lib/ai/detect-type'
import type { AIResponseType } from '@/lib/ai/types'
import { ReportRenderer } from './ReportRenderer'
import { ConversationRenderer } from './ConversationRenderer'
import { JsonRenderer } from './JsonRenderer'

interface AIResponseRendererProps {
  result: string
  /**
   * Hint explícito sobre el tipo de respuesta.
   * Si no se pasa, se detecta automáticamente por contenido.
   * Usar cuando la API ya conoce el tipo (ej: outputFormat === 'json').
   */
  typeHint?: AIResponseType
}

/**
 * Dispatcher principal del sistema de presentación de IA en MITIKUS.
 *
 * Recibe cualquier respuesta generada por IA y delega al renderer
 * correcto según el tipo detectado. Toda la IA del producto pasa por aquí.
 *
 * Añadir un nuevo tipo de respuesta:
 *   1. Definir el tipo en lib/ai/types.ts
 *   2. Añadir detección en lib/ai/detect-type.ts
 *   3. Crear el renderer en components/ai-response/
 *   4. Añadir el case aquí
 *   5. Re-exportar en index.ts
 */
export function AIResponseRenderer({ result, typeHint }: AIResponseRendererProps) {
  const type = detectResponseType(result, typeHint)

  switch (type) {
    case 'report':
      return <ReportRenderer text={result} />

    case 'json':
      return <JsonRenderer text={result} />

    case 'table':
    case 'insight':
    case 'plan':
    case 'conversation':
    default:
      return <ConversationRenderer text={result} />
  }
}
