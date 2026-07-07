/**
 * POST /api/billing/checkout — crea una sesión de Stripe Checkout para que
 * la organización del usuario contrate un plan (Starter/Professional/Business).
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateSubscription } from '@/lib/billing/subscription-service'
import { getStripePriceId, PLAN_CATALOG } from '@/lib/billing/plan-catalog'
import { createStripeCustomer, createCheckoutSession } from '@/lib/billing/stripe-provider'
import type { PlanTier } from '@prisma/client'
import { trackEvent } from '@/lib/product-analytics'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  let body: { tier?: PlanTier }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const tier = body.tier
  if (!tier || !(tier in PLAN_CATALOG) || tier === 'ENTERPRISE') {
    return NextResponse.json({ error: 'Plan inválido. Usa STARTER, PROFESSIONAL o BUSINESS.' }, { status: 400 })
  }

  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { orgId: true, email: true, name: true } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const priceId = getStripePriceId(tier)
  if (!priceId) {
    return NextResponse.json({ error: `No hay un Stripe Price ID configurado para el plan ${tier}.` }, { status: 500 })
  }

  const sub = await getOrCreateSubscription(user.orgId)

  let stripeCustomerId = sub.stripeCustomerId
  if (!stripeCustomerId) {
    stripeCustomerId = await createStripeCustomer({
      orgId: user.orgId,
      email: user.email,
      name: user.name ?? user.email,
    })
    await db.subscription.update({ where: { orgId: user.orgId }, data: { stripeCustomerId } })
  }

  const origin = req.nextUrl.origin
  const { url } = await createCheckoutSession({
    orgId: user.orgId,
    stripeCustomerId,
    customerEmail: user.email,
    priceId,
    successUrl: `${origin}/org?checkout=success`,
    cancelUrl: `${origin}/org?checkout=cancelled`,
  })

  // DATA-001 — registrar intención de pago (checkout iniciado)
  trackEvent({
    orgId:      user.orgId,
    event:      'billing.checkout.initiated',
    source:     'web',
    properties: { tier },
  })

  return NextResponse.json({ url })
}
