/**
 * Subscription Service (BILLING-001) — la máquina de estados de billing.
 * Toda mutación de Subscription pasa por aquí; nadie hace `db.subscription.update`
 * directamente fuera de este archivo. Esta es la regla de oro del sprint:
 * Stripe es un proveedor, esta máquina de estados es el corazón del sistema.
 *
 * Transiciones válidas:
 *   TRIALING  → ACTIVE     (checkout completado)
 *   TRIALING  → EXPIRED    (trial termina sin pago)
 *   ACTIVE    → PAST_DUE   (fallo de cobro)
 *   PAST_DUE  → ACTIVE     (cobro recuperado)
 *   PAST_DUE  → CANCELLED  (Stripe agota reintentos)
 *   ACTIVE    → CANCELLED  (cliente cancela, fin de periodo)
 *   CANCELLED → ACTIVE     (vuelve meses después, nuevo checkout)
 *   *         → BLOCKED    (solo manual, nunca desde un webhook de Stripe)
 */

import { db } from '@/lib/db'
import type { Subscription, SubscriptionStatus, PlanTier, BillingInterval } from '@prisma/client'
import { logBillingEvent } from './billing-events'

const TRIAL_LENGTH_DAYS = 15 // alineado con la oferta beta de CUSTOMER-001

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/** Obtiene la Subscription de una org, o la crea en TRIALING si no existe todavía. */
export async function getOrCreateSubscription(orgId: string): Promise<Subscription> {
  const existing = await db.subscription.findUnique({ where: { orgId } })
  if (existing) return existing

  const trialEndsAt = addDays(new Date(), TRIAL_LENGTH_DAYS)
  const sub = await db.subscription.create({
    data: {
      orgId,
      tier:   'STARTER',
      status: 'TRIALING',
      trialEndsAt,
    },
  })
  await logBillingEvent({
    subscriptionId: sub.id,
    orgId,
    type: 'trial_started',
    toTier: sub.tier,
    toStatus: sub.status,
    metadata: { trialEndsAt: trialEndsAt.toISOString() },
  })
  return sub
}

/**
 * Calcula el estado *efectivo* de una suscripción en este instante.
 * Una Subscription en TRIALING cuyo trialEndsAt ya pasó se comporta como
 * EXPIRED aunque el webhook de Stripe (o el cron que lo detecte) todavía
 * no haya corrido — evita una ventana de "trial fantasma" gratis.
 */
export function computeEffectiveStatus(sub: Subscription): SubscriptionStatus {
  if (sub.status === 'TRIALING' && sub.trialEndsAt && sub.trialEndsAt.getTime() < Date.now()) {
    return 'EXPIRED'
  }
  return sub.status
}

/** Activa una suscripción tras un checkout de Stripe completado con éxito. */
export async function activateSubscription(params: {
  orgId: string
  tier: PlanTier
  interval: BillingInterval
  stripeCustomerId: string
  stripeSubscriptionId: string
  stripePriceId: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd?: boolean
  stripeEventId?: string
}): Promise<Subscription> {
  const existing = await getOrCreateSubscription(params.orgId)

  // Comprobar duplicado ANTES de mutar la DB — evita revertir estado por reenvío de Stripe
  if (params.stripeEventId) {
    const alreadyProcessed = await db.billingEvent.findFirst({
      where: { stripeEventId: params.stripeEventId },
      select: { id: true },
    })
    if (alreadyProcessed) return existing
  }

  const cancelScheduled = params.cancelAtPeriodEnd ?? false

  const updated = await db.subscription.update({
    where: { orgId: params.orgId },
    data: {
      tier: params.tier,
      status: 'ACTIVE',
      interval: params.interval,
      stripeCustomerId: params.stripeCustomerId,
      stripeSubscriptionId: params.stripeSubscriptionId,
      stripePriceId: params.stripePriceId,
      currentPeriodStart: params.currentPeriodStart,
      currentPeriodEnd: params.currentPeriodEnd,
      cancelAtPeriodEnd: cancelScheduled,
      // Preservar cancelledAt si la cancelación sigue programada; limpiar en nuevo alta
      ...(!cancelScheduled ? { cancelledAt: null } : {}),
    },
  })

  await logBillingEvent({
    subscriptionId: updated.id,
    orgId: params.orgId,
    type: 'activated',
    fromTier: existing.tier,
    toTier: updated.tier,
    fromStatus: existing.status,
    toStatus: updated.status,
    stripeEventId: params.stripeEventId,
  })

  return updated
}

/** Cambia de plan (upgrade o downgrade) una suscripción ya activa. */
export async function changePlanTier(params: {
  orgId: string
  newTier: PlanTier
  newPriceId: string
  stripeEventId?: string
}): Promise<Subscription> {
  const existing = await getOrCreateSubscription(params.orgId)

  const updated = await db.subscription.update({
    where: { orgId: params.orgId },
    data: { tier: params.newTier, stripePriceId: params.newPriceId },
  })

  const isProcessed = await logBillingEvent({
    subscriptionId: updated.id,
    orgId: params.orgId,
    type: 'plan_changed',
    fromTier: existing.tier,
    toTier: updated.tier,
    fromStatus: existing.status,
    toStatus: updated.status,
    stripeEventId: params.stripeEventId,
  })
  if (!isProcessed) return existing

  return updated
}

