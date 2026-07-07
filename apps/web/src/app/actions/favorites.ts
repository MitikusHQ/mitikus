'use server'

import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { audit } from '@/lib/audit'

export async function getFavoriteIds(): Promise<string[]> {
  const user = await requireUser()
  const rows = await db.toolFavorite.findMany({
    where: { userId: user.id },
    select: { toolDefinitionId: true },
  })
  return rows.map((r) => r.toolDefinitionId)
}

export async function toggleFavorite(
  toolDefinitionId: string,
): Promise<{ isFavorite: boolean } | { error: string }> {
  try {
    const user = await requireUser()

    const existing = await db.toolFavorite.findUnique({
      where: { userId_toolDefinitionId: { userId: user.id, toolDefinitionId } },
    })

    if (existing) {
      await db.toolFavorite.delete({
        where: { userId_toolDefinitionId: { userId: user.id, toolDefinitionId } },
      })
      audit({
        orgId: user.orgId,
        actorUserId: user.id,
        action: 'favorite.remove',
        entityType: 'tool_definition',
        entityId: toolDefinitionId,
      })
      return { isFavorite: false }
    }

    await db.toolFavorite.create({
      data: { userId: user.id, toolDefinitionId },
    })
    audit({
      orgId: user.orgId,
      actorUserId: user.id,
      action: 'favorite.add',
      entityType: 'tool_definition',
      entityId: toolDefinitionId,
    })
    return { isFavorite: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al actualizar favorito' }
  }
}
