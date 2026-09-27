import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isWebPushConfigured } from '@/lib/web-push'

interface PushSubscriptionBody {
  endpoint?: unknown
  keys?: {
    p256dh?: unknown
    auth?: unknown
  }
}

export async function POST(request: NextRequest) {
  if (!isWebPushConfigured()) {
    return NextResponse.json({ error: 'Web Push no configurado.' }, { status: 503 })
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 })

  const body = await request.json().catch(() => null) as PushSubscriptionBody | null
  const endpoint = body?.endpoint
  const p256dh = body?.keys?.p256dh
  const authKey = body?.keys?.auth

  if (typeof endpoint !== 'string' || typeof p256dh !== 'string' || typeof authKey !== 'string') {
    return NextResponse.json({ error: 'Suscripción no válida.' }, { status: 400 })
  }

  await db.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: user.id,
      endpoint,
      p256dh,
      auth: authKey,
      userAgent: request.headers.get('user-agent'),
    },
    update: {
      userId: user.id,
      p256dh,
      auth: authKey,
      userAgent: request.headers.get('user-agent'),
    },
  })

  return NextResponse.json({ ok: true })
}
