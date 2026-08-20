import { db } from '@/lib/db'
import { getEntitlements } from '@/lib/billing/entitlements'
import type { PlanLimits } from '@/lib/billing/plan-catalog'
import type { Prisma } from '@prisma/client'

type LimitResult =
  | { allowed: true }
  | { allowed: false; limit: number; current: number; message: string }

type TxClient = Prisma.TransactionClient

const LIMIT_LABELS: Record<keyof PlanLimits, string> = {
  maxUsers: 'miembros',
  maxWorkspaces: 'workspaces',
  maxActiveMissions: 'misiones activas',
  aiGenerationsPerMonth: 'generaciones IA este mes',
  maxToolsInstalled: 'herramientas instaladas',
  brainQueriesPerMonth: 'consultas Brain este mes',
}

// djb2 hash → signed 32-bit int (PostgreSQL pg_advisory_xact_lock expects int4)
function hash32(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h * 33) ^ s.charCodeAt(i)) >>> 0
  }
  return h | 0
}

// Namespace fijo para locks de límites de plan (evita colisiones con otros advisory locks)
const PLAN_LIMIT_LOCK_NS = 0x4d49544b // "MITK" en hex

async function countCurrent(
  tx: TxClient,
  orgId: string,
  limitKey: keyof PlanLimits,
  workspaceId?: string,
): Promise<number> {
  switch (limitKey) {
    case 'maxUsers': {
      const [activeUsers, pendingInvites] = await Promise.all([
        tx.user.count({ where: { orgId } }),
        tx.orgInvitation.count({
          where: { orgId, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
        }),
      ])
      return activeUsers + pendingInvites
    }
    case 'maxWorkspaces':
      return tx.workspace.count({ where: { orgId } })
    case 'maxToolsInstalled':
      if (!workspaceId) throw new Error('workspaceId requerido para maxToolsInstalled')
      return tx.toolInstance.count({ where: { workspaceId, status: 'ACTIVE' } })
    case 'maxActiveMissions':
      return tx.companyObjective.count({ where: { workspace: { orgId }, status: 'active' } })
    case 'aiGenerationsPerMonth': {
      const start = new Date()
      start.setUTCDate(1)
      start.setUTCHours(0, 0, 0, 0)
      return tx.toolExecution.count({ where: { workspace: { orgId }, createdAt: { gte: start } } })
    }
    case 'brainQueriesPerMonth': {
      const start = new Date()
      start.setUTCDate(1)
      start.setUTCHours(0, 0, 0, 0)
      return tx.brainQuery.count({ where: { orgId, createdAt: { gte: start } } })
    }
  }
}

/**
 * Comprueba si la org puede usar un recurso más del tipo indicado.
 * Lee el plan real desde Subscription.tier via getEntitlements.
 * Usa un advisory lock de PostgreSQL para serializar comprobaciones
 * concurrentes del mismo (orgId, limitKey) y evitar race conditions.
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

  // Ilimitado — no necesitamos bloqueo ni contar
  if (limit >= Number.MAX_SAFE_INTEGER) return { allowed: true }

  const lockObj = hash32(`${orgId}:${limitKey}`)

  return db.$transaction(async (tx) => {
    // Advisory lock transaccional: se libera automáticamente al finalizar la transacción.
    // Serializa comprobaciones concurrentes del mismo límite para esta org.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(${PLAN_LIMIT_LOCK_NS}::int4, ${lockObj}::int4)`

    const current = await countCurrent(tx, orgId, limitKey, workspaceId)
    if (current < limit) return { allowed: true } as LimitResult

    const label = LIMIT_LABELS[limitKey]
    return {
      allowed: false,
      limit,
      current,
      message: `Has alcanzado el límite de ${label} de tu plan (${limit}). Actualiza tu plan para continuar.`,
    } as LimitResult
  })
}
