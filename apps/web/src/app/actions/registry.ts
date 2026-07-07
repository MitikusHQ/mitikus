'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getPlanLimits } from '@/lib/plan-limits'

export async function installToolFromRegistry(
  toolDefinitionId: string,
  workspaceId: string,
  searchId?: string,
): Promise<{ error: string } | { redirectTo: string }> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true, trialPlan: true },
  })
  if (!user) redirect('/onboarding')

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) return { error: 'Workspace no encontrado' }

  const toolDef = await db.toolDefinition.findUnique({ where: { id: toolDefinitionId } })
  if (!toolDef) return { error: 'Herramienta no encontrada' }

  // Security: only public tools or own-org tools
  if (!toolDef.isPublic && toolDef.orgId !== user.orgId) {
    return { error: 'No tienes permiso para instalar esta herramienta' }
  }

  const planLimits = getPlanLimits(user.trialPlan)
  if (planLimits.maxToolsInstalled === 0) {
    return { error: 'Este dominio de correo no está permitido para la beta.' }
  }

  const installedCount = await db.toolInstance.count({
    where: { workspaceId, status: 'ACTIVE' },
  })
  if (installedCount >= planLimits.maxToolsInstalled) {
    return { error: `Has alcanzado el límite de herramientas instaladas (${planLimits.maxToolsInstalled})` }
  }

  // Return existing instance if already installed
  const existing = await db.toolInstance.findFirst({
    where: { toolDefinitionId, workspaceId, status: 'ACTIVE' },
  })
  if (existing) {
    return { redirectTo: `/workspace/${workspaceId}/tools/${existing.id}` }
  }

  const instance = await db.toolInstance.create({
    data: {
      toolDefinitionId,
      workspaceId,
      name: toolDef.name,
      createdBy: user.id,
    },
  })

  // Update metrics record (non-blocking)
  if (searchId) {
    void db.registrySearch
      .update({ where: { id: searchId }, data: { action: 'install', toolDefinitionId } })
      .catch(() => {})
  }

  return { redirectTo: `/workspace/${workspaceId}/tools/${instance.id}` }
}

export async function recordRegistryAction(
  searchId: string,
  action: 'generate' | 'dismissed',
): Promise<void> {
  if (!searchId) return
  const { userId } = await auth()
  if (!userId) return
  void db.registrySearch
    .update({ where: { id: searchId }, data: { action } })
    .catch(() => {})
}
