/**
 * Entitlements (BILLING-001, Fase 5) — la única función que cualquier parte
 * de la aplicación debe llamar para saber "¿puede esta organización hacer X?".
 * Nunca repartir `if (plan === ...)` por la aplicación: todo pasa por aquí.
 *
 * Compatibilidad: si una organización todavía no tiene una Subscription real
 * con Stripe (no ha hecho checkout nunca), sus límites se derivan del
 * heurístico de trial por email ya existente (lib/plan-limits.ts) — el
 * sistema nuevo envuelve al antiguo, no lo sustituye de golpe.
 */

import { db } from '@/lib/db'
import type { PlanTier, SubscriptionStatus } from '@prisma/client'
import { getOrCreateSubscription, computeEffectiveStatus } from './subscription-service'
import { getPlanDefinition, type PlanLimits, type PlanFeatures } from './plan-catalog'
import { getPlanLimits as getTrialLimits } from '@/lib/plan-limits'

export interface Entitlements {
  tier:     PlanTier
  status:   SubscriptionStatus
  isTrial:  boolean
  blocked:  boolean // true si status implica "no dejar hacer nada de pago"
  limits:   PlanLimits
  features: PlanFeatures
}

const ZERO_LIMITS: PlanLimits = {
  maxUsers: 0, maxWorkspaces: 0, maxActiveMissions: 0,
  aiGenerationsPerMonth: 0, maxToolsInstalled: 0,
  brainQueriesPerMonth: 0,
}
const NO_FEATURES: PlanFeatures = {
  aiRecommendations: false, prioritySupport: false, customBranding: false,
}

const BLOCKING_STATUSES: SubscriptionStatus[] = ['EXPIRED', 'CANCELLED', 'BLOCKED']

export async function getEntitlements(orgId: string): Promise<Entitlements> {
  const sub = await getOrCreateSubscription(orgId)
  const status = computeEffectiveStatus(sub)
  const blocked = BLOCKING_STATUSES.includes(status)

  if (blocked) {
    return { tier: sub.tier, status, isTrial: false, blocked: true, limits: ZERO_LIMITS, features: NO_FEATURES }
  }

  // TRIALING sin Stripe todavía: usa el heurístico de trial existente (compatibilidad)
  if (status === 'TRIALING' && !sub.stripeSubscriptionId) {
    const user = await db.user.findFirst({ where: { orgId }, select: { trialPlan: true } })
    const trialLimits = getTrialLimits(user?.trialPlan ?? 'trial_personal')
    return {
      tier: sub.tier,
      status,
      isTrial: true,
      blocked: false,
      limits: {
        maxUsers: 5, // sin restricción específica en el heurístico legacy — valor conservador
        maxWorkspaces: 1,
        maxActiveMissions: trialLimits.maxToolsInstalled, // aproximación razonable en trial
        aiGenerationsPerMonth: trialLimits.aiGenerationsPerMonth,
        maxToolsInstalled: trialLimits.maxToolsInstalled,
        brainQueriesPerMonth: 5,
      },
      features: { aiRecommendations: true, prioritySupport: false, customBranding: false },
    }
  }

  // PAST_DUE: se mantienen los límites del plan (periodo de gracia), no se castiga todavía
  const plan = getPlanDefinition(sub.tier)
  return {
    tier: sub.tier,
    status,
    isTrial: status === 'TRIALING',
    blocked: false,
    limits: plan.limits,
    features: plan.features,
  }
}

export interface EntitlementCheck {
  allowed: boolean
  reason?: string
  current: number
  limit: number
}

type LimitedResource = keyof PlanLimits

const RESOURCE_LABELS: Record<LimitedResource, string> = {
  maxUsers: 'usuarios',
  maxWorkspaces: 'workspaces',
  maxActiveMissions: 'misiones activas',
  aiGenerationsPerMonth: 'generaciones de IA este mes',
  maxToolsInstalled: 'herramientas instaladas',
  brainQueriesPerMonth: 'consultas Brain este mes',
}

/** Comprueba si una organización puede tener `currentCount + 1` unidades de un recurso. */
export async function checkEntitlement(
  orgId: string,
  resource: LimitedResource,
  currentCount: number,
): Promise<EntitlementCheck> {
  const ent = await getEntitlements(orgId)
  const limit = ent.limits[resource]

  if (ent.blocked) {
    return { allowed: false, reason: 'Suscripción inactiva. Reactiva tu plan para continuar.', current: currentCount, limit: 0 }
  }

  if (currentCount >= limit) {
    return {
      allowed: false,
      reason: `Límite de tu plan alcanzado (${RESOURCE_LABELS[resource]}: ${limit}). Mejora tu plan para ampliarlo.`,
      current: currentCount,
      limit,
    }
  }

  return { allowed: true, current: currentCount, limit }
}

/** Compara el uso actual de una organización contra los límites de un tier candidato. */
export async function getDowngradeBlockers(orgId: string, targetTier: PlanTier): Promise<string[]> {
  const targetLimits = getPlanDefinition(targetTier).limits
  const blockers: string[] = []

  const [userCount, workspaceCount, activeMissionCount, toolCount] = await Promise.all([
    db.user.count({ where: { orgId } }),
    db.workspace.count({ where: { orgId } }),
    db.companyObjective.count({ where: { workspace: { orgId }, status: 'active' } }),
    db.toolInstance.count({ where: { workspace: { orgId }, status: 'ACTIVE' } }),
  ])

  if (userCount > targetLimits.maxUsers) {
    blockers.push(`Tienes ${userCount} usuarios; el plan ${targetTier} permite ${targetLimits.maxUsers}.`)
  }
  if (workspaceCount > targetLimits.maxWorkspaces) {
    blockers.push(`Tienes ${workspaceCount} workspaces; el plan ${targetTier} permite ${targetLimits.maxWorkspaces}.`)
  }
  if (activeMissionCount > targetLimits.maxActiveMissions) {
    blockers.push(`Tienes ${activeMissionCount} misiones activas; el plan ${targetTier} permite ${targetLimits.maxActiveMissions}.`)
  }
  if (toolCount > targetLimits.maxToolsInstalled) {
    blockers.push(`Tienes ${toolCount} herramientas instaladas; el plan ${targetTier} permite ${targetLimits.maxToolsInstalled}.`)
  }

  return blockers
}
