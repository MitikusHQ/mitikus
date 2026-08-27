/**
 * POST /api/billing/storage-addon — añade GB extra de almacenamiento a la
 * suscripción existente vía Stripe (€2/GB/mes).
 * Requiere STRIPE_STORAGE_ADDON_PRICE_ID en el entorno.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateSubscription } from '@/lib/billing/subscription-service'
import { createStripeCustomer, createStorageAddonCheckout } from '@/lib/billing/stripe-provider'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  let body: { gb?: number; workspaceId?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const gb = Number(body.gb ?? 0)
  if (!gb || gb < 1 || gb > 1000 || !Number.isInteger(gb)) {
    return NextResponse.json({ error: 'gb debe ser un entero entre 1 y 1000.' }, { status: 400 })
  }

  if (!process.env.STRIPE_STORAGE_ADDON_PRICE_ID) {
    return NextResponse.json({ error: 'El add-on de almacenamiento no está disponible todavía.' }, { status: 503 })
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { orgId: true, email: true, name: true },
  })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

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
  const workspaceId = body.workspaceId ?? ''
  const filesUrl = workspaceId
    ? `${origin}/workspace/${workspaceId}/office/files?storage=success`
    : `${origin}/org?storage=success`

  const { url } = await createStorageAddonCheckout({
    orgId: user.orgId,
    stripeCustomerId,
    stripeSubscriptionId: sub.stripeSubscriptionId ?? null,
    gb,
    successUrl: filesUrl,
    cancelUrl: filesUrl.replace('storage=success', 'storage=cancelled'),
  })

  return NextResponse.json({ url })
}
