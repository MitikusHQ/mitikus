/**
 * Intent Engine Service — API pública.
 *
 * Punto de entrada único para toda la capa cognitiva.
 * Orquesta: Parser → Validator → Normalizer → Tool Resolver → Observability.
 *
 * Regla: ningún módulo interno llama a este servicio.
 * Solo lo invocan capas externas (API routes, futuros Planning Engine, etc.).
 */

import { randomUUID } from 'crypto'
import { parseUserIntent }                        from './parser'
import { validateIntent }                         from './validator'
import { normalizeIntent, resolveToolsForGoal, enrichMissingInfo } from './normalizer'
import { GOAL_CATALOG }                           from './goals'
import type {
  IntentResult,
  NormalizedIntent,
  ParsedIntent,
  CanonicalGoal,
  IntentDomain,
  IntentEntity,
  IntentConstraint,
  IntentAnalysisRecord,
  IntentValidationResult,
} from './types'

// ── Observability ──────────────────────────────────────────────────

function buildAnalysisRecord(
  requestId:    string,
  input:        string,
  result:       IntentResult,
  inputTokens:  number,
  outputTokens: number,
): IntentAnalysisRecord {
  const constraintsFound = Object.values(result.constraints).filter(
    (v) => v !== null && v !== undefined,
  ).length

  const entitiesExtracted =
    Object.entries(result.entities).filter(([, v]) => {
      if (Array.isArray(v)) return v.length > 0
      return v !== null
    }).length

  return {
    requestId,
    inputLength:        input.length,
    analysisMs:         result.analysisMs,
    canonicalGoal:      result.canonicalGoal,
    domain:             result.domain,
    confidence:         result.confidence,
    entitiesExtracted,
    constraintsFound,
    missingCount:       result.missingInformation.length,
    suggestedToolCount: result.suggestedTools.length,
    modelUsed:          result.modelUsed,
    inputTokens,
    outputTokens,
    timestamp:          new Date().toISOString(),
  }
}

function logAnalysisRecord(record: IntentAnalysisRecord): void {
  // En producción: enviar a analytics / audit log
  // Por ahora: log estructurado para observabilidad en dev
  if (process.env.NODE_ENV !== 'production') {
    console.log('[IntentEngine]', JSON.stringify(record))
  }
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Analiza el input del usuario y devuelve un IntentResult estructurado.
 * Es la única función que los módulos externos deben llamar.
 */
export async function analyzeIntent(input: string): Promise<IntentResult> {
  const requestId = randomUUID()
  const startMs   = Date.now()

  const {
    parsed,
    inputTokens,
    outputTokens,
    modelUsed,
  } = await parseUserIntent(input)

  const normalized      = normalizeIntent(parsed)
  const enriched        = enrichMissingInfo(normalized)
  const suggestedTools  = resolveToolsForGoal(enriched.canonicalGoal)

  const result: IntentResult = {
    requestId,
    input:                      input.slice(0, 500),
    canonicalGoal:              enriched.canonicalGoal,
    rawGoal:                    enriched.rawGoal,
    domain:                     enriched.domain,
    confidence:                 enriched.confidence,
    language:                   enriched.language,
    entities:                   enriched.entities,
    constraints:                enriched.constraints,
    missingInformation:         enriched.missingInformation,
    suggestedTools,
    relatedGoals:               enriched.relatedGoals,
    alternativeInterpretations: enriched.alternativeInterpretations,
    analysisMs:                 Date.now() - startMs,
    modelUsed,
  }

  // Observabilidad — fire and forget
  void Promise.resolve(
    logAnalysisRecord(
      buildAnalysisRecord(requestId, input, result, inputTokens, outputTokens),
    ),
  ).catch(() => { /* never throws */ })

  return result
}

/**
 * Valida semánticamente un IntentResult ya generado.
 */
export function validateIntentResult(result: IntentResult): IntentValidationResult {
  // Construir un ParsedIntent desde el result para reutilizar el validator
  const asParsed: ParsedIntent = {
    rawGoal:                    result.rawGoal,
    domain:                     result.domain,
    confidence:                 result.confidence,
    language:                   result.language,
    entities:                   result.entities,
    constraints:                result.constraints,
    missingInformation:         result.missingInformation,
    alternativeInterpretations: result.alternativeInterpretations,
  }
  return validateIntent(asParsed)
}

/**
 * Normaliza un ParsedIntent ya obtenido (sin llamar a Claude de nuevo).
 * Útil para re-normalizar si el Capability Graph cambia.
 */
export function normalizeIntentData(parsed: ParsedIntent): NormalizedIntent {
  return enrichMissingInfo(normalizeIntent(parsed))
}

/**
 * Resuelve el dominio empresarial de un goal canónico.
 */
export function resolveBusinessGoal(goal: CanonicalGoal): IntentDomain | null {
  return GOAL_CATALOG[goal]?.domain ?? null
}

/**
 * Extrae las entidades más relevantes del IntentResult (no nulas).
 */
export function extractRelevantEntities(
  result: IntentResult,
): Partial<IntentEntity> {
  const out: Partial<IntentEntity> = {}
  const e = result.entities

  if (e.company_name) out.company_name = e.company_name
  if (e.website)      out.website      = e.website
  if (e.product)      out.product      = e.product
  if (e.market)       out.market       = e.market
  if (e.sector)       out.sector       = e.sector
  if (e.regulation)   out.regulation   = e.regulation
  if (e.competitors.length > 0) out.competitors = e.competitors
  if (e.brand)        out.brand        = e.brand
  if (e.country)      out.country      = e.country

  return out
}

/**
 * Extrae las restricciones activas del IntentResult (no nulas).
 */
export function extractActiveConstraints(
  result: IntentResult,
): Partial<IntentConstraint> {
  const out: Partial<IntentConstraint> = {}
  const c = result.constraints

  if (c.budget)         out.budget         = c.budget
  if (c.quality)        out.quality        = c.quality
  if (c.speed)          out.speed          = c.speed
  if (c.depth)          out.depth          = c.depth
  if (c.language)       out.language       = c.language
  if (c.preferredModel) out.preferredModel = c.preferredModel

  return out
}

/**
 * Serializa un IntentResult para consumo por LLM (Planning Engine).
 * Formato plano, sin IDs internos, optimizado para context window.
 */
export function serializeIntentForPlanner(result: IntentResult): Record<string, unknown> {
  return {
    goal:         result.canonicalGoal ?? result.rawGoal,
    domain:       result.domain,
    confidence:   result.confidence,
    language:     result.language,
    entities:     extractRelevantEntities(result),
    constraints:  extractActiveConstraints(result),
    tools:        result.suggestedTools,
    missing:      result.missingInformation,
    alternatives: result.alternativeInterpretations,
  }
}
