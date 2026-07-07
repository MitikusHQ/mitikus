import type { CapabilityProfile, CompatibilityScore, IOType } from './types'

/**
 * Compatibility Engine — determina si dos herramientas pueden conectarse
 * en un workflow y con qué grado de afinidad.
 *
 * Criterios (ponderados):
 *  40% — flujo de datos: outputTypes[A] ∩ inputTypes[B]
 *  20% — relación declarada (relatedTools / dependencies)
 *  15% — mismo dominio empresarial
 *  15% — nivel de calidad compatible
 *  10% — proveedor/modelo compartido
 */

const WEIGHTS = {
  dataFlow:   0.40,
  declared:   0.20,
  domain:     0.15,
  quality:    0.15,
  provider:   0.10,
} as const

const QUALITY_ORDER: Record<string, number> = {
  draft: 1, standard: 2, professional: 3,
}

function dataFlowScore(a: CapabilityProfile, b: CapabilityProfile): { score: number; matchedTypes: IOType[] } {
  const aOut = new Set(a.outputTypes)
  const bIn  = new Set(b.inputTypes)
  const matched = [...aOut].filter((t) => bIn.has(t)) as IOType[]

  if (matched.length === 0) return { score: 0, matchedTypes: [] }

  // Partial credit: more shared types → higher score
  const score = Math.min(1, matched.length / Math.max(1, Math.min(aOut.size, bIn.size)))
  return { score, matchedTypes: matched }
}

function declaredScore(a: CapabilityProfile, bSlug: string): { score: number; isDeclared: boolean } {
  const related   = new Set(a.relatedTools)
  const successor = new Set([...a.relatedTools]) // relatedTools implies bidirectional affinity

  // dependencies: b must run BEFORE a — here we check if a declares b as dependency
  // relatedTools: explicitly marked as usable together
  const isDeclared = related.has(bSlug) || a.dependencies.includes(bSlug)
  return { score: isDeclared ? 1 : 0, isDeclared }
}

function domainScore(a: CapabilityProfile, b: CapabilityProfile): number {
  return a.businessDomain === b.businessDomain ? 1 : 0
}

function qualityScore(a: CapabilityProfile, b: CapabilityProfile): number {
  const diff = Math.abs(
    (QUALITY_ORDER[a.qualityLevel] ?? 2) - (QUALITY_ORDER[b.qualityLevel] ?? 2),
  )
  // Same quality → 1.0 | 1 level apart → 0.5 | 2 levels apart → 0.0
  return Math.max(0, 1 - diff * 0.5)
}

function providerScore(a: CapabilityProfile, b: CapabilityProfile): number {
  const aP = new Set(a.supportedProviders)
  const bP = new Set(b.supportedProviders)
  const shared = [...aP].filter((p) => bP.has(p)).length
  if (aP.size === 0 || bP.size === 0) return 0.5  // unknown → neutral
  return shared > 0 ? 1 : 0
}

function levelLabel(score: number): CompatibilityScore['level'] {
  if (score >= 85) return 'excellent'
  if (score >= 65) return 'high'
  if (score >= 40) return 'medium'
  if (score >= 15) return 'low'
  return 'none'
}

/**
 * Calcula la compatibilidad de A → B (A produce, B consume).
 * Devuelve una puntuación 0-100 y el detalle.
 */
export function calculateCompatibility(
  profileA: CapabilityProfile,
  profileB: CapabilityProfile,
  slugB: string,
): CompatibilityScore {
  const { score: dfScore, matchedTypes } = dataFlowScore(profileA, profileB)
  const { score: decScore, isDeclared }  = declaredScore(profileA, slugB)
  const domScore = domainScore(profileA, profileB)
  const qlScore  = qualityScore(profileA, profileB)
  const prvScore = providerScore(profileA, profileB)

  const total = Math.round(
    dfScore   * WEIGHTS.dataFlow * 100 +
    decScore  * WEIGHTS.declared  * 100 +
    domScore  * WEIGHTS.domain    * 100 +
    qlScore   * WEIGHTS.quality   * 100 +
    prvScore  * WEIGHTS.provider  * 100,
  )

  const reasons: string[] = []
  const blockers: string[] = []

  if (dfScore > 0) reasons.push(`Flujo de datos: ${matchedTypes.join(', ')}`)
  else             blockers.push('Sin flujo de datos compatible entre las herramientas')

  if (isDeclared)   reasons.push('Relación declarada explícitamente')
  if (domScore > 0) reasons.push('Mismo dominio empresarial')
  if (qlScore < 0.5) blockers.push('Niveles de calidad incompatibles')
  if (prvScore < 1 && profileA.supportedProviders.length > 0 && profileB.supportedProviders.length > 0) {
    blockers.push('Proveedores de IA sin coincidencia')
  }

  return {
    score: total,
    level: levelLabel(total),
    reasons,
    blockers,
    dataFlowMatch: dfScore > 0,
    isDeclared,
  }
}
