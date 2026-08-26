/**
 * POST /api/billing/portal
 *
 * Crea una sesión del Stripe Billing Portal y devuelve la URL.
 * El usuario es redirigido allí para gestionar su suscripción
 * (cambiar plan, cancelar, actualizar tarjeta, ver facturas Stripe).
 *
 * Requiere que la org tenga ya un stripeCustomerId (es decir, que haya
 * completado al menos un checkout de Stripe). Si no lo tiene, devuelve 409.
 */

import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { createBillingPortalSession } from '@/lib/billing/stripe-provider'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const user = await requireUser()

  const sub = await db.subscription.findUnique({
    where: { orgId: user.orgId },
    select: { stripeCustomerId: true },
  })

  if (!sub?.stripeCustomerId) {
    return NextResponse.json(
      { error: 'No hay suscripción activa de Stripe. Activa un plan primero.' },
      { status: 409 },
    )
  }

  const body = await req.json().catch(() => ({})) as { returnUrl?: string }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mitikus.com'
  const returnUrl = body.returnUrl ?? `${baseUrl}/settings`

  const { url } = await createBillingPortalSession({
    stripeCustomerId: sub.stripeCustomerId,
    returnUrl,
  })

  return NextResponse.json({ url })
}
