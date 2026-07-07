/**
 * AI Recommendations (MISSION-002, Fase 8) — genera sugerencias de IA
 * para una misión, tanto al completarla como durante su ejecución.
 *
 * Reutiliza el Execution Engine existente (runToolExecution) — NO se
 * introduce ningún proveedor de IA nuevo. Mantiene la arquitectura actual.
 */

import { runToolExecution } from '@/lib/execution-engine'
import type { CompanyObjectiveData } from '@/lib/business-memory'
import type { MissionStepData, AIRecommendation } from './types'

function parseRecommendations(raw: string): AIRecommendation[] {
  try {
    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '')
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) {
      return parsed
        .filter((r): r is AIRecommendation => typeof r?.title === 'string' && typeof r?.reason === 'string')
        .slice(0, 3)
    }
  } catch {
    // El modelo no devolvió JSON válido — fallback abajo
  }
  return []
}

/**
 * Genera hasta 3 recomendaciones de próximas misiones, justificadas,
 * a partir del contexto de la misión actual (completada o en curso).
 */
export async function generateMissionRecommendations(
  objective: CompanyObjectiveData,
  steps: MissionStepData[],
  trigger: 'completion' | 'in_progress',
): Promise<AIRecommendation[]> {
  const stepsSummary = steps
    .map((s) => `- [${s.status}] ${s.title}`)
    .join('\n')

  const context = `Misión: "${objective.label}"
Descripción: ${objective.description ?? 'Sin descripción'}
Estado: ${trigger === 'completion' ? 'Recién completada' : 'En curso'}
Progreso: ${objective.progress}%

Pasos:
${stepsSummary || '(sin pasos)'}`

  const output = await runToolExecution({
    toolName:        'Mission Intelligence — Recomendador',
    toolDescription: 'Genera próximas misiones recomendadas para una empresa que usa MITIKUS.',
    category:        'CUSTOM',
    fields: {
      contexto: { type: 'textarea', label: 'Contexto de la misión' },
    },
    variables: { contexto: context },
    model:    'claude-sonnet-4-6',
    provider: 'anthropic',
    maxTokens: 600,
    systemPromptOverride:
      `Eres el Director de Operaciones de MITIKUS. Tu trabajo es recomendar las próximas 3 misiones más valiosas para una empresa, basándote en el contexto de una misión ${trigger === 'completion' ? 'que acaba de completar' : 'que tiene en curso'}.

Responde ÚNICAMENTE con un array JSON de exactamente 3 objetos, sin texto adicional, sin bloques de markdown:
[{"title": "Nombre breve de la misión recomendada", "reason": "Por qué la recomendamos ahora, en una frase, conectada al contexto dado"}]`,
  })

  const recommendations = parseRecommendations(output.result)
  return recommendations.length > 0 ? recommendations : []
}
