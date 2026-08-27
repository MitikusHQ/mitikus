'use server'

import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { trackOnboardingBlocked } from '@/lib/pmf-analytics'

export async function recordFriction(workspaceId: string, reason: string): Promise<void> {
  try {
    const user = await requireUser()
    const workspace = await db.workspace.findFirst({
      where: { id: workspaceId, orgId: user.orgId },
      select: { id: true },
    })
    if (!workspace) return
    trackOnboardingBlocked({ orgId: user.orgId, workspaceId, userId: user.id, reason })
  } catch {
    // fire-and-forget — nunca bloquea ni lanza al caller
  }
}
