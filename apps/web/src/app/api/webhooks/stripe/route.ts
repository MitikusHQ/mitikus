/**
 * POST /api/webhooks/stripe — único punto de entrada de eventos de Stripe.
 * Verifica la firma, resuelve a qué organización pertenece el evento, y
 * delega toda la lógica de negocio a subscription-service.ts (nunca se
 * actualiza Subscription directamente desde aquí).
 *
 * Ruta pública (ya cubierta por /api/webhooks/(.*) en middleware.ts).
 */

import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { constructWebhookEvent, type Stripe } from '@/lib/billing/stripe-provider'
import { getTierFromStripePriceId } from '@/lib/billing/plan-catalog'
import {
  activateSubscription,
  markPastDue,
  recoverPastDue,
  finalizeCancellation,
  updateExtraStorageGB,
  incrementTokenVersion,
} from '@/lib/billing/subscription-service'
import { triggerOrgDataExport } from '@/lib/rgpd/export-service'

export const runtime = 'nodejs'

async function resolveOrgId(stripeCustomerId: string | null, metadataOrgId?: string | null): Promise<string | null> {
  if (metadataOrgId) return metadataOrgId
  if (!stripeCustomerId) return null
  const sub = await db.subscription.findUnique({
    where: { stripeCustomerId },
    select: { orgId: true },
  })
  return sub?.orgId ?? null
}

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(rawBody, signature)
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const orgId = await resolveOrgId(
          typeof session.customer === 'string' ? session.customer : null,
          session.client_reference_id ?? session.metadata?.protoolsOrgId,
        )
        if (!orgId || !session.subscription || typeof session.subscription !== 'string') break

        // Los detalles completos (precio, periodo) llegan en customer.subscription.updated/created
        // que Stripe dispara inmediatamente después — aquí solo confirmamos el vínculo org↔customer.
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const orgId = await resolveOrgId(
          typeof subscription.customer === 'string' ? subscription.customer : null,
          subscription.metadata?.protoolsOrgId,
        )
        if (!orgId) break

        // Detectar GB extra de almacenamiento en cualquier item de la suscripción
        const storageAddonPriceId = process.env.STRIPE_STORAGE_ADDON_PRICE_ID
        if (storageAddonPriceId && orgId) {
          const extraGB = subscription.items.data
            .filter((i) => i.price.id === storageAddonPriceId)
            .reduce((sum, i) => sum + (i.quantity ?? 0), 0)
          await updateExtraStorageGB(orgId, extraGB).catch((err) => {
            console.error('[stripe webhook] error actualizando extraStorageGB', err)
          })
        }

        const priceId = subscription.items.data.find((i) => i.price.id !== storageAddonPriceId)?.price.id
          ?? subscription.items.data[0]?.price.id
        const tier = priceId ? getTierFromStripePriceId(priceId) : null
        if (!tier || !priceId) break

        const item = subscription.items.data.find((i) => i.price.id === priceId) ?? subscription.items.data[0]
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          await activateSubscription({
            orgId,
            tier,
            interval: subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'YEARLY' : 'MONTHLY',
            stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : '',
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            currentPeriodStart: new Date((item?.current_period_start ?? subscription.start_date) * 1000),
            currentPeriodEnd: new Date((item?.current_period_end ?? subscription.start_date) * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            stripeEventId: event.id,
          })
        } else if (subscription.status === 'past_due') {
          await markPastDue(orgId, event.id)
        } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          await finalizeCancellation(orgId, event.id)
          await incrementTokenVersion(orgId).catch(() => {})
          triggerOrgDataExport(orgId).catch(() => {})
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const orgId = await resolveOrgId(
          typeof subscription.customer === 'string' ? subscription.customer : null,
          subscription.metadata?.protoolsOrgId,
        )
        if (!orgId) break
        await finalizeCancellation(orgId, event.id)
        await incrementTokenVersion(orgId).catch(() => {})
        triggerOrgDataExport(orgId).catch(() => {})
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const orgId = await resolveOrgId(
          typeof invoice.customer === 'string' ? invoice.customer : null,
          null,
        )
        if (!orgId) break
        await markPastDue(orgId, event.id)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const orgId = await resolveOrgId(
          typeof invoice.customer === 'string' ? invoice.customer : null,
          null,
        )
        if (!orgId) break
        await recoverPastDue(orgId, event.id)
        break
      }

      default:
        // Evento no relevante para billing — se ignora silenciosamente
        break
    }
  } catch (err) {
    // Devolver 500 hace que Stripe reintente — correcto si fue un fallo transitorio (DB caída, etc.)
    Sentry.captureException(err, {
      tags: { component: 'stripe-webhook' },
      extra: {
        eventType: event?.type ?? 'unknown',
        stripeEventId: event?.id ?? 'unknown',
      },
    })
    console.error('[stripe webhook] error procesando evento', event.type, err)
    return NextResponse.json({ error: 'Internal error processing webhook' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
