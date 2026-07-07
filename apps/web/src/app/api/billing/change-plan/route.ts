/**
 * POST /api/billing/change-plan — upgrade o downgrade de una suscripción
 * ya activa en Stripe. Stripe es la fuente de verdad: este endpoint pide
 * el cambio de precio a Stripe y el estado real se aplica cuando llega el
 * webhook customer.subscription.updated (evita doble escritura/condiciones
 * de carrera entre la API y el webhook).
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateSubscription } from '@/lib/billing/subscription-service'
import { getDowngradeBlockers } from '@/lib/billing/entitlements'
import { getStripePriceId, isUpgrade, PLAN_CATALOG } from '@/lib/billing/plan-catalog'
import { changeSubscriptionPrice } from '@/lib/billing/stripe-provider'
import type { PlanTier } from '@prisma/client'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  let body: { tier?: PlanTier }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const newTier = body.tier
  if (!newTier || !(newTier in PLAN_CATALOG) || newTier === 'ENTERPRISE') {
    return NextResponse.json({ error: 'Plan inválido. Usa STARTER, PROFESSIONAL o BUSINESS.' }, { status: 400 })
  }

  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { orgId: true } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const sub = await getOrCreateSubscription(user.orgId)
  if (!sub.stripeSubscriptionId) {
    return NextResponse.json(
      { error: 'Esta organización todavía no tiene una suscripción activa. Usa /api/billing/checkout primero.' },
      { status: 400 },
    )
  }

  if (newTier === sub.tier) {
    return NextResponse.json({ error: 'Ya estás en ese plan.' }, { status: 400 })
  }

  if (!isUpgrade(sub.tier, newTier)) {
    const blockers = await getDowngradeBlockers(user.orgId, newTier)
    if (blockers.length > 0) {
      return NextResponse.json({ error: 'No puedes bajar a ese plan todavía.', blockers }, { status: 409 })
    }
  }

  const newPriceId = getStripePriceId(newTier)
  if (!newPriceId) {
    return NextResponse.json({ error: `No hay un Stripe Price ID configurado para el plan ${newTier}.` }, { status: 500 })
  }

  await changeSubscriptionPrice({ stripeSubscriptionId: sub.stripeSubscriptionId, newPriceId })

  return NextResponse.json({
    ok: true,
    message: 'Cambio de plan solicitado. Se aplicará en cuanto Stripe confirme el pago/prorrateo.',
  })
}
