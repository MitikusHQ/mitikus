import { db } from '@/lib/db'
import { getPlanLimits, startOfMonthUTC } from '@/lib/plan-limits'
import { PLAN_CATALOG } from '@/lib/billing/plan-catalog'
import type { PlanTier } from '@prisma/client'

export interface LimitResult {
  allowed: boolean
  reason?: string
  current: number
  limit: number
}

function envInt(key: string, fallback: number): number {
  const v = process.env[key]
  if (!v) return fallback
  const n = parseInt(v, 10)
  return isNaN(n) || n <= 0 ? fallback : n
}

function envFloat(key: string, fallback: number): number {
  const v = process.env[key]
  if (!v) return fallback
  const n = parseFloat(v)
  return isNaN(n) || n <= 0 ? fallback : n
}

function startOfTodayUTC(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

// Solo cuenta llamadas que realmente llegaron a Anthropic (excluye rate_limited)
const REAL_CALL_FILTER = { status: { not: 'rate_limited' as const } }

export async function getUserUsageToday(userId: string, todayStart = startOfTodayUTC()): Promise<number> {
  return db.aIUsage.count({
    where: { userId, ...REAL_CALL_FILTER, createdAt: { gte: todayStart } },
  })
}

export async function getWorkspaceUsageToday(workspaceId: string, todayStart = startOfTodayUTC()): Promise<number> {
  return db.aIUsage.count({
    where: { workspaceId, ...REAL_CALL_FILTER, createdAt: { gte: todayStart } },
  })
}

export async function getGlobalUsageToday(todayStart = startOfTodayUTC()): Promise<number> {
  return db.aIUsage.count({
    where: { ...REAL_CALL_FILTER, createdAt: { gte: todayStart } },
  })
}

export async function getGlobalCostToday(todayStart = startOfTodayUTC()): Promise<number> {
  const result = await db.aIUsage.aggregate({
    where: { ...REAL_CALL_FILTER, createdAt: { gte: todayStart } },
    _sum: { estimatedCostEUR: true },
  })
  return result._sum.estimatedCostEUR ?? 0
}

export async function checkUserLimit(userId: string, todayStart = startOfTodayUTC()): Promise<LimitResult> {
  const limit = envInt('MAX_AI_GENERATIONS_PER_USER_DAY', 10)
  const current = await getUserUsageToday(userId, todayStart)
  return {
    allowed: current < limit,
    reason: current >= limit ? 'límite diario de usuario alcanzado' : undefined,
    current,
    limit,
  }
}

export async function checkWorkspaceLimit(workspaceId: string, todayStart = startOfTodayUTC()): Promise<LimitResult> {
  const limit = envInt('MAX_AI_GENERATIONS_PER_WORKSPACE_DAY', 20)
  const current = await getWorkspaceUsageToday(workspaceId, todayStart)
  return {
    allowed: current < limit,
    reason: current >= limit ? 'límite diario de workspace alcanzado' : undefined,
    current,
    limit,
  }
}

export async function checkGlobalLimit(todayStart = startOfTodayUTC()): Promise<LimitResult> {
  const limit = envInt('MAX_AI_GENERATIONS_GLOBAL_DAY', 50)
  const current = await getGlobalUsageToday(todayStart)
  return {
    allowed: current < limit,
    reason: current >= limit ? 'límite global diario alcanzado' : undefined,
    current,
    limit,
  }
}

export async function checkDailyCostLimit(todayStart = startOfTodayUTC()): Promise<LimitResult> {
  const limitEUR = envFloat('MAX_AI_ESTIMATED_COST_DAY_EUR', 2.0)
  const currentEUR = await getGlobalCostToday(todayStart)
  return {
    allowed: currentEUR < limitEUR,
    reason: currentEUR >= limitEUR ? 'límite de coste diario alcanzado' : undefined,
    current: currentEUR,
    limit: limitEUR,
  }
}

// ── Comprobaciones por plan de usuario ────────────────────────────────────────

export async function getUserMonthlyAIUsage(userId: string): Promise<number> {
  return db.aIUsage.count({
    where: { userId, ...REAL_CALL_FILTER, createdAt: { gte: startOfMonthUTC() } },
  })
}

export async function checkPlanLimits(userId: string, todayStart = startOfTodayUTC()): Promise<LimitResult | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { trialPlan: true, orgId: true },
  })

  // Comprobar si la org tiene suscripción activa/trial con plan del catálogo
  const subscription = user ? await db.subscription.findUnique({
    where: { orgId: user.orgId },
    select: { status: true, tier: true },
  }) : null

  const hasActiveBillingPlan = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING'

  if (hasActiveBillingPlan && user && subscription) {
    const planDef = PLAN_CATALOG[subscription.tier as PlanTier]
    const monthlyLimit = planDef?.limits.aiGenerationsPerMonth ?? 0

    if (Number.isFinite(monthlyLimit)) {
      const monthlyUsage = await getUserMonthlyAIUsage(userId)
      if (monthlyUsage >= monthlyLimit) {
        return {
          allowed: false,
          reason: `Límite mensual de tu plan ${planDef?.name ?? ''} alcanzado (${monthlyLimit}/mes).`,
          current: monthlyUsage,
          limit: monthlyLimit,
        }
      }
    }
    return null
  }

  // Sin suscripción activa — usar sistema de trialPlan heredado
  const trialPlan = user?.trialPlan ?? 'trial_personal'
  const limits = getPlanLimits(trialPlan)

  if (trialPlan === 'blocked' || limits.aiGenerationsPerDay === 0) {
    return {
      allowed: false,
      reason: 'Este dominio de correo no está permitido para la beta.',
      current: 0,
      limit: 0,
    }
  }

  const dailyUsage = await getUserUsageToday(userId, todayStart)
  if (dailyUsage >= limits.aiGenerationsPerDay) {
    return {
      allowed: false,
      reason: `Límite diario de tu plan alcanzado (${limits.aiGenerationsPerDay}/día).`,
      current: dailyUsage,
      limit: limits.aiGenerationsPerDay,
    }
  }

  const monthlyUsage = await getUserMonthlyAIUsage(userId)
  if (monthlyUsage >= limits.aiGenerationsPerMonth) {
    return {
      allowed: false,
      reason: `Límite mensual de tu plan alcanzado (${limits.aiGenerationsPerMonth}/mes).`,
      current: monthlyUsage,
      limit: limits.aiGenerationsPerMonth,
    }
  }

  return null
}

// Comprueba los límites de plan primero, luego los globales de infraestructura
export async function checkAllLimits(
  userId: string,
  workspaceId: string,
): Promise<LimitResult | null> {
  const todayStart = startOfTodayUTC()  // calculado una vez para todos los checks del request

  // Plan check tiene prioridad — es la restricción de negocio
  const planCheck = await checkPlanLimits(userId, todayStart)
  if (planCheck) return planCheck

  const [wsCheck, globalCheck, costCheck] = await Promise.all([
    checkWorkspaceLimit(workspaceId, todayStart),
    checkGlobalLimit(todayStart),
    checkDailyCostLimit(todayStart),
  ])
  return [wsCheck, globalCheck, costCheck].find((r) => !r.allowed) ?? null
}
