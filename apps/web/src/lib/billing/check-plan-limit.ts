import { db } from '@/lib/db'
import { PLAN_CATALOG } from '@/lib/billing/plan-catalog'
import type { PlanLimits } from '@/lib/billing/plan-catalog'
import type { PlanTier } from '@prisma/client'

type LimitResult =
  | { allowed: true }
  | { allowed: false; limit: number; current: number; message: string }

const LIMIT_LABELS: Record<keyof PlanLimits, string> = {
  maxUsers: 'miembros',
  maxWorkspaces: 'workspaces',
  maxActiveMissions: 'misiones activas',
  aiGenerationsPerMonth: 'generaciones IA este mes',
  maxToolsInstalled: 'herramientas instaladas',
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
      return db.companyObjective.count({ where: { profile: { workspace: { orgId } }, status: 'active' } })
    case 'aiGenerationsPerMonth': {
      const start = new Date()
      start.setUTCDate(1)
      start.setUTCHours(0, 0, 0, 0)
      return db.toolExecution.count({ where: { workspace: { orgId }, createdAt: { gte: start } } })
    }
  }
}

/**
 * Comprueba si la org puede crear un recurso más del tipo indicado.
 * Infinity en el límite siempre devuelve allowed: true.
 *
 * @param orgId      ID de la organización
 * @param limitKey   Campo de PlanLimits a comprobar
 * @param workspaceId  Requerido solo para maxToolsInstalled
 */
export async function checkPlanLimit(
  orgId: string,
  limitKey: keyof PlanLimits,
  workspaceId?: string,
): Promise<LimitResult> {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { plan: true },
  })
  if (!org) return { allowed: false, limit: 0, current: 0, message: 'Organización no encontrada.' }

  const plan = org.plan as PlanTier
  const limit = PLAN_CATALOG[plan]?.limits[limitKey] ?? 0

  if (!Number.isFinite(limit)) return { allowed: true }

  const current = await countCurrent(orgId, limitKey, workspaceId)
  if (current < limit) return { allowed: true }

  const planName = PLAN_CATALOG[plan]?.name ?? plan
  const label = LIMIT_LABELS[limitKey]
  return {
    allowed: false,
    limit,
    current,
    message: `Has alcanzado el límite de ${label} de tu plan ${planName} (${limit}). Actualiza tu plan para continuar.`,
  }
}
