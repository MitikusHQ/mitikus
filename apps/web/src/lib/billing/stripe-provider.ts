/**
 * Stripe Provider (BILLING-001, regla de oro) — el ÚNICO archivo de toda la
 * aplicación que importa el SDK de Stripe. Si mañana cambiamos de proveedor
 * de pagos, este es el único archivo que habría que reescribir: ningún otro
 * módulo conoce la forma de los objetos de Stripe.
 */

import Stripe from 'stripe'

let _stripe: Stripe | null = null

/** Cliente de Stripe perezoso — evita fallar en build/import si la key no está puesta todavía. */
function getStripeClient(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY no está configurada. Añádela a tu .env.local.')
  }
  _stripe = new Stripe(key)
  return _stripe
}

export async function createStripeCustomer(params: {
  orgId: string
  email: string
  name: string
}): Promise<string> {
  const stripe = getStripeClient()
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: { protoolsOrgId: params.orgId },
  })
  return customer.id
}

export async function createCheckoutSession(params: {
  orgId: string
  stripeCustomerId: string | null
  customerEmail: string
  priceId: string
  successUrl: string
  cancelUrl: string
}): Promise<{ url: string }> {
  const stripe = getStripeClient()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    ...(params.stripeCustomerId
      ? { customer: params.stripeCustomerId }
      : { customer_email: params.customerEmail }),
    client_reference_id: params.orgId,
    subscription_data: { metadata: { protoolsOrgId: params.orgId } },
    metadata: { protoolsOrgId: params.orgId },
  })

  if (!session.url) throw new Error('Stripe no devolvió una URL de checkout.')
  return { url: session.url }
}

export async function createPortalSession(params: {
  stripeCustomerId: string
  returnUrl: string
}): Promise<{ url: string }> {
  const stripe = getStripeClient()
  const session = await stripe.billingPortal.sessions.create({
    customer: params.stripeCustomerId,
    return_url: params.returnUrl,
  })
  return { url: session.url }
}

export async function changeSubscriptionPrice(params: {
  stripeSubscriptionId: string
  newPriceId: string
}): Promise<void> {
  const stripe = getStripeClient()
  const sub = await stripe.subscriptions.retrieve(params.stripeSubscriptionId)
  const itemId = sub.items.data[0]?.id
  if (!itemId) throw new Error('La suscripción de Stripe no tiene items.')

  await stripe.subscriptions.update(params.stripeSubscriptionId, {
    items: [{ id: itemId, price: params.newPriceId }],
    proration_behavior: 'create_prorations',
  })
}

export async function cancelSubscriptionAtPeriodEnd(stripeSubscriptionId: string): Promise<void> {
  const stripe = getStripeClient()
  await stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: true })
}

export async function reactivateSubscription(stripeSubscriptionId: string): Promise<void> {
  const stripe = getStripeClient()
  await stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: false })
}

/**
 * Crea una checkout session para añadir GB extra a la suscripción existente.
 * El precio en Stripe debe ser recurrente (€2/unidad/mes).
 * Variable de entorno: STRIPE_STORAGE_ADDON_PRICE_ID
 */
export async function createStorageAddonCheckout(params: {
  orgId: string
  stripeCustomerId: string
  stripeSubscriptionId: string | null
  gb: number
  successUrl: string
  cancelUrl: string
}): Promise<{ url: string }> {
  const stripe = getStripeClient()
  const priceId = process.env.STRIPE_STORAGE_ADDON_PRICE_ID
  if (!priceId) throw new Error('STRIPE_STORAGE_ADDON_PRICE_ID no está configurada.')

  if (params.stripeSubscriptionId) {
    // Cliente ya tiene suscripción activa → añadir item directamente
    const sub = await stripe.subscriptions.retrieve(params.stripeSubscriptionId)
    const existingItem = sub.items.data.find((i) => i.price.id === priceId)

    if (existingItem) {
      // Ya tiene storage addon — actualizar cantidad sumando
      await stripe.subscriptions.update(params.stripeSubscriptionId, {
        items: [{ id: existingItem.id, quantity: (existingItem.quantity ?? 0) + params.gb }],
        proration_behavior: 'create_prorations',
        metadata: { protoolsOrgId: params.orgId },
      })
      // No hay URL de checkout — la compra se procesa directamente
      return { url: params.successUrl }
    }
    // Añadir item nuevo
    await stripe.subscriptions.update(params.stripeSubscriptionId, {
      items: [{ price: priceId, quantity: params.gb }],
      proration_behavior: 'create_prorations',
      metadata: { protoolsOrgId: params.orgId },
    })
    return { url: params.successUrl }
  }

  // Sin suscripción base → checkout normal (poco frecuente, fallback)
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: params.stripeCustomerId,
    line_items: [{ price: priceId, quantity: params.gb }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.orgId,
    subscription_data: { metadata: { protoolsOrgId: params.orgId } },
    metadata: { protoolsOrgId: params.orgId },
  })

  if (!session.url) throw new Error('Stripe no devolvió una URL de checkout.')
  return { url: session.url }
}

/** Verifica la firma del webhook y devuelve el evento — lanza si la firma no es válida. */
export function constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
  const stripe = getStripeClient()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET no está configurada.')
  return stripe.webhooks.constructEvent(payload, signature, secret)
}

// Re-exporta el namespace de tipos de Stripe para los handlers de webhook,
// sin que tengan que importar el SDK directamente.
export type { Stripe }
