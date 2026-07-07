/**
 * Billing Events (BILLING-001, Fase 8) — registro append-only de toda
 * transición de billing. stripeEventId garantiza idempotencia: un mismo
 * webhook de Stripe nunca se aplica dos veces aunque Stripe lo reenvíe.
 */

import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export interface LogBillingEventInput {
  subscriptionId: string
  orgId:          string
  type:           string
  fromTier?:      string | null
  toTier?:        string | null
  fromStatus?:    string | null
  toStatus?:      string | null
  stripeEventId?: string | null
  metadata?:      Record<string, unknown> | null
}

/**
 * Devuelve `true` si el evento se registró, `false` si ya existía
 * (mismo stripeEventId) — el llamador debe tratar `false` como "ya procesado".
 */
export async function logBillingEvent(input: LogBillingEventInput): Promise<boolean> {
  try {
    await db.billingEvent.create({
      data: {
        subscriptionId: input.subscriptionId,
        orgId:          input.orgId,
        type:           input.type,
        fromTier:       input.fromTier ?? null,
        toTier:         input.toTier ?? null,
        fromStatus:     input.fromStatus ?? null,
        toStatus:       input.toStatus ?? null,
        stripeEventId:  input.stripeEventId ?? null,
        metadata:       (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    })
    return true
  } catch (err) {
    // Violación de unique en stripeEventId = webhook duplicado, no es un error real
    if (isUniqueConstraintError(err)) return false
    throw err
  }
}

function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'P2002'
}

export async function getBillingHistory(orgId: string, limit = 50) {
  return db.billingEvent.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
