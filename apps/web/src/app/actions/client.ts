'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'

export type ClientActionState = { error: string } | null

async function getVerifiedUser(workspaceId: string) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true },
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

  const name = formData.get('name')?.toString().trim() ?? ''
  if (!name) return { error: 'El nombre del cliente es obligatorio.' }

  const email = formData.get('email')?.toString().trim() || null
  const sector = formData.get('sector')?.toString().trim() || null
  const notes = formData.get('notes')?.toString().trim() || null

  await db.client.create({
    data: { name, email, sector, notes, workspaceId },
  })

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

  const existing = await db.client.findFirst({
    where: { id: clientId, workspaceId },
  })
  if (!existing) return { error: 'Cliente no encontrado.' }

  const name = formData.get('name')?.toString().trim() ?? ''
  if (!name) return { error: 'El nombre del cliente es obligatorio.' }

  const email = formData.get('email')?.toString().trim() || null
  const sector = formData.get('sector')?.toString().trim() || null
  const notes = formData.get('notes')?.toString().trim() || null

  await db.client.update({
    where: { id: clientId },
    data: { name, email, sector, notes },
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
