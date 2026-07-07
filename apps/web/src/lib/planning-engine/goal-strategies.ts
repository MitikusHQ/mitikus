/**
 * Goal Strategies — define qué herramientas usa cada estrategia por objetivo.
 *
 * Para cada CanonicalGoal genera 3 variantes de herramientas:
 *   complete  → máxima cobertura, todos los tools primarios + contextuales
 *   fast      → solo automationFriendly, mínimo de tools necesarios
 *   economic  → tools más baratos del goal, mínimo coste
 *
 * No contiene lógica de puntuación ni de planificación.
 * Solo conocimiento declarativo: qué herramientas usar en cada estrategia.
 */

import { GOAL_CATALOG } from '@/lib/intent-engine/goals'
import { CAPABILITY_PROFILES } from '@/registry/official/_capability-profiles'
import type { CanonicalGoal, IntentDomain } from '@/lib/intent-engine/types'
import type { PlanStrategyType } from './planner-types'

export interface StrategyToolList {
  strategyType: PlanStrategyType
  toolSlugs:    string[]       // en orden de ejecución recomendado
  label:        string
  description:  string
}

const MAX_COMPLETE_TOOLS = 7
const MAX_FAST_TOOLS     = 4
const MAX_ECONOMIC_TOOLS = 4

// ── Strategy builder ──────────────────────────────────────────────

/**
 * Para un CanonicalGoal dado, devuelve las 3 listas de herramientas.
 * Usa GOAL_CATALOG para las herramientas primarias y
 * CAPABILITY_PROFILES para filtrar por automationFriendly y coste.
 */
export function buildStrategiesForGoal(
  goal: CanonicalGoal,
): StrategyToolList[] {
  const def = GOAL_CATALOG[goal]
  if (!def) return []

  const primary = def.primaryTools

  // Enriquecer con datos del capability graph
  const enriched = primary
    .map((slug) => ({
      slug,
      profile: CAPABILITY_PROFILES[slug] ?? null,
    }))
    .filter((t) => t.profile !== null)

  // ── COMPLETE: todos los tools primarios, ordenados por dependencia ────
  const completeTools = orderByDependencies(
    enriched.map((t) => t.slug),
  ).slice(0, MAX_COMPLETE_TOOLS)

  // ── FAST: solo automationFriendly, máx 4 tools ───────────────────
  const fastTools = orderByDependencies(
    enriched
      .filter((t) => t.profile!.automationFriendly)
      .map((t) => t.slug),
  ).slice(0, MAX_FAST_TOOLS)

  // Si fast queda vacío (no hay automationFriendly), usar los 2 primeros
  const fastFinal = fastTools.length > 0
    ? fastTools
    : completeTools.slice(0, 2)

  // ── ECONOMIC: los más baratos, máx 4 tools ────────────────────────
  const economicTools = orderByDependencies(
    [...enriched]
      .sort((a, b) => (a.profile!.executionCostEUR) - (b.profile!.executionCostEUR))
      .map((t) => t.slug),
  ).slice(0, MAX_ECONOMIC_TOOLS)

  const economicFinal = economicTools.length > 0
    ? economicTools
    : completeTools.slice(0, 2)

  return [
    {
      strategyType: 'complete',
      toolSlugs:    completeTools,
      label:        'Calidad máxima',
      description:  `Proceso completo con ${completeTools.length} herramientas para máxima cobertura del objetivo`,
    },
    {
      strategyType: 'fast',
      toolSlugs:    fastFinal,
      label:        'Ejecución rápida',
      description:  `Proceso optimizado con ${fastFinal.length} herramientas automatizables para resultados inmediatos`,
    },
    {
      strategyType: 'economic',
      toolSlugs:    economicFinal,
      label:        'Mínimo coste',
      description:  `Proceso eficiente con ${economicFinal.length} herramientas al menor coste posible`,
    },
  ]
}

/**
 * Para un dominio empresarial, devuelve herramientas representativas
 * cuando no hay un CanonicalGoal exacto.
 */
export function buildStrategiesForDomain(
  domain: IntentDomain,
): StrategyToolList[] {
  // Buscar el primer goal del dominio
  const domainGoal = Object.entries(GOAL_CATALOG).find(
    ([, def]) => def.domain === domain,
  )

  if (domainGoal) {
    return buildStrategiesForGoal(domainGoal[0] as CanonicalGoal)
  }

  return []
}

// ── Dependency ordering ───────────────────────────────────────────

/**
 * Ordena tools respetando sus dependencias declaradas.
 * Si A.dependencies incluye B, B va antes que A.
 * Implementación topológica simple (no detecta ciclos — los perfiles no tienen).
 */
function orderByDependencies(slugs: string[]): string[] {
  const slugSet  = new Set(slugs)
  const ordered: string[] = []
  const visited  = new Set<string>()

  function visit(slug: string) {
    if (visited.has(slug)) return
    visited.add(slug)

    const profile = CAPABILITY_PROFILES[slug]
    if (profile) {
      for (const dep of profile.dependencies) {
        if (slugSet.has(dep)) visit(dep)
      }
    }

    ordered.push(slug)
  }

  for (const slug of slugs) visit(slug)
  return ordered
}
