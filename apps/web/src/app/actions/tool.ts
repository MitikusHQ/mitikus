'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getPlanLimits } from '@/lib/plan-limits'
import { assertCan } from '@/lib/permissions'
import { audit } from '@/lib/audit'

export type InstallToolState = { error: string } | null

export async function installTool(
  _prev: InstallToolState,
  formData: FormData,
): Promise<InstallToolState> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const toolDefinitionId = formData.get('toolDefinitionId')?.toString() ?? ''
  const workspaceId = formData.get('workspaceId')?.toString() ?? ''
  const clientId = formData.get('clientId')?.toString() || null
  const name = formData.get('name')?.toString().trim() ?? ''

  if (!toolDefinitionId || !workspaceId) {
    return { error: 'Faltan datos obligatorios.' }
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true, role: true, trialPlan: true },
  })
  if (!user) redirect('/onboarding')

  assertCan(user, 'install_tool', { orgId: user.orgId, userId: user.id, workspaceId, entityType: 'tool_instance' })

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) return { error: 'Workspace no encontrado o sin acceso.' }

  const toolDef = await db.toolDefinition.findUnique({
    where: { id: toolDefinitionId },
  })
  if (!toolDef) return { error: 'Herramienta no encontrada.' }

  if (clientId) {
    const client = await db.client.findFirst({
      where: { id: clientId, workspaceId },
    })
    if (!client) return { error: 'Cliente no pertenece a este workspace.' }
  }

  // Límite de herramientas por plan
  const planLimits = getPlanLimits(user.trialPlan)
  if (planLimits.maxToolsInstalled === 0) {
    return { error: 'Este dominio de correo no está permitido para la beta.' }
  }
  const installedCount = await db.toolInstance.count({
    where: { workspaceId, status: 'ACTIVE' },
  })
  if (installedCount >= planLimits.maxToolsInstalled) {
    return {
      error: `Has alcanzado el límite de herramientas instaladas de tu plan (${planLimits.maxToolsInstalled}). Contacta con soporte para ampliar.`,
    }
  }

  // Comprobar que no existe ya una instancia activa de esta herramienta en el workspace
  const existing = await db.toolInstance.findFirst({
    where: { toolDefinitionId, workspaceId, status: 'ACTIVE' },
  })
  if (existing) return { error: 'Esta herramienta ya está instalada en el workspace.' }

  const newInstance = await db.toolInstance.create({
    data: {
      toolDefinitionId,
      workspaceId,
      clientId,
      name: name || toolDef.name,
      createdBy: user.id,
    },
  })

  audit({
    orgId: user.orgId,
    workspaceId,
    actorUserId: user.id,
    action: 'tool.install',
    entityType: 'tool_instance',
    entityId: newInstance.id,
    metadata: { toolDefinitionId, toolName: toolDef.name },
  })

  redirect(`/workspace/${workspaceId}/tools`)
}
