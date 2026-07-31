/**
 * Suggestion Engine — genera sugerencias inteligentes cuando el usuario no escribe nada.
 *
 * Fuentes:
 *   - Business Memory: objetivos activos, riesgos, procesos
 *   - Analytics: herramientas más usadas, dominios sin explorar
 *
 * Nunca hardcodeadas. Siempre calculadas.
 * Máximo 5 sugerencias.
 */

import { db } from '@/lib/db'
import type { CopilotSuggestion, SuggestionCategory } from './copilot-types'
import type { BusinessContext } from '@/lib/business-memory/memory-types'
import { GOAL_CATALOG } from '@/lib/intent-engine/goals'
import type { CanonicalGoal } from '@/lib/intent-engine/types'
import { randomUUID } from 'crypto'
import { getFiscalEvents } from '@/lib/fiscal-calendar'

const MAX_SUGGESTIONS = 5

// ── Domain icons ──────────────────────────────────────────────────
const DOMAIN_ICONS: Record<string, string> = {
  marketing:   '📢',
  sales:       '💼',
  quality:     '✅',
  hr:          '👥',
  finance:     '📊',
  it:          '💻',
  legal:       '⚖️',
  operations:  '⚙️',
  procurement: '🛒',
  strategy:    '🎯',
  admin:       '📋',
}

// ── Public API ────────────────────────────────────────────────────

export async function generateSuggestions(
  workspaceId: string,
  context: BusinessContext,
): Promise<CopilotSuggestion[]> {
  const suggestions: CopilotSuggestion[] = []

  // 0. Obligaciones fiscales próximas — prioridad máxima
  const fiscalSuggestions = await suggestFromFiscal(workspaceId)
  suggestions.push(...fiscalSuggestions)

  // 1. Objetivos activos con poco progreso → continuar
  for (const obj of context.activeObjectives.slice(0, 2)) {
    if (obj.progress < 80) {
      suggestions.push({
        id:           randomUUID(),
        category:     'objective',
        label:        obj.label,
        description:  `Objetivo activo — progreso actual: ${obj.progress}%`,
        canonicalGoal: obj.canonicalGoal,
        icon:         '🎯',
      })
    }
  }

  // 2. Riesgos high/critical → sugerir mitigación
  const criticalRisks = context.openRisks.filter(
    (r) => r.level === 'high' || r.level === 'critical',
  )
  if (criticalRisks.length > 0 && suggestions.length < MAX_SUGGESTIONS) {
    const risk = criticalRisks[0]!
    suggestions.push({
      id:           randomUUID(),
      category:     'risk',
      label:        `Mitigar riesgo: ${risk.title}`,
      description:  `Riesgo ${risk.level} detectado en el área de ${risk.domain}`,
      canonicalGoal: null,
      icon:         '⚠️',
    })
  }

  // 3. Dominios sin explorar → recomendar acción
  if (suggestions.length < MAX_SUGGESTIONS) {
    const coveredDomains = new Set([
      ...context.knownProcesses.map((p) => p.domain),
      context.sector ? inferDomainFromSector(context.sector) : null,
    ].filter(Boolean))

    const allDomains = ['marketing', 'sales', 'quality', 'hr', 'finance', 'it']
    const unexplored  = allDomains.filter((d) => !coveredDomains.has(d))

    for (const domain of unexplored.slice(0, 2)) {
      if (suggestions.length >= MAX_SUGGESTIONS) break
      const goalForDomain = findGoalForDomain(domain)
      if (goalForDomain) {
        suggestions.push({
          id:           randomUUID(),
          category:     'domain',
          label:        goalForDomain.labelEs,
          description:  `El área de ${domain} no ha sido explorada aún en esta empresa`,
          canonicalGoal: goalForDomain.goal as string,
          icon:         DOMAIN_ICONS[domain] ?? '📋',
        })
      }
    }
  }

  // 4. Historial de ejecuciones — sugerencias basadas en analytics
  if (suggestions.length < MAX_SUGGESTIONS) {
    const analyticsItems = await suggestFromAnalytics(workspaceId)
    for (const item of analyticsItems) {
      if (suggestions.length >= MAX_SUGGESTIONS) break
      suggestions.push(item)
    }
  }

  // 5. Fallback si no hay sugerencias: ideas generales por sector
  if (suggestions.length === 0) {
    suggestions.push(...defaultSuggestionsForContext(context))
  }

  return suggestions.slice(0, MAX_SUGGESTIONS)
}

