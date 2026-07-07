/**
 * POST /api/billing/portal — crea una sesión del Customer Portal de Stripe
 * para que la organización gestione su plan, método de pago o cancele.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateSubscription } from '@/lib/billing/subscription-service'
import { createPortalSession } from '@/lib/billing/stripe-provider'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { orgId: true } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const sub = await getOrCreateSubscription(user.orgId)
  if (!sub.stripeCustomerId) {
    return NextResponse.json({ error: 'Esta organización todavía no tiene una suscripción de pago.' }, { status: 400 })
  }

  const origin = req.nextUrl.origin
  const { url } = await createPortalSession({
    stripeCustomerId: sub.stripeCustomerId,
    returnUrl: `${origin}/org`,
  })

  return NextResponse.json({ url })
}
