'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getPlanLimits } from '@/lib/plan-limits'
import { checkPlanLimit } from '@/lib/billing/check-plan-limit'
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

  // Límite de herramientas por plan (usa plan de la org si existe, si no el trialPlan)
  const planLimits = getPlanLimits(user.trialPlan)
  if (planLimits.maxToolsInstalled === 0) {
    return { error: 'Este dominio de correo no está permitido para la beta.' }
  }
  const toolLimitCheck = await checkPlanLimit(user.orgId, 'maxToolsInstalled', workspaceId)
  if (!toolLimitCheck.allowed) return { error: toolLimitCheck.message }

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

// Instala una herramienta oficial por slug y devuelve el instanceId.
// Usado en el onboarding para llevar al usuario directo al run sin FormData.
export async function quickInstallTool(
  workspaceId: string,
  slug: string,
): Promise<{ instanceId: string } | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'No autenticado.' }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true, role: true, trialPlan: true },
  })
  if (!user) return { error: 'Usuario no encontrado.' }

  assertCan(user, 'install_tool', { orgId: user.orgId, userId: user.id, workspaceId, entityType: 'tool_instance' })

  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!workspace) return { error: 'Workspace no encontrado.' }

  const toolDef = await db.toolDefinition.findFirst({ where: { slug } })
  if (!toolDef) return { error: 'Herramienta no encontrada.' }

  const planLimits = getPlanLimits(user.trialPlan)
  if (planLimits.maxToolsInstalled === 0) return { error: 'Este dominio no está permitido para la beta.' }
  const toolLimitCheck = await checkPlanLimit(user.orgId, 'maxToolsInstalled', workspaceId)
  if (!toolLimitCheck.allowed) return { error: toolLimitCheck.message }

  const existing = await db.toolInstance.findFirst({ where: { toolDefinitionId: toolDef.id, workspaceId, status: 'ACTIVE' } })
  if (existing) return { instanceId: existing.id }

  const instance = await db.toolInstance.create({
    data: { toolDefinitionId: toolDef.id, workspaceId, name: toolDef.name, createdBy: user.id },
  })

  audit({
    orgId: user.orgId, workspaceId, actorUserId: user.id,
    action: 'tool.install', entityType: 'tool_instance', entityId: instance.id,
    metadata: { toolDefinitionId: toolDef.id, toolName: toolDef.name, via: 'onboarding' },
  })

  return { instanceId: instance.id }
}

export async function assignClientToInstance(
  formData: FormData,
): Promise<void> {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const instanceId = formData.get('instanceId')?.toString() ?? ''
  const workspaceId = formData.get('workspaceId')?.toString() ?? ''
  const clientId = formData.get('clientId')?.toString() || null

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true, role: true },
  })
  if (!user) redirect('/onboarding')

  assertCan(user, 'configure_tool')

  const instance = await db.toolInstance.findFirst({
    where: { id: instanceId, workspaceId },
  })
  if (!instance) return

  if (clientId) {
    const client = await db.client.findFirst({ where: { id: clientId, workspaceId } })
    if (!client) return
  }

  await db.toolInstance.update({
    where: { id: instanceId },
    data: { clientId },
  })

  redirect(`/workspace/${workspaceId}/tools/${instanceId}/settings`)
}
