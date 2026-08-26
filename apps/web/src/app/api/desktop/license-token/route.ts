/**
 * POST /api/desktop/license-token
 *
 * Emite un token de licencia JWT para la app de escritorio MITIKUS.
 * El token incluye orgId, tier, status y tokenVersion; expira en 30 días.
 *
 * La app Tauri llama a este endpoint:
 *   - Al arrancar, si no tiene token o queda < 7 días para expirar.
 *   - Al reconectarse tras un periodo sin red.
 *
 * Requisito: MITIKUS_LICENSE_SECRET en el entorno.
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateSubscription, computeEffectiveStatus } from '@/lib/billing/subscription-service'
import { issueLicenseToken } from '@/lib/desktop/license-token'

export const runtime = 'nodejs'

const BLOCKING_STATUSES = ['EXPIRED', 'CANCELLED', 'BLOCKED'] as const

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  if (!process.env.MITIKUS_LICENSE_SECRET) {
    return NextResponse.json({ error: 'Servicio de licencias no disponible.' }, { status: 503 })
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { orgId: true },
  })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const sub = await getOrCreateSubscription(user.orgId)
  const status = computeEffectiveStatus(sub)

  if ((BLOCKING_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json(
      { error: 'Suscripción inactiva. Reactiva tu plan para usar la app de escritorio.' },
      { status: 403 },
    )
  }

  const token = issueLicenseToken({
    orgId:        user.orgId,
    tier:         sub.tier,
    status,
    tokenVersion: (sub as { tokenVersion?: number }).tokenVersion ?? 0,
  })

  return NextResponse.json({
    token,
    expiresInDays: 30,
    tier: sub.tier,
    status,
  })
}
