/**
 * Response Builder — construye respuestas en lenguaje natural (consultor senior).
 *
 * REGLAS:
 *   - Nunca mencionar "Intent Engine", "Planning Engine", "modelos IA", "proveedores"
 *   - Nunca exponer slugs de herramientas directamente
 *   - Nunca usar jerga técnica
 *   - Usar tono de Director de Operaciones, no de chatbot
 *   - Sin emojis decorativos innecesarios
 *
 * Todas las respuestas son deterministas (templates). Sin LLM aquí.
 */

import type { CopilotPhase, CopilotAction, PlanSummary } from './copilot-types'
import type { BusinessContext } from '@/lib/business-memory/memory-types'
import type { ClarifyingQuestion } from './question-engine'

// ── Greeting ──────────────────────────────────────────────────────

export function buildGreetingMessage(context: BusinessContext): string {
  if (context.isEmpty) {
    return (
      'Bienvenido. Soy el Director de Operaciones de tu plataforma.\n\n' +
      'Todavía no conozco tu empresa. Cuéntame en qué quieres trabajar hoy ' +
      'y lo tendré en cuenta para personalizar cada plan que te prepare.'
    )
  }

  const parts: string[] = []

  if (context.companyName) {
    parts.push(`He revisado el estado actual de ${context.companyName}.`)
  } else {
    parts.push('He revisado el estado actual de tu empresa.')
  }

  if (context.activeObjectives.length > 0) {
    const obj = context.activeObjectives[0]!
    parts.push(`Tienes ${context.activeObjectives.length} objetivo${context.activeObjectives.length > 1 ? 's' : ''} activo${context.activeObjectives.length > 1 ? 's' : ''}, el más prioritario: "${obj.label}" con un ${obj.progress}% de progreso.`)
  }

  if (context.openRisks.filter((r) => r.level === 'high' || r.level === 'critical').length > 0) {
    parts.push(`Hay ${context.openRisks.length} riesgo${context.openRisks.length > 1 ? 's' : ''} abierto${context.openRisks.length > 1 ? 's' : ''} que deberías valorar.`)
  }

  parts.push('\n¿En qué quieres centrarte hoy? Puedes indicarme un objetivo o elegir una de las sugerencias.')

  return parts.join(' ')
}

export function buildContextAwareGreeting(context: BusinessContext): string {
  const sector = context.sector ?? 'tu sector'
  return (
    `Perfecto. Ya tengo el contexto de tu empresa — sector ${sector}.\n\n` +
    '¿En qué objetivo quieres trabajar hoy? Cuéntamelo con tus palabras ' +
    'o elige una de las sugerencias.'
  )
}

// ── Understanding ─────────────────────────────────────────────────

export function buildUnderstandingMessage(rawGoal: string): string {
  return `Entendido. Estoy analizando cómo abordar "${rawGoal}"…`
}

// ── Clarifying ────────────────────────────────────────────────────

export function buildClarifyingMessage(question: ClarifyingQuestion): string {
  return question.question
}

// ── Planning ──────────────────────────────────────────────────────

export function buildPlanningMessage(
  plans: PlanSummary[],
  goalLabel: string,
): string {
  if (plans.length === 0) {
    return (
      `He analizado las opciones para "${goalLabel}" pero no he encontrado una combinación ` +
      `adecuada con las herramientas actuales. Te recomiendo revisar el catálogo de herramientas ` +
      `o reformular el objetivo.`
    )
  }

  const recommended = plans.find((p) => p.isRecommended)
  const parts: string[] = []

  parts.push(`He preparado ${plans.length} estrategia${plans.length > 1 ? 's' : ''} para "${goalLabel}":`)

  if (recommended) {
    parts.push(
      `\nMi recomendación es la estrategia **${strategyLabel(recommended.strategyType)}** ` +
      `(${recommended.totalTools} pasos, ~${recommended.estimatedDays} día${recommended.estimatedDays !== 1 ? 's' : ''}, ` +
      `riesgo ${riskLabel(recommended.riskLevel)}). ${recommended.reasoning}`
    )
  }

  parts.push('\nElige la estrategia que mejor se adapte a tu situación y generaré el plan detallado.')

  return parts.join('')
}

// ── Workflow Ready ────────────────────────────────────────────────

export function buildWorkflowReadyMessage(
  planLabel: string,
  objectiveId: string,
): string {
  if (!objectiveId) {
    return (
      `He preparado el plan "${planLabel}".\n\n` +
      `Ve a Mission Control para ver los pasos y empezar a trabajar.`
    )
  }
  return (
    `La misión "${planLabel}" está creada con todos sus pasos.\n\n` +
    `Puedes verla en Mission Control, ajustar los pasos y empezar cuando quieras.`
  )
}

// ── Done / Restart ────────────────────────────────────────────────

export function buildDoneMessage(): string {
  return (
    'Sesión completada. Cuando quieras trabajar en otro objetivo, inicia una nueva sesión.'
  )
}

export function buildErrorMessage(reason: 'no_goal' | 'no_plans' | 'unknown'): string {
  const messages: Record<string, string> = {
    no_goal:
      'No he podido identificar un objetivo concreto. Intenta ser más específico — por ejemplo: "quiero mejorar el SEO de mi web" o "necesito un plan de ventas".',
    no_plans:
      'No he encontrado una estrategia para ese objetivo con las herramientas actuales. Prueba a reformularlo con más detalle.',
    unknown:
      'Algo ha fallado procesando tu mensaje. Prueba de nuevo o elige una de estas opciones:',
  }
  return messages[reason] ?? messages['unknown']!
}

// ── Actions ───────────────────────────────────────────────────────

export function buildPlanActions(plans: PlanSummary[]): CopilotAction[] {
  return plans.map((p) => ({
    id:    `select_${p.id}`,
    label: `Elegir estrategia ${strategyLabel(p.strategyType)}`,
    type:  'select_plan' as const,
    data:  { planId: p.id },
  }))
}

export function buildWorkflowActions(workflowId: string): CopilotAction[] {
  return [
    {
      id:    'view_workflow',
      label: 'Ver plan detallado',
      type:  'generate_workflow',
      data:  { workflowId },
    },
    {
      id:    'restart',
      label: 'Trabajar en otro objetivo',
      type:  'restart',
    },
  ]
}

export function buildRestartActions(): CopilotAction[] {
  return [
    {
      id:    'restart',
      label: 'Nuevo objetivo',
      type:  'restart',
    },
  ]
}

// ── Helpers privados ──────────────────────────────────────────────

function strategyLabel(type: string): string {
  const labels: Record<string, string> = {
    complete: 'Completa',
    fast:     'Rápida',
    economic: 'Económica',
  }
  return labels[type] ?? type
}

function riskLabel(level: string): string {
  const labels: Record<string, string> = {
    low:    'bajo',
    medium: 'medio',
    high:   'alto',
  }
  return labels[level] ?? level
}
