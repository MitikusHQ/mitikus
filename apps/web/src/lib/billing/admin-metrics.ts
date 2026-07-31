'use server'

import { db } from '@/lib/db'

export interface SaaSMetrics {
  // Usuarios
  totalOrgs:       number
  activeOrgs:      number   // al menos 1 workspace con actividad en 30 días
  totalUsers:      number
  newUsersLast7d:  number
  newUsersLast30d: number

  // Planes
  byTier: Record<string, number>
  trialing: number
  active: number
  pastDue: number
  cancelled: number

  // MRR estimado (EUR, basado en tier)
  mrrEur: number

  // Herramientas / actividad
  toolExecutionsLast30d: number
  aiCostEurLast30d: number

  // Fiscal
  totalFiscalDeclarations: number
  declaracionesPresentadas: number
}

const TIER_PRICE: Record<string, number> = {
  STARTER:      39,
  PROFESSIONAL: 149,
  BUSINESS:     349,
  ENTERPRISE:   599,
}

export async function getAdminSaaSMetrics(): Promise<SaaSMetrics> {
  const now = new Date()
  const d30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000)
  const d7  = new Date(now.getTime() -  7 * 24 * 3600 * 1000)

  const [
    totalOrgs,
    totalUsers,
    newUsersLast7d,
    newUsersLast30d,
    subscriptions,
    executions,
    aiCostRaw,
    fiscalTotal,
    fiscalPresented,
  ] = await Promise.all([
    db.organization.count(),
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: d7  } } }),
    db.user.count({ where: { createdAt: { gte: d30 } } }),
    db.subscription.findMany({ select: { tier: true, status: true } }),
    db.productEvent.count({
      where: { event: 'tool.execution.completed', createdAt: { gte: d30 } },
    }).catch(() => 0),
    db.productEvent.findMany({
      where: { event: 'tool.execution.completed', createdAt: { gte: d30 } },
      select: { properties: true },
    }).catch(() => []),
    db.fiscalDeclaration.count().catch(() => 0),
    db.fiscalDeclaration.count({ where: { status: 'presentada' } }).catch(() => 0),
  ])

  const byTier: Record<string, number> = {}
  let trialing = 0, active = 0, pastDue = 0, cancelled = 0, mrrEur = 0

  for (const s of subscriptions) {
    byTier[s.tier] = (byTier[s.tier] ?? 0) + 1
    if (s.status === 'TRIALING')   trialing++
    if (s.status === 'ACTIVE')     { active++;    mrrEur += TIER_PRICE[s.tier] ?? 0 }
    if (s.status === 'PAST_DUE')   pastDue++
    if (s.status === 'CANCELLED')  cancelled++
  }

  const aiCostEurLast30d = (aiCostRaw as Array<{ properties: unknown }>).reduce((sum, ev) => {
    const meta = ev.properties as Record<string, unknown> | null
    const cost = typeof meta?.costEur === 'number' ? meta.costEur : 0
    return sum + cost
  }, 0)

  // Orgs activas = tienen al menos 1 productEvent en 30d
  const activeOrgIds = await db.productEvent.groupBy({
    by: ['orgId'],
    where: { createdAt: { gte: d30 } },
  }).catch(() => [])
  const activeOrgs = activeOrgIds.length

  return {
    totalOrgs,
    activeOrgs,
    totalUsers,
    newUsersLast7d,
    newUsersLast30d,
    byTier,
    trialing,
    active,
    pastDue,
    cancelled,
    mrrEur,
    toolExecutionsLast30d: executions as number,
    aiCostEurLast30d,
    totalFiscalDeclarations: fiscalTotal as number,
    declaracionesPresentadas: fiscalPresented as number,
  }
}
