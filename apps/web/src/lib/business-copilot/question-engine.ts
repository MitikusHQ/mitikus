/**
 * Question Engine — determina exactamente 1 pregunta cuando falta información.
 *
 * Jerarquía de prioridad:
 *   1. El Intent Engine ya detectó qué falta (missingInformation[])
 *   2. El Business Context no tiene sector/empresa
 *   3. Hay ambigüedad en el objetivo
 *
 * Nunca devuelve más de una pregunta.
 * Devuelve null si ya hay suficiente información para planificar.
 */

import type { IntentResult } from '@/lib/intent-engine/types'
import type { BusinessContext } from '@/lib/business-memory/memory-types'

export interface ClarifyingQuestion {
  question:    string
  field:       string   // qué información resuelve
  options?:    string[] // opciones sugeridas (máx 4)
}

/**
 * Determina si hay que preguntar algo antes de planificar.
 * Devuelve null si ya tenemos suficiente contexto.
 */
export function determineClarifyingQuestion(
  intentResult: IntentResult,
  context: BusinessContext,
  collectedAnswers: Record<string, string>,
): ClarifyingQuestion | null {
  // 1. Si el Intent Engine ya detectó qué falta, preguntar el primero
  const pending = intentResult.missingInformation.filter(
    (m) => !collectedAnswers[m],
  )
  if (pending.length > 0) {
    const first = pending[0]!
    return buildQuestionForMissingField(first, intentResult, context)
  }

  // 2. Si el objetivo no está claro (baja confianza), pedir aclaración
  if (intentResult.confidence < 0.4 && !collectedAnswers['intent_clarification']) {
    const alternatives = intentResult.alternativeInterpretations.slice(0, 3)
    if (alternatives.length > 0) {
      return {
        question: `He detectado un posible objetivo, pero quiero asegurarme. ¿A cuál de estas opciones se refiere?`,
        field:    'intent_clarification',
        options:  [intentResult.rawGoal, ...alternatives].slice(0, 4),
      }
    }
  }

  // 3. Si no hay sector en el contexto y el goal no lo especifica
  if (!context.sector && !intentResult.entities.sector && !collectedAnswers['sector']) {
    return {
      question: `Para preparar el plan más adecuado, ¿en qué sector opera tu empresa?`,
      field:    'sector',
      options:  ['Industrial / Manufactura', 'Servicios profesionales', 'Comercio / Retail', 'Tecnología / Software'],
    }
  }

  // Con esta información tenemos suficiente para planificar
  return null
}

// ── Builders privados ─────────────────────────────────────────────

function buildQuestionForMissingField(
  field: string,
  intentResult: IntentResult,
  context: BusinessContext,
): ClarifyingQuestion {
  const fieldQuestions: Record<string, ClarifyingQuestion> = {
    'Nombre de la empresa': {
      question: `¿Cuál es el nombre de tu empresa?`,
      field:    'Nombre de la empresa',
    },
    'URL del sitio web': {
      question: `¿Cuál es la URL de tu sitio web? Esto me permitirá personalizar el plan.`,
      field:    'URL del sitio web',
    },
    'Nombre del producto o servicio': {
      question: `¿Sobre qué producto o servicio quieres trabajar?`,
      field:    'Nombre del producto o servicio',
    },
    'Mercado objetivo': {
      question: `¿A qué mercado o segmento de clientes va dirigido?`,
      field:    'Mercado objetivo',
      options:  ['B2B', 'B2C', 'Ambos'],
    },
    'Sector de actividad': {
      question: `¿En qué sector opera tu empresa?`,
      field:    'Sector de actividad',
      options:  ['Industrial', 'Servicios', 'Comercio', 'Tecnología'],
    },
    'Normativa aplicable': {
      question: `¿Qué normativa o estándar quieres cumplir? Por ejemplo: ISO 9001, RGPD, ISO 27001.`,
      field:    'Normativa aplicable',
      options:  ['ISO 9001', 'ISO 27001', 'RGPD / GDPR', 'Otra'],
    },
    'País de operación': {
      question: `¿En qué país opera principalmente tu empresa?`,
      field:    'País de operación',
      options:  ['España', 'México', 'Argentina', 'Otro país hispanohablante'],
    },
  }

  return fieldQuestions[field] ?? {
    question: `Para continuar necesito saber: ${field.toLowerCase()}`,
    field,
  }
}
