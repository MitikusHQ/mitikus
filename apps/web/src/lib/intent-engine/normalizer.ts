/**
 * Intent Normalizer — mapea ParsedIntent al Capability Graph.
 *
 * Sin embeddings. Sin IA. Solo reglas + conocimiento declarativo del GOAL_CATALOG.
 *
 * Estrategia de normalización:
 *   1. Score cada CanonicalGoal por coincidencia de keywords vs rawGoal
 *   2. Bonus si el dominio coincide
 *   3. La entrada que supera el umbral mínimo gana
 *   4. Si ninguna supera el umbral → canonicalGoal = null
 */

import { GOAL_CATALOG, getGoalsByDomain } from './goals'
import type { ParsedIntent, NormalizedIntent, CanonicalGoal, IntentDomain } from './types'

const MIN_MATCH_SCORE = 1     // umbral mínimo para considerar un match
const DOMAIN_BONUS    = 3     // bonus cuando el dominio coincide
const KEYWORD_SCORE   = 2     // puntos por keyword exacta encontrada en rawGoal

// ── Tokenizer básico ──────────────────────────────────────────────

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')   // quitar acentos
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2),      // tokens de al menos 3 chars
  )
}

// ── Scorer ────────────────────────────────────────────────────────

function scoreGoal(
  rawGoalTokens: Set<string>,
  rawGoalFull:   string,
  domain:        IntentDomain,
  goal:          (typeof GOAL_CATALOG)[CanonicalGoal],
): number {
  let score = 0

  for (const keyword of goal.keywords) {
    // Match exacto de frase (más peso)
    if (rawGoalFull.toLowerCase().includes(keyword.toLowerCase())) {
      score += KEYWORD_SCORE + keyword.split(' ').length   // más largo = más específico
      continue
    }
    // Match por tokens individuales de la keyword
    const kwTokens = tokenize(keyword)
    const overlap  = [...kwTokens].filter((t) => rawGoalTokens.has(t)).length
    if (overlap > 0) {
      score += overlap
    }
  }

  // Bonus de dominio
  if (goal.domain === domain) {
    score += DOMAIN_BONUS
  }

  return score
}

// ── Main normalizer ───────────────────────────────────────────────

/**
 * Mapea ParsedIntent al grafo de conocimiento → NormalizedIntent.
 */
export function normalizeIntent(parsed: ParsedIntent): NormalizedIntent {
  const rawGoalFull   = parsed.rawGoal
  const rawGoalTokens = tokenize(rawGoalFull)

  // Score todos los goals del catálogo
  const scores: Array<{ goal: CanonicalGoal; score: number }> = []

  for (const [goalKey, def] of Object.entries(GOAL_CATALOG)) {
    const score = scoreGoal(rawGoalTokens, rawGoalFull, parsed.domain, def)
    scores.push({ goal: goalKey as CanonicalGoal, score })
  }

  // Ordenar por score descendente
  scores.sort((a, b) => b.score - a.score)

  const bestMatch = scores[0]
  const canonicalGoal: CanonicalGoal | null =
    bestMatch && bestMatch.score >= MIN_MATCH_SCORE ? bestMatch.goal : null

  // Primary tool = primero de la lista del goal ganador
  const primaryTool: string | null = canonicalGoal
    ? (GOAL_CATALOG[canonicalGoal]?.primaryTools[0] ?? null)
    : null

  // Related goals = top 3 con score > 0 excluyendo el ganador
  const relatedGoals: CanonicalGoal[] = scores
    .filter((s) => s.score > 0 && s.goal !== canonicalGoal)
    .slice(0, 3)
    .map((s) => s.goal)

  return {
    ...parsed,
    canonicalGoal,
    primaryTool,
    relatedGoals,
  }
}

// ── Tool resolver ─────────────────────────────────────────────────

/**
 * Dado un CanonicalGoal, devuelve los slugs de herramientas sugeridas.
 * Incluye primaryTools del goal + herramientas relacionadas del mismo dominio.
 */
export function resolveToolsForGoal(goal: CanonicalGoal | null): string[] {
  if (!goal) return []

  const def = GOAL_CATALOG[goal]
  if (!def) return []

  // Herramientas primarias del goal
  const primary = def.primaryTools

  // Herramientas adicionales de goals relacionados del mismo dominio
  const sameDomainGoals = getGoalsByDomain(def.domain)
  const related = sameDomainGoals
    .filter((g) => g.goal !== goal)
    .flatMap((g) => g.primaryTools.slice(0, 1))  // solo la primera de cada related goal

  // Deduplicar manteniendo orden (primarias primero)
  return [...new Set([...primary, ...related])].slice(0, 6)
}

// ── Missing info resolver ──────────────────────────────────────────

/**
 * Detecta entidades requeridas para el goal que no están en el intent.
 * Añade sus preguntas a missingInformation (sin duplicados).
 */
export function enrichMissingInfo(
  normalized: NormalizedIntent,
): NormalizedIntent {
  if (!normalized.canonicalGoal) return normalized

  const def = GOAL_CATALOG[normalized.canonicalGoal]
  if (!def) return normalized

  const ENTITY_QUESTIONS: Record<string, string> = {
    company_name: '¿Cuál es el nombre de la empresa?',
    website:      '¿Cuál es el dominio web a analizar?',
    product:      '¿Cuál es el producto o servicio involucrado?',
    market:       '¿En qué mercado o geografía opera la empresa?',
    sector:       '¿A qué sector pertenece la empresa (industrial, servicios, retail…)?',
    regulation:   '¿Qué normativa o regulación específica aplica?',
    competitors:  '¿Cuáles son los principales competidores?',
    brand:        '¿Cuál es la marca principal involucrada?',
    country:      '¿En qué país opera la empresa?',
  }

  const newMissing = [...normalized.missingInformation]
  const entities   = normalized.entities as unknown as Record<string, unknown>

  for (const requiredKey of def.requiredEntities) {
    const value = entities[requiredKey]
    const isEmpty =
      value === null ||
      value === undefined ||
      (Array.isArray(value) && value.length === 0)

    if (isEmpty) {
      const question = ENTITY_QUESTIONS[requiredKey]
      if (question && !newMissing.includes(question)) {
        newMissing.push(question)
      }
    }
  }

  return { ...normalized, missingInformation: newMissing.slice(0, 5) }
}
