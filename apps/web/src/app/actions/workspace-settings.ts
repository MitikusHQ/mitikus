'use server'

import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { roleAtLeast } from '@/lib/permissions'

export async function updateWorkspacePermissionSettings(
  workspaceId: string,
  restrictCreationToAdmins: boolean,
): Promise<void> {
  const user = await requireUser()
  if (!roleAtLeast(user.role, 'OWNER')) throw new Error('Solo el Owner puede cambiar los permisos del workspace')

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) throw new Error('Workspace no encontrado')

  await db.workspace.update({
    where: { id: workspaceId },
    data: { restrictCreationToAdmins },
  })
}
