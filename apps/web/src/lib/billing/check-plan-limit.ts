import { db } from '@/lib/db'
import { getEntitlements } from '@/lib/billing/entitlements'
import type { PlanLimits } from '@/lib/billing/plan-catalog'

type LimitResult =
  | { allowed: true }
  | { allowed: false; limit: number; current: number; message: string }

const LIMIT_LABELS: Record<keyof PlanLimits, string> = {
  maxUsers: 'miembros',
  maxWorkspaces: 'workspaces',
  maxActiveMissions: 'misiones activas',
  aiGenerationsPerMonth: 'generaciones IA este mes',
  maxToolsInstalled: 'herramientas instaladas',
  brainQueriesPerMonth: 'consultas Brain este mes',
}

async function countCurrent(
  orgId: string,
  limitKey: keyof PlanLimits,
  workspaceId?: string,
): Promise<number> {
  switch (limitKey) {
    case 'maxUsers': {
      const [activeUsers, pendingInvites] = await Promise.all([
        db.user.count({ where: { orgId } }),
        db.orgInvitation.count({
          where: { orgId, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
        }),
      ])
      return activeUsers + pendingInvites
    }
    case 'maxWorkspaces':
      return db.workspace.count({ where: { orgId } })
    case 'maxToolsInstalled':
      if (!workspaceId) throw new Error('workspaceId requerido para maxToolsInstalled')
      return db.toolInstance.count({ where: { workspaceId, status: 'ACTIVE' } })
    case 'maxActiveMissions':
      return db.companyObjective.count({ where: { workspace: { orgId }, status: 'active' } })
    case 'aiGenerationsPerMonth': {
      const start = new Date()
      start.setUTCDate(1)
      start.setUTCHours(0, 0, 0, 0)
      return db.toolExecution.count({ where: { workspace: { orgId }, createdAt: { gte: start } } })
    }
    case 'brainQueriesPerMonth': {
      const start = new Date()
      start.setUTCDate(1)
      start.setUTCHours(0, 0, 0, 0)
      return db.brainQuery.count({ where: { orgId, createdAt: { gte: start } } })
    }
  }
}

/**
 * Comprueba si la org puede usar un recurso más del tipo indicado.
 * Lee el plan real desde Subscription.tier via getEntitlements.
 */
export async function checkPlanLimit(
  orgId: string,
  limitKey: keyof PlanLimits,
  workspaceId?: string,
): Promise<LimitResult> {
  const ent = await getEntitlements(orgId)

  if (ent.blocked) {
    return {
      allowed: false,
      limit: 0,
      current: 0,
      message: 'Suscripción inactiva. Reactiva tu plan para continuar.',
    }
  }

  const limit = ent.limits[limitKey]

  if (limit >= Number.MAX_SAFE_INTEGER) return { allowed: true }

  const current = await countCurrent(orgId, limitKey, workspaceId)
  if (current < limit) return { allowed: true }

  const label = LIMIT_LABELS[limitKey]
  return {
    allowed: false,
    limit,
    current,
    message: `Has alcanzado el límite de ${label} de tu plan (${limit}). Actualiza tu plan para continuar.`,
  }
}
