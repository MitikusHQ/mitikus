/**
 * POST /api/billing/cancel — cancela la suscripción al final del periodo
 * ya pagado (nunca corta el acceso de inmediato). La cancelación definitiva
 * llega después vía el webhook customer.subscription.deleted.
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateSubscription, scheduleCancellation } from '@/lib/billing/subscription-service'
import { cancelSubscriptionAtPeriodEnd } from '@/lib/billing/stripe-provider'

export const runtime = 'nodejs'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { orgId: true } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const sub = await getOrCreateSubscription(user.orgId)
  if (!sub.stripeSubscriptionId) {
    return NextResponse.json({ error: 'Esta organización no tiene una suscripción de pago activa.' }, { status: 400 })
  }

  await cancelSubscriptionAtPeriodEnd(sub.stripeSubscriptionId)
  const updated = await scheduleCancellation(user.orgId)

  return NextResponse.json({
    ok: true,
    cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
    currentPeriodEnd: updated.currentPeriodEnd,
    message: 'Tu suscripción seguirá activa hasta el final del periodo ya pagado.',
  })
}
