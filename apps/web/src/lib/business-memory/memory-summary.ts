/**
 * Memory Summary — genera un resumen compacto del contexto empresarial para LLMs.
 *
 * Solo incluye la información relevante. No envía toda la BD.
 * El objetivo es minimizar tokens enviados sin perder información clave.
 */

import type { BusinessContext, MemorySummary } from './memory-types'

const TOKENS_PER_WORD = 1.3

/**
 * Genera un resumen compacto para incluir en prompts de Claude/GPT.
 */
export function summarizeContext(ctx: BusinessContext): MemorySummary {
  if (ctx.isEmpty) {
    return {
      workspaceId:    ctx.workspaceId,
      companyLine:    'Empresa sin datos registrados aún',
      contextLines:   [],
      objectivesLine: '',
      risksLine:      '',
      confidence:     0,
      tokenEstimate:  20,
    }
  }

  // Línea de identidad
  const identityParts = [
    ctx.companyName,
    ctx.sector,
    ctx.country,
  ].filter(Boolean)
  const companyLine = identityParts.join(' — ') || 'Empresa sin nombre'

  const contextLines: string[] = []

  // Tamaño y madurez digital
  if (ctx.size !== 'unknown') {
    contextLines.push(`Tamaño: ${ctx.size}`)
  }
  if (ctx.digitalMaturity !== 'emerging') {
    contextLines.push(`Madurez digital: ${ctx.digitalMaturity}`)
  }

  // Servicios o productos (máx 3)
  if (ctx.services.length > 0) {
    contextLines.push(`Servicios: ${ctx.services.slice(0, 3).join(', ')}`)
  } else if (ctx.products.length > 0) {
    contextLines.push(`Productos: ${ctx.products.slice(0, 3).join(', ')}`)
  }

  // Mercados (máx 2)
  if (ctx.markets.length > 0) {
    contextLines.push(`Mercados: ${ctx.markets.slice(0, 2).join(', ')}`)
  }

  // Web
  if (ctx.website) {
    contextLines.push(`Web: ${ctx.website}`)
  }

  // Normativas relevantes
  if (ctx.regulations.length > 0) {
    contextLines.push(`Normativas: ${ctx.regulations.slice(0, 3).join(', ')}`)
  }

  // Certificaciones
  if (ctx.certifications.length > 0) {
    contextLines.push(`Certificaciones: ${ctx.certifications.slice(0, 3).join(', ')}`)
  }

  // Software clave (máx 3)
  if (ctx.softwareUsed.length > 0) {
    contextLines.push(`Software: ${ctx.softwareUsed.slice(0, 3).join(', ')}`)
  }

  // Departamentos (máx 4)
  if (ctx.departments.length > 0) {
    contextLines.push(`Departamentos: ${ctx.departments.slice(0, 4).join(', ')}`)
  }

  // Línea de objetivos (máx 3 activos)
  let objectivesLine = ''
  if (ctx.activeObjectives.length > 0) {
    const topObjectives = ctx.activeObjectives
      .slice(0, 3)
      .map((o) => `${o.label} (${o.priority})`)
      .join(', ')
    objectivesLine = `Objetivos activos: ${topObjectives}`
  }

  // Línea de riesgos (solo high/critical, máx 3)
  let risksLine = ''
  const criticalRisks = ctx.openRisks.filter((r) => r.level === 'high' || r.level === 'critical')
  if (criticalRisks.length > 0) {
    const riskTitles = criticalRisks.slice(0, 3).map((r) => r.title).join(', ')
    risksLine = `Riesgos detectados (${criticalRisks[0]!.level}): ${riskTitles}`
  }

  const allText = [companyLine, ...contextLines, objectivesLine, risksLine].join(' ')
  const wordCount = allText.split(/\s+/).length
  const tokenEstimate = Math.ceil(wordCount * TOKENS_PER_WORD)

  return {
    workspaceId:    ctx.workspaceId,
    companyLine,
    contextLines,
    objectivesLine,
    risksLine,
    confidence:     ctx.confidence,
    tokenEstimate,
  }
}

/**
 * Serializa el contexto empresarial para incluirlo en un prompt LLM.
 * Formato de texto plano optimizado para tokens.
 */
export function contextToPromptString(ctx: BusinessContext): string {
  const summary = summarizeContext(ctx)

  if (ctx.isEmpty) return ''

  const lines: string[] = [
    `## Contexto empresarial`,
    summary.companyLine,
    ...summary.contextLines,
  ]

  if (summary.objectivesLine) lines.push(summary.objectivesLine)
  if (summary.risksLine)      lines.push(summary.risksLine)

  // Procesos conocidos (solo si hay)
  if (ctx.knownProcesses.length > 0) {
    const domains = [...new Set(ctx.knownProcesses.map((p) => p.domain))]
    lines.push(`Procesos conocidos: ${domains.join(', ')}`)
  }

  return lines.join('\n')
}

/**
 * Serializa el contexto como Record plano para serializar en JSON a un LLM.
 */
export function contextToRecord(ctx: BusinessContext): Record<string, unknown> {
  return {
    company:        ctx.companyName,
    sector:         ctx.sector,
    country:        ctx.country,
    size:           ctx.size !== 'unknown' ? ctx.size : undefined,
    website:        ctx.website,
    services:       ctx.services.slice(0, 5),
    products:       ctx.products.slice(0, 5),
    markets:        ctx.markets.slice(0, 3),
    regulations:    ctx.regulations.slice(0, 5),
    certifications: ctx.certifications.slice(0, 5),
    software:       ctx.softwareUsed.slice(0, 5),
    maturity:       ctx.digitalMaturity,
    objectives:     ctx.activeObjectives.slice(0, 3).map((o) => ({
      goal:     o.canonicalGoal,
      label:    o.label,
      priority: o.priority,
      progress: o.progress,
    })),
    risks: ctx.openRisks
      .filter((r) => r.level === 'high' || r.level === 'critical')
      .slice(0, 3)
      .map((r) => ({ title: r.title, level: r.level })),
    confidence: ctx.confidence,
  }
}