/** Marca un cobro fallido — entra en periodo de gracia (PAST_DUE). */
export async function markPastDue(orgId: string, stripeEventId?: string): Promise<Subscription> {
  const existing = await getOrCreateSubscription(orgId)
  if (existing.status !== 'ACTIVE') return existing // solo ACTIVE puede pasar a PAST_DUE

  const updated = await db.subscription.update({
    where: { orgId },
    data: { status: 'PAST_DUE' },
  })

  await logBillingEvent({
    subscriptionId: updated.id, orgId, type: 'payment_failed',
    fromStatus: existing.status, toStatus: updated.status, stripeEventId,
  })
  return updated
}

/** Recupera un cobro tras PAST_DUE — vuelve a ACTIVE. */
export async function recoverPastDue(orgId: string, stripeEventId?: string): Promise<Subscription> {
  const existing = await getOrCreateSubscription(orgId)
  if (existing.status !== 'PAST_DUE') return existing

  const updated = await db.subscription.update({
    where: { orgId },
    data: { status: 'ACTIVE' },
  })

  await logBillingEvent({
    subscriptionId: updated.id, orgId, type: 'payment_succeeded',
    fromStatus: existing.status, toStatus: updated.status, stripeEventId,
  })
  return updated
}

/** El cliente pide cancelar — sigue ACTIVE hasta el final del periodo ya pagado. */
export async function scheduleCancellation(orgId: string, stripeEventId?: string): Promise<Subscription> {
  const existing = await getOrCreateSubscription(orgId)

  const updated = await db.subscription.update({
    where: { orgId },
    data: { cancelAtPeriodEnd: true },
  })

  await logBillingEvent({
    subscriptionId: updated.id, orgId, type: 'cancel_scheduled',
    fromStatus: existing.status, toStatus: updated.status, stripeEventId,
  })
  return updated
}

/** Stripe confirma que la suscripción ha terminado de verdad (fin de periodo o impago agotado). */
export async function finalizeCancellation(orgId: string, stripeEventId?: string): Promise<Subscription> {
  const existing = await getOrCreateSubscription(orgId)

  const updated = await db.subscription.update({
    where: { orgId },
    data: { status: 'CANCELLED', cancelAtPeriodEnd: false, cancelledAt: new Date() },
  })

  await logBillingEvent({
    subscriptionId: updated.id, orgId, type: 'cancelled',
    fromStatus: existing.status, toStatus: updated.status, stripeEventId,
  })
  return updated
}

/** El trial termina sin que el cliente haya pagado. */
export async function expireTrial(orgId: string): Promise<Subscription> {
  const existing = await getOrCreateSubscription(orgId)
  if (existing.status !== 'TRIALING') return existing

  const updated = await db.subscription.update({
    where: { orgId },
    data: { status: 'EXPIRED' },
  })

  await logBillingEvent({
    subscriptionId: updated.id, orgId, type: 'trial_expired',
    fromStatus: existing.status, toStatus: updated.status,
  })
  return updated
}

/** El cliente deshace una cancelación programada antes de que termine el periodo. */
export async function undoScheduledCancellation(orgId: string, stripeEventId?: string): Promise<Subscription> {
  const existing = await getOrCreateSubscription(orgId)
  if (!existing.cancelAtPeriodEnd) return existing

  const updated = await db.subscription.update({
    where: { orgId },
    data: { cancelAtPeriodEnd: false, cancelledAt: null },
  })

  await logBillingEvent({
    subscriptionId: updated.id, orgId, type: 'cancel_undone',
    fromStatus: existing.status, toStatus: updated.status, stripeEventId,
  })
  return updated
}

/** Una org cancelada o expirada vuelve a pagar — nuevo checkout, nueva activación. */
export async function reactivate(params: {
  orgId: string
  tier: PlanTier
  interval: BillingInterval
  stripeCustomerId: string
  stripeSubscriptionId: string
  stripePriceId: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  stripeEventId?: string
}): Promise<Subscription> {
  // La reactivación es, en términos de la máquina de estados, una activación —
  // el historial queda igualmente registrado vía logBillingEvent con type 'activated'
  // sobre un fromStatus CANCELLED/EXPIRED, que es lo que distingue una reactivación
  // de un alta nueva al consultar BillingEvent.
  return activateSubscription(params)
}

/** Bloqueo manual — abuso o fraude. No es alcanzable desde ningún webhook de Stripe. */
export async function blockSubscription(orgId: string, reason: string): Promise<Subscription> {
  const existing = await getOrCreateSubscription(orgId)

  const updated = await db.subscription.update({
    where: { orgId },
    data: { status: 'BLOCKED' },
  })

  await logBillingEvent({
    subscriptionId: updated.id, orgId, type: 'blocked',
    fromStatus: existing.status, toStatus: updated.status,
    metadata: { reason },
  })
  return updated
}
