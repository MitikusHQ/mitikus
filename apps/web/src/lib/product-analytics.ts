import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

interface TrackEventInput {
  orgId:        string
  userId?:      string | null
  workspaceId?: string | null
  event:        string
  properties?:  Record<string, unknown>
  source?:      'web' | 'api' | 'webhook' | 'cron'
  sessionId?:   string | null
}

// Fire-and-forget — nunca bloquea el request principal.
// Pattern idéntico a recordAIUsage() y audit().
// NUNCA incluir PII en properties (email, nombre, IP, payment data).
export function trackEvent(input: TrackEventInput): void {
  void db.productEvent
    .create({
      data: {
        orgId:       input.orgId,
        userId:      input.userId ?? null,
        workspaceId: input.workspaceId ?? null,
        event:       input.event,
        properties:  (input.properties ?? {}) as Prisma.InputJsonValue,
        source:      input.source ?? 'web',
        sessionId:   input.sessionId ?? null,
      },
    })
    .catch((err) => {
      // Silencioso — analytics nunca debe interrumpir el flujo de negocio
      console.warn('[ProductAnalytics] Error tracking event:', input.event, err)
    })
}
