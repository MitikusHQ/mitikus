'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { assertCan } from '@/lib/permissions'
import { trackClientCreated } from '@/lib/pmf-analytics'

export type ClientActionState = { error: string } | null

async function getVerifiedUser(workspaceId: string) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true, role: true },
  })
  if (!user) redirect('/onboarding')

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) return null

  return { user, workspace }
}

export async function createClient(
  _prev: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const workspaceId = formData.get('workspaceId')?.toString() ?? ''
  const ctx = await getVerifiedUser(workspaceId)
  if (!ctx) return { error: 'Workspace no encontrado o sin acceso.' }
  try { assertCan(ctx.user, 'create_client') } catch { return { error: 'Sin permisos para crear clientes.' } }

  const name = formData.get('name')?.toString().trim() ?? ''
  if (!name) return { error: 'El nombre del cliente es obligatorio.' }

  const clientType = formData.get('clientType')?.toString().trim() || 'client'
  const email = formData.get('email')?.toString().trim() || null
  const phone = formData.get('phone')?.toString().trim() || null
  const contactName = formData.get('contactName')?.toString().trim() || null
  const taxId = formData.get('taxId')?.toString().trim() || null
  const fiscalAddress = formData.get('fiscalAddress')?.toString().trim() || null
  const postalCode = formData.get('postalCode')?.toString().trim() || null
  const city = formData.get('city')?.toString().trim() || null
  const province = formData.get('province')?.toString().trim() || null
  const country = formData.get('country')?.toString().trim() || null
  const sector = formData.get('sector')?.toString().trim() || null
  const notes = formData.get('notes')?.toString().trim() || null

  const newClient = await db.client.create({
    data: { name, clientType, contactName, email, phone, taxId, fiscalAddress, postalCode, city, province, country, sector, notes, workspaceId },
    select: { id: true },
  })

  trackClientCreated({ orgId: ctx.user.orgId, workspaceId, userId: ctx.user.id, clientId: newClient.id, clientType })

  redirect(`/workspace/${workspaceId}/clients`)
}

export async function updateClient(
  _prev: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const workspaceId = formData.get('workspaceId')?.toString() ?? ''
  const clientId = formData.get('clientId')?.toString() ?? ''
  const ctx = await getVerifiedUser(workspaceId)
  if (!ctx) return { error: 'Workspace no encontrado o sin acceso.' }
  try { assertCan(ctx.user, 'edit_client') } catch { return { error: 'Sin permisos para editar clientes.' } }

  const existing = await db.client.findFirst({
    where: { id: clientId, workspaceId },
  })
  if (!existing) return { error: 'Cliente no encontrado.' }

  const name = formData.get('name')?.toString().trim() ?? ''
  if (!name) return { error: 'El nombre del cliente es obligatorio.' }

  const clientType = formData.get('clientType')?.toString().trim() || 'client'
  const email = formData.get('email')?.toString().trim() || null
  const phone = formData.get('phone')?.toString().trim() || null
  const contactName = formData.get('contactName')?.toString().trim() || null
  const taxId = formData.get('taxId')?.toString().trim() || null
  const fiscalAddress = formData.get('fiscalAddress')?.toString().trim() || null
  const postalCode = formData.get('postalCode')?.toString().trim() || null
  const city = formData.get('city')?.toString().trim() || null
  const province = formData.get('province')?.toString().trim() || null
  const country = formData.get('country')?.toString().trim() || null
  const sector = formData.get('sector')?.toString().trim() || null
  const notes = formData.get('notes')?.toString().trim() || null

  await db.client.update({
    where: { id: clientId },
    data: { name, clientType, contactName, email, phone, taxId, fiscalAddress, postalCode, city, province, country, sector, notes },
  })

  redirect(`/workspace/${workspaceId}/clients`)
}

export async function archiveClient(
  _prev: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const workspaceId = formData.get('workspaceId')?.toString() ?? ''
  const clientId = formData.get('clientId')?.toString() ?? ''
  const ctx = await getVerifiedUser(workspaceId)
  if (!ctx) return { error: 'Workspace no encontrado o sin acceso.' }
  try { assertCan(ctx.user, 'archive_client') } catch { return { error: 'Sin permisos para archivar clientes.' } }

  const existing = await db.client.findFirst({
    where: { id: clientId, workspaceId },
  })
  if (!existing) return { error: 'Cliente no encontrado.' }

  await db.client.update({
    where: { id: clientId },
    data: { isArchived: true },
  })

  redirect(`/workspace/${workspaceId}/clients`)
}
