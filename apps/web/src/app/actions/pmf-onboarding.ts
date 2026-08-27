'use server'

import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { trackOnboardingViewed, trackOnboardingStepClicked, trackOnboardingCompleted } from '@/lib/pmf-analytics'

async function resolveUser(workspaceId: string) {
  const user = await requireUser()
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) return null
  return user
}

export async function recordOnboardingViewed(workspaceId: string): Promise<void> {
  try {
    const user = await resolveUser(workspaceId)
    if (!user) return
    trackOnboardingViewed({ orgId: user.orgId, workspaceId, userId: user.id, source: 'checklist' })
  } catch {
    // fire-and-forget
  }
}

export async function recordOnboardingStepClicked(
  workspaceId: string,
  stepId: string,
  stepLabel: string,
): Promise<void> {
  try {
    const user = await resolveUser(workspaceId)
    if (!user) return
    trackOnboardingStepClicked({ orgId: user.orgId, workspaceId, userId: user.id, stepId, stepLabel })
  } catch {
    // fire-and-forget
  }
}

// Llamado server-side con dedup: solo dispara una vez por workspace
export async function recordOnboardingCompleted(workspaceId: string): Promise<void> {
  try {
    const already = await db.auditLog.findFirst({
      where: { workspaceId, action: 'pmf.onboarding.completed' },
      select: { id: true },
    })
    if (already) return
    const user = await resolveUser(workspaceId)
    if (!user) return
    trackOnboardingCompleted({ orgId: user.orgId, workspaceId, userId: user.id })
  } catch {
    // fire-and-forget
  }
}
