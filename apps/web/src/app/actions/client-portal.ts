'use server'

import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { createId } from '@paralleldrive/cuid2'

export async function getOrCreatePortalToken(clientId: string): Promise<string> {
  const user = await requireUser()

  const client = await db.client.findFirst({
    where: { id: clientId, workspace: { orgId: user.orgId } },
    select: { id: true, portalToken: true },
  })
  if (!client) throw new Error('Cliente no encontrado')

  if (client.portalToken) return client.portalToken

  const token = createId()
  await db.client.update({ where: { id: clientId }, data: { portalToken: token } })
  return token
}

export async function getClientByPortalToken(token: string) {
  const client = await db.client.findUnique({
    where: { portalToken: token },
    select: {
      id: true,
      name: true,
      contactName: true,
      email: true,
      sector: true,
      workspaceId: true,
      workspace: { select: { name: true } },
    },
  })
  return client
}