// ── Helpers privados ──────────────────────────────────────────────

function findGoalForDomain(domain: string) {
  return Object.entries(GOAL_CATALOG).find(
    ([, def]) => def.domain === domain,
  )?.[1] ?? null
}

function inferDomainFromSector(sector: string): string | null {
  const s = sector.toLowerCase()
  if (s.includes('industria') || s.includes('manufactu')) return 'quality'
  if (s.includes('comercio') || s.includes('retail'))   return 'sales'
  if (s.includes('tecnolog') || s.includes('software')) return 'it'
  if (s.includes('salud') || s.includes('medical'))     return 'legal'
  return null
}

async function suggestFromAnalytics(workspaceId: string): Promise<CopilotSuggestion[]> {
  try {
    // Herramientas ejecutadas en los últimos 30 días
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recent = await db.toolExecution.findMany({
      where:   { workspaceId, createdAt: { gte: since }, status: 'COMPLETED' },
      include: { toolInstance: { include: { toolDefinition: true } } },
      take:    10,
    })

    if (recent.length === 0) return []

    // Encontrar una herramienta relacionada no ejecutada
    const executedSlugs = new Set(
      recent.map((e) => e.toolInstance.toolDefinition.slug),
    )
    const FOLLOW_UP: Record<string, { goal: string; label: string; icon: string }> = {
      'seo-audit':       { goal: 'seo_optimization',   label: 'Optimizar SEO con plan editorial',   icon: '📝' },
      'iso9001-audit':   { goal: 'iso9001_certification', label: 'Iniciar proceso ISO 9001',       icon: '✅' },
      'crm-leads':       { goal: 'sales_pipeline_management', label: 'Gestionar pipeline comercial', icon: '💼' },
      'social-media-audit': { goal: 'campaign_management', label: 'Crear campaña basada en análisis', icon: '📢' },
    }

    for (const slug of executedSlugs) {
      const followUp = FOLLOW_UP[slug]
      if (followUp && !executedSlugs.has(followUp.goal)) {
        return [{
          id:           randomUUID(),
          category:     'analytics',
          label:        followUp.label,
          description:  `Acción recomendada tras ejecutar ${slug} recientemente`,
          canonicalGoal: followUp.goal,
          icon:         followUp.icon,
        }]
      }
    }
  } catch {
    // silencioso
  }
  return []
}

async function suggestFromFiscal(workspaceId: string): Promise<CopilotSuggestion[]> {
  try {
    const profile = await db.companyProfile.findUnique({
      where: { workspaceId },
      select: { legalForm: true, country: true },
    })
    if (!profile?.legalForm && !profile?.country) return []

    const events = getFiscalEvents(profile.country ?? 'ES', profile.legalForm)
    const upcoming = events.filter((e) => e.status === 'proximo')

    return upcoming.slice(0, 2).map((e) => ({
      id:           randomUUID(),
      category:     'fiscal' as const,
      label:        `Preparar ${e.titulo} — ${e.periodo}`,
      description:  `Vence el ${e.deadline.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} · Modelo ${e.modelo}`,
      canonicalGoal: null,
      icon:         '🗓️',
    }))
  } catch {
    return []
  }
}

function defaultSuggestionsForContext(ctx: BusinessContext): CopilotSuggestion[] {
  const base: CopilotSuggestion[] = [
    {
      id:           randomUUID(),
      category:     'domain',
      label:        'Análisis estratégico de la empresa',
      description:  'Diagnóstico completo del estado actual del negocio',
      canonicalGoal: 'business_diagnosis',
      icon:         '🎯',
    },
    {
      id:           randomUUID(),
      category:     'domain',
      label:        'Mejorar el posicionamiento digital',
      description:  'Auditoría SEO y plan de contenidos',
      canonicalGoal: 'seo_optimization',
      icon:         '📢',
    },
    {
      id:           randomUUID(),
      category:     'domain',
      label:        'Organizar el proceso comercial',
      description:  'Gestión de leads y pipeline de ventas',
      canonicalGoal: 'crm_lead_management',
      icon:         '💼',
    },
  ]

  if (ctx.regulations.length === 0) {
    base.push({
      id:           randomUUID(),
      category:     'domain',
      label:        'Revisar cumplimiento normativo',
      description:  'Identificar normativas aplicables al sector',
      canonicalGoal: 'gdpr_compliance',
      icon:         '⚖️',
    })
  }

  return base.slice(0, MAX_SUGGESTIONS)
}
