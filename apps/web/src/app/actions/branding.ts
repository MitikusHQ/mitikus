'use server'

import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'

export async function updateUserAvatar(avatarUrl: string) {
  const user = await requireUser()
  await db.user.update({ where: { id: user.id }, data: { avatarUrl } })
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function updateWorkspaceBranding(
  workspaceId: string,
  data: { name?: string; logoUrl?: string; brandColor?: string },
) {
  const user = await requireUser()
  if (!can(user, 'manage_members')) {
    throw new Error('Sin permisos para editar el workspace')
  }
  await db.workspace.update({
    where: { id: workspaceId, orgId: user.orgId },
    data,
  })
  revalidatePath(`/workspace/${workspaceId}`, 'layout')
  return { ok: true }
}
