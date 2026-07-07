/**
 * POST /api/billing/reactivate — deshace una cancelación programada antes de
 * que termine el periodo. Solo aplicable cuando cancelAtPeriodEnd = true.
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateSubscription, undoScheduledCancellation } from '@/lib/billing/subscription-service'
import { reactivateSubscription } from '@/lib/billing/stripe-provider'

export const runtime = 'nodejs'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { orgId: true } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const sub = await getOrCreateSubscription(user.orgId)

  if (!sub.cancelAtPeriodEnd) {
    return NextResponse.json(
      { error: 'Esta suscripción no tiene una cancelación programada.' },
      { status: 400 },
    )
  }
  if (!sub.stripeSubscriptionId) {
    return NextResponse.json(
      { error: 'No hay suscripción de Stripe asociada.' },
      { status: 400 },
    )
  }

  await reactivateSubscription(sub.stripeSubscriptionId)
  const updated = await undoScheduledCancellation(user.orgId)

  return NextResponse.json({
    ok: true,
    cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
    currentPeriodEnd: updated.currentPeriodEnd,
    message: 'Cancelación revertida. Tu suscripción seguirá activa.',
  })
}
