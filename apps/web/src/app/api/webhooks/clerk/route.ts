import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { db } from '@/lib/db'
import { classifyEmail } from '@/lib/email-classification'
import { getOrCreateSubscription } from '@/lib/billing/subscription-service'
import { trackEvent } from '@/lib/product-analytics'

type ClerkUserEvent = {
  type: 'user.created' | 'user.updated' | 'user.deleted'
  data: {
    id: string
    email_addresses: Array<{ email_address: string; id: string }>
    primary_email_address_id: string
    first_name: string | null
    last_name: string | null
  }
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'CLERK_WEBHOOK_SECRET not set' }, { status: 500 })
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: ClerkUserEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkUserEvent
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  if (evt.type === 'user.created') {
    const { id, email_addresses, primary_email_address_id, first_name, last_name } = evt.data

    const primaryEmail = email_addresses.find((e) => e.id === primary_email_address_id)
    if (!primaryEmail) {
      return NextResponse.json({ error: 'No primary email found' }, { status: 400 })
    }

    const classification = classifyEmail(primaryEmail.email_address)

    // Crear usuario — la org y workspace se crean en /onboarding
    const created = await db.user.create({
      data: {
        clerkId: id,
        email: primaryEmail.email_address,
        name: [first_name, last_name].filter(Boolean).join(' ') || null,
        emailType: classification.emailType,
        trialPlan: classification.trialPlan,
        // orgId se setea en el onboarding — se crea una org temporal
        org: {
          create: {
            name: `Org de ${primaryEmail.email_address.split('@')[0]}`,
            workspaces: {
              create: {
                name: 'Mi espacio',
                slug: 'mi-espacio',
              },
            },
          },
        },
        role: 'OWNER',
      },
      select: { orgId: true },
    })

    // BILLING-001 — toda organización nace con una Subscription en TRIALING
    await getOrCreateSubscription(created.orgId)

    // DATA-001 — registrar signup como primer evento del funnel
    trackEvent({
      orgId:  created.orgId,
      event:  'user.signed_up',
      source: 'webhook',
      properties: {
        emailType:  classification.emailType,
        trialPlan:  classification.trialPlan,
      },
    })
  }

  if (evt.type === 'user.updated') {
    const { id, email_addresses, primary_email_address_id, first_name, last_name } = evt.data
    const primaryEmail = email_addresses.find((e) => e.id === primary_email_address_id)

    const updateData: Record<string, unknown> = {
      name: [first_name, last_name].filter(Boolean).join(' ') || null,
    }

    if (primaryEmail?.email_address) {
      const classification = classifyEmail(primaryEmail.email_address)
      updateData.email = primaryEmail.email_address
      updateData.emailType = classification.emailType
      updateData.trialPlan = classification.trialPlan
    }

    await db.user.updateMany({ where: { clerkId: id }, data: updateData })
  }

  if (evt.type === 'user.deleted') {
    // Anonimizar datos PII sin borrar el registro — preserva audit trail y FK constraints
    await db.user.updateMany({
      where: { clerkId: evt.data.id },
      data: {
        email:      `deleted-${evt.data.id}@void.local`,
        name:       null,
        trialPlan:  'blocked',
      },
    })
  }

  return NextResponse.json({ success: true })
}
