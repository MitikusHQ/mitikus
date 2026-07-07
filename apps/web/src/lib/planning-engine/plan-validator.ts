/**
 * Plan Validator — valida la integridad de un ExecutionPlan antes de exponerlo.
 *
 * No lanza excepciones. Devuelve { valid, errors, warnings }.
 */

import type { ExecutionPlan } from './planner-types'

export interface ValidationResult {
  valid:    boolean
  errors:   string[]
  warnings: string[]
}

/**
 * Valida un plan de ejecución.
 */
export function validatePlan(plan: ExecutionPlan): ValidationResult {
  const errors:   string[] = []
  const warnings: string[] = []

  // Errores bloqueantes
  if (!plan.id)          errors.push('El plan no tiene ID')
  if (!plan.rawGoal)     errors.push('El plan no tiene objetivo definido')
  if (plan.phases.length === 0) errors.push('El plan no tiene fases')

  const allSteps = plan.phases.flatMap((ph) => ph.steps)
  if (allSteps.length === 0) errors.push('El plan no tiene pasos')

  for (const step of allSteps) {
    if (!step.toolSlug) errors.push(`Step ${step.id} sin toolSlug`)
    if (step.estimatedCostEUR < 0) errors.push(`Step "${step.toolSlug}" con coste negativo`)
  }

  // Advertencias no bloqueantes
  if (plan.missingRequirements.length > 0) {
    warnings.push(`${plan.missingRequirements.length} requisitos faltantes — el plan puede ejecutarse con resultados reducidos`)
  }

  if (plan.risk.level === 'high') {
    warnings.push('Riesgo alto — revisar los factores de riesgo antes de ejecutar')
  }

  if (plan.totalTools === 1) {
    warnings.push('Plan con una sola herramienta — considera estrategia completa para mayor cobertura')
  }

  if (plan.estimatedDays > 5) {
    warnings.push(`Plan largo (${plan.estimatedDays} días) — considera dividirlo en fases independientes`)
  }

  return {
    valid:    errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Valida todos los planes de un resultado y filtra los inválidos.
 */
export function filterValidPlans(
  plans: ExecutionPlan[],
): { valid: ExecutionPlan[]; skipped: number } {
  const valid   = plans.filter((p) => validatePlan(p).valid)
  const skipped = plans.length - valid.length
  return { valid, skipped }
}
