/**
 * Company Risks — riesgos detectados en el workspace.
 *
 * Los riesgos pueden alimentar el Planning Engine para ajustar estrategias.
 */

import { db } from '@/lib/db'
import { getOrCreateProfile } from './company-profile'
import type { CompanyRiskData, RiskLevel, RiskStatus, RiskSource } from './memory-types'

function mapRisk(r: {
  id: string
  workspaceId: string
  domain: string
  level: string
  title: string
  description: string | null
  status: string
  source: string
  detectedAt: Date
  resolvedAt: Date | null
}): CompanyRiskData {
  return {
    id:          r.id,
    workspaceId: r.workspaceId,
    domain:      r.domain,
    level:       r.level as RiskLevel,
    title:       r.title,
    description: r.description,
    status:      r.status as RiskStatus,
    source:      r.source as RiskSource,
    detectedAt:  r.detectedAt.toISOString(),
    resolvedAt:  r.resolvedAt?.toISOString() ?? null,
  }
}

export async function getRisks(
  workspaceId: string,
  status: RiskStatus = 'open',
): Promise<CompanyRiskData[]> {
  const rows = await db.companyRisk.findMany({
    where:   { workspaceId, status },
    orderBy: [{ level: 'asc' }, { detectedAt: 'desc' }],
  })
  return rows.map(mapRisk)
}

export async function registerRisk(
  workspaceId: string,
  data: {
    domain:      string
    level:       RiskLevel
    title:       string
    description?: string
    source:      RiskSource
    sourceId?:   string
  },
): Promise<CompanyRiskData> {
  const profile = await getOrCreateProfile(workspaceId)

  // No registrar el mismo riesgo dos veces
  const duplicate = await db.companyRisk.findFirst({
    where: { workspaceId, title: data.title, status: { not: 'resolved' } },
  })
  if (duplicate) return mapRisk(duplicate)

  const created = await db.companyRisk.create({
    data: {
      workspaceId,
      profileId:   profile.id,
      domain:      data.domain,
      level:       data.level,
      title:       data.title.trim().slice(0, 300),
      description: data.description?.trim().slice(0, 1000) ?? null,
      source:      data.source,
      status:      'open',
    },
  })
  return mapRisk(created)
}

export async function resolveRisk(
  id: string,
  workspaceId: string,
  status: Exclude<RiskStatus, 'open'>,
): Promise<CompanyRiskData | null> {
  const risk = await db.companyRisk.findFirst({ where: { id, workspaceId } })
  if (!risk) return null

  const updated = await db.companyRisk.update({
    where: { id },
    data:  { status, resolvedAt: new Date() },
  })
  return mapRisk(updated)
}
