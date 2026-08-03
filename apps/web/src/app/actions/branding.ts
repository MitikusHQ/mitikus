'use server'

import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function updateWorkspaceBranding(workspaceId: string, data: { brandColor?: string; logoUrl?: string | null }) {
  const user = await requireUser()
  const ws = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!ws) throw new Error('No autorizado')

  await db.workspace.update({ where: { id: workspaceId }, data })
  revalidatePath(`/workspace/${workspaceId}`)
  revalidatePath(`/leads/${workspaceId}`)
}

export async function removeWorkspaceLogo(workspaceId: string) {
  const user = await requireUser()
  const ws = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!ws) throw new Error('No autorizado')

  await db.workspace.update({ where: { id: workspaceId }, data: { logoUrl: null } })
  revalidatePath(`/workspace/${workspaceId}`)
  revalidatePath(`/leads/${workspaceId}`)
}
