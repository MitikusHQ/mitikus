'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import type { LeadStatus } from '@prisma/client'

async function assertWorkspaceAccess(workspaceId: string) {
  const user = await requireUser()
  const ws = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!ws) throw new Error('Workspace no encontrado')
  return user
}

export async function getLeads(workspaceId: string, status?: LeadStatus) {
  await assertWorkspaceAccess(workspaceId)
  return db.workspaceLead.findMany({
    where: { workspaceId, ...(status ? { status } : {}) },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateLeadStatus(leadId: string, workspaceId: string, status: LeadStatus) {
  await assertWorkspaceAccess(workspaceId)
  await db.workspaceLead.update({
    where: { id: leadId, workspaceId },
    data: { status },
  })
  revalidatePath(`/workspace/${workspaceId}/leads`)
}

export async function updateLeadNotes(leadId: string, workspaceId: string, notes: string) {
  await assertWorkspaceAccess(workspaceId)
  await db.workspaceLead.update({
    where: { id: leadId, workspaceId },
    data: { notes },
  })
  revalidatePath(`/workspace/${workspaceId}/leads`)
}

export async function deleteLead(leadId: string, workspaceId: string) {
  await assertWorkspaceAccess(workspaceId)
  await db.workspaceLead.delete({ where: { id: leadId, workspaceId } })
  revalidatePath(`/workspace/${workspaceId}/leads`)
}
