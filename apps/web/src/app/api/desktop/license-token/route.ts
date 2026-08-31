/**
 * POST /api/desktop/license-token
 *
 * Emite un token de licencia JWT para la app de escritorio MITIKUS.
 * El token incluye orgId, tier, status y tokenVersion. Se emite hasta el
 * final de la prueba o del periodo pagado. Si no hay fecha de periodo, usa
 * un fallback de 7 días.
 *
 * La web autenticada dentro de Tauri llama a este endpoint periódicamente
 * para renovar la licencia local de la app de escritorio.
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
const DAY_MS = 24 * 60 * 60 * 1000
const FALLBACK_TTL_MS = 7 * DAY_MS

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

  const fallbackExpiresAt = new Date(Date.now() + FALLBACK_TTL_MS)
  const entitlementExpiresAt = status === 'TRIALING'
    ? sub.trialEndsAt
    : sub.currentPeriodEnd
  const expiresAt = entitlementExpiresAt && entitlementExpiresAt.getTime() > Date.now()
    ? entitlementExpiresAt
    : fallbackExpiresAt

  const token = issueLicenseToken({
    orgId:        user.orgId,
    tier:         sub.tier,
    status,
    tokenVersion: (sub as { tokenVersion?: number }).tokenVersion ?? 0,
    expiresAt,
  })

  return NextResponse.json({
    token,
    expiresAt: expiresAt.toISOString(),
    expiresInDays: Math.ceil((expiresAt.getTime() - Date.now()) / DAY_MS),
    tier: sub.tier,
    status,
  })
}
