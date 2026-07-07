import type { CapabilityProfile, ToolRecommendation, RecommendationType } from './types'

/**
 * Recommendation Engine — reglas puras, sin IA.
 *
 * Fuentes de señal:
 *  1. Relaciones declaradas en el perfil (relatedTools, dependencies, alternativeTools)
 *  2. Flujo de datos: herramientas que consumen el output de la actual
 *  3. Dominio empresarial compartido
 *  4. Coste y nivel de calidad para recomendaciones de alternativas
 */

export interface ProfileWithSlug {
  slug:        string
  name:        string
  description: string
  profile:     CapabilityProfile
}

/**
 * Herramientas que deben ejecutarse ANTES de la herramienta actual.
 * Provienen de: dependencies declaradas + herramientas cuyo outputType ∈ inputTypes[current].
 */
export function getPrerequisites(
  current: ProfileWithSlug,
  allTools: ProfileWithSlug[],
): ToolRecommendation[] {
  const results: ToolRecommendation[] = []
  const seen = new Set<string>()

  // 1. Declared dependencies
  for (const slug of current.profile.dependencies) {
    const tool = allTools.find((t) => t.slug === slug)
    if (tool && !seen.has(slug)) {
      seen.add(slug)
      results.push({
        slug, name: tool.name, description: tool.description,
        type: 'prerequisite',
        reason: 'Declarado como prerequisito de esta herramienta',
        score: 100,
      })
    }
  }

  // 2. Tools whose output matches our input
  const myInputs = new Set(current.profile.inputTypes)
  for (const tool of allTools) {
    if (tool.slug === current.slug || seen.has(tool.slug)) continue
    const producesForUs = tool.profile.outputTypes.filter((t) => myInputs.has(t))
    if (producesForUs.length > 0) {
      seen.add(tool.slug)
      results.push({
        slug: tool.slug, name: tool.name, description: tool.description,
        type: 'prerequisite',
        reason: `Produce ${producesForUs.join(', ')} que esta herramienta necesita`,
        score: 70 + producesForUs.length * 5,
      })
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 5)
}

/**
 * Herramientas que se pueden ejecutar DESPUÉS de la herramienta actual.
 * Provienen de: relatedTools declarados + herramientas que consumen el output.
 */
export function getNextSteps(
  current: ProfileWithSlug,
  allTools: ProfileWithSlug[],
): ToolRecommendation[] {
  const results: ToolRecommendation[] = []
  const seen = new Set<string>()

  // 1. Related tools (bidirectional affinity, high confidence)
  for (const slug of current.profile.relatedTools) {
    const tool = allTools.find((t) => t.slug === slug)
    if (tool && !seen.has(slug)) {
      seen.add(slug)
      results.push({
        slug, name: tool.name, description: tool.description,
        type: 'next_step',
        reason: 'Los usuarios suelen ejecutar esta herramienta a continuación',
        score: 90,
      })
    }
  }

  // 2. Tools that consume our output
  const myOutputs = new Set(current.profile.outputTypes)
  for (const tool of allTools) {
    if (tool.slug === current.slug || seen.has(tool.slug)) continue
    const consumesOurs = tool.profile.inputTypes.filter((t) => myOutputs.has(t))
    if (consumesOurs.length > 0) {
      seen.add(tool.slug)
      results.push({
        slug: tool.slug, name: tool.name, description: tool.description,
        type: 'related',
        reason: `Puede usar el resultado de esta herramienta (${consumesOurs.join(', ')})`,
        score: 60 + consumesOurs.length * 8,
      })
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 6)
}

/**
 * Alternativas: herramientas con propósito similar.
 * Incluye alternativas declaradas + herramientas del mismo dominio con IOTypes similares.
 */
export function getAlternatives(
  current: ProfileWithSlug,
  allTools: ProfileWithSlug[],
): ToolRecommendation[] {
  const results: ToolRecommendation[] = []
  const seen = new Set<string>()

  // 1. Declared alternatives (highest confidence)
  for (const slug of current.profile.alternativeTools) {
    const tool = allTools.find((t) => t.slug === slug)
    if (tool && !seen.has(slug)) {
      seen.add(slug)
      let type: RecommendationType = 'related'
      let reason = 'Herramienta alternativa declarada'
      if (tool.profile.executionCostEUR < current.profile.executionCostEUR * 0.7) {
        type = 'cheaper'; reason = 'Alternativa más económica'
      } else if (tool.profile.qualityLevel === 'professional' && current.profile.qualityLevel !== 'professional') {
        type = 'more_precise'; reason = 'Alternativa de mayor calidad'
      } else if (tool.profile.executionCostEUR < current.profile.executionCostEUR) {
        type = 'faster'; reason = 'Alternativa más rápida'
      }
      results.push({ slug, name: tool.name, description: tool.description, type, reason, score: 95 })
    }
  }

  // 2. Same domain + overlapping outputTypes
  const myOutputs = new Set(current.profile.outputTypes)
  for (const tool of allTools) {
    if (tool.slug === current.slug || seen.has(tool.slug)) continue
    if (tool.profile.businessDomain !== current.profile.businessDomain) continue
    const sharedOutput = tool.profile.outputTypes.filter((t) => myOutputs.has(t))
    if (sharedOutput.length > 0) {
      seen.add(tool.slug)
      let type: RecommendationType = 'related'
      let score = 40 + sharedOutput.length * 10
      let reason = `Dominio similar con outputs comunes: ${sharedOutput.join(', ')}`

      if (tool.profile.executionCostEUR < current.profile.executionCostEUR * 0.7) {
        type = 'cheaper'; reason = 'Alternativa más económica en el mismo dominio'
        score += 10
      } else if (tool.profile.qualityLevel === 'professional') {
        type = 'more_precise'; reason = 'Mayor nivel de calidad'
        score += 5
      }
      results.push({ slug: tool.slug, name: tool.name, description: tool.description, type, reason, score })
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 5)
}
