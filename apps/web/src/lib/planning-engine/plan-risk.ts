/**
 * Plan Risk — calcula el nivel de riesgo de un plan.
 *
 * Criterios (sin IA, deterministas):
 *   - Número de herramientas: más tools = más riesgo de fallo en cadena
 *   - Herramientas no automatizables: requieren intervención humana
 *   - Información faltante: si missingRequirements > 0, riesgo sube
 *   - Calidad profesional: alta calidad puede requerir revisión humana
 *   - Dependencias declaradas: cadenas largas aumentan el riesgo
 */

import { CAPABILITY_PROFILES } from '@/registry/official/_capability-profiles'
import type { PlanRisk, RiskLevel } from './planner-types'

interface RiskInput {
  toolSlugs:           string[]
  missingRequirements: string[]
  estimatedDays:       number
}

/**
 * Calcula el riesgo de un plan de forma determinista.
 */
export function calculatePlanRisk(input: RiskInput): PlanRisk {
  const { toolSlugs, missingRequirements, estimatedDays } = input
  const factors: string[] = []
  let riskPoints = 0

  // Factor 1: número de herramientas
  if (toolSlugs.length >= 6) {
    riskPoints += 3
    factors.push(`Cadena larga de ${toolSlugs.length} herramientas — mayor probabilidad de fallo en cadena`)
  } else if (toolSlugs.length >= 4) {
    riskPoints += 1
    factors.push(`Pipeline de ${toolSlugs.length} herramientas requiere coordinación`)
  }

  // Factor 2: herramientas no automatizables
  const manualTools = toolSlugs.filter((slug) => {
    const p = CAPABILITY_PROFILES[slug]
    return p && !p.automationFriendly
  })
  if (manualTools.length >= 2) {
    riskPoints += 3
    factors.push(`${manualTools.length} herramientas requieren intervención humana (${manualTools.join(', ')})`)
  } else if (manualTools.length === 1) {
    riskPoints += 1
    factors.push(`"${manualTools[0]}" requiere revisión humana`)
  }

  // Factor 3: información faltante
  if (missingRequirements.length >= 2) {
    riskPoints += 3
    factors.push(`${missingRequirements.length} datos requeridos no proporcionados — puede reducir precisión`)
  } else if (missingRequirements.length === 1) {
    riskPoints += 1
    factors.push(`Dato faltante: ${missingRequirements[0]}`)
  }

  // Factor 4: duración estimada
  if (estimatedDays >= 4) {
    riskPoints += 2
    factors.push(`Proceso de ${estimatedDays} días — mayor exposición a cambios de contexto`)
  }

  // Factor 5: herramientas de calidad professional sin datos suficientes
  const professionalTools = toolSlugs.filter((slug) => {
    const p = CAPABILITY_PROFILES[slug]
    return p?.qualityLevel === 'professional'
  })
  if (professionalTools.length >= 3) {
    riskPoints += 1
    factors.push(`${professionalTools.length} herramientas de nivel profesional — requieren inputs de calidad`)
  }

  // Clasificación
  let level: RiskLevel
  if (riskPoints <= 2) {
    level = 'low'
    if (factors.length === 0) factors.push('Plan con herramientas simples y bien definidas')
  } else if (riskPoints <= 5) {
    level = 'medium'
  } else {
    level = 'high'
  }

  return { level, factors }
}
