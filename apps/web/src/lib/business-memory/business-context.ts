/**
 * Business Context — agrega todo el conocimiento del workspace
 * en un objeto único que consumen Intent Engine, Planning Engine y Execution Engine.
 *
 * Lee de DB en paralelo. Nunca modifica datos.
 */

import { db } from '@/lib/db'
import type { BusinessContext, CompanyProfileData, CompanySize, DigitalMaturity } from './memory-types'
import type { Prisma } from '@prisma/client'

function toArr(v: Prisma.JsonValue): string[] {
  return Array.isArray(v) ? (v as string[]) : []
}

/**
 * Construye el BusinessContext completo para un workspace.
 * Si no hay datos aún, devuelve un contexto vacío (isEmpty: true).
 */
export async function getBusinessContext(workspaceId: string): Promise<BusinessContext> {
  const [profile, objectives, risks, processes, assets] = await Promise.all([
    db.companyProfile.findUnique({ where: { workspaceId } }),
    db.companyObjective.findMany({
      where:   { workspaceId, status: 'active' },
      orderBy: [{ priority: 'asc' }],
      take:    10,
    }),
    db.companyRisk.findMany({
      where:   { workspaceId, status: 'open' },
      orderBy: [{ level: 'asc' }],
      take:    20,
    }),
    db.companyProcess.findMany({
      where:   { workspaceId },
      orderBy: [{ domain: 'asc' }],
      take:    30,
    }),
    db.companyAsset.findMany({
      where:   { workspaceId, status: 'active' },
      orderBy: [{ type: 'asc' }],
      take:    20,
    }),
  ])

  if (!profile) {
    return emptyContext(workspaceId)
  }

  return {
    workspaceId,
    companyName:     profile.companyName,
    sector:          profile.sector,
    country:         profile.country,
    website:         profile.website,
    size:            profile.size as CompanySize,
    languages:       toArr(profile.languages),
    services:        toArr(profile.services),
    products:        toArr(profile.products),
    markets:         toArr(profile.markets),
    competitors:     toArr(profile.competitors),
    regulations:     toArr(profile.regulations),
    certifications:  toArr(profile.certifications),
    softwareUsed:    toArr(profile.softwareUsed),
    digitalMaturity: profile.digitalMaturity as DigitalMaturity,
    departments:     toArr(profile.departments),
    activeObjectives: objectives.map((o) => ({
      id:               o.id,
      workspaceId:      o.workspaceId,
      canonicalGoal:    o.canonicalGoal,
      label:            o.label,
      description:      o.description,
      status:           o.status as 'active' | 'completed' | 'paused' | 'cancelled',
      priority:         o.priority as 'low' | 'medium' | 'high' | 'critical',
      progress:         o.progress,
      dueDate:          o.dueDate?.toISOString() ?? null,
      completedAt:      o.completedAt?.toISOString() ?? null,
      linkedWorkflowId: o.linkedWorkflowId,
    })),
    openRisks: risks.map((r) => ({
      id:          r.id,
      workspaceId: r.workspaceId,
      domain:      r.domain,
      level:       r.level as 'low' | 'medium' | 'high' | 'critical',
      title:       r.title,
      description: r.description,
      status:      r.status as 'open' | 'mitigated' | 'resolved' | 'accepted',
      source:      r.source as 'manual' | 'tool_execution' | 'workflow' | 'system',
      detectedAt:  r.detectedAt.toISOString(),
      resolvedAt:  r.resolvedAt?.toISOString() ?? null,
    })),
    knownProcesses: processes.map((p) => ({
      id:           p.id,
      workspaceId:  p.workspaceId,
      domain:       p.domain as 'sales' | 'marketing' | 'quality' | 'operations' | 'hr' | 'finance' | 'legal' | 'procurement' | 'it' | 'admin',
      name:         p.name,
      description:  p.description,
      isDocumented: p.isDocumented,
      maturity:     p.maturity as 'informal' | 'documented' | 'optimized' | 'automated',
      toolSlugs:    Array.isArray(p.toolSlugs) ? (p.toolSlugs as string[]) : [],
    })),
    keyAssets: assets.map((a) => ({
      id:          a.id,
      workspaceId: a.workspaceId,
      type:        a.type as 'web' | 'erp' | 'crm' | 'software' | 'document' | 'equipment' | 'integration' | 'other',
      name:        a.name,
      description: a.description,
      url:         a.url,
      vendor:      a.vendor,
      status:      a.status as 'active' | 'inactive' | 'planned',
    })),
    confidence:  profile.confidence,
    lastUpdated: profile.lastUpdatedAt.toISOString(),
    isEmpty:     false,
  }
}

function emptyContext(workspaceId: string): BusinessContext {
  return {
    workspaceId,
    companyName:      null,
    sector:           null,
    country:          null,
    website:          null,
    size:             'unknown',
    languages:        [],
    services:         [],
    products:         [],
    markets:          [],
    competitors:      [],
    regulations:      [],
    certifications:   [],
    softwareUsed:     [],
    digitalMaturity:  'emerging',
    departments:      [],
    activeObjectives: [],
    openRisks:        [],
    knownProcesses:   [],
    keyAssets:        [],
    confidence:       0,
    lastUpdated:      null,
    isEmpty:          true,
  }
}
