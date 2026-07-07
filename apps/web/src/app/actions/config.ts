'use server'

import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { assertCan } from '@/lib/permissions'
import { audit } from '@/lib/audit'

export interface InstallationConfig {
  provider: string
  model: string
  temperature: number | null
  topP: number | null
  maxTokens: number | null
  language: string
  outputFormat: string
  systemPromptOverride: string | null
  customInstructions: string | null
  defaultVariables: Record<string, string>
  enabledCapabilities: string[]
}

const DEFAULT_CONFIG: InstallationConfig = {
  provider: 'anthropic',
  model: 'claude-sonnet-4-6',
  temperature: null,
  topP: null,
  maxTokens: null,
  language: 'es',
  outputFormat: 'markdown',
  systemPromptOverride: null,
  customInstructions: null,
  defaultVariables: {},
  enabledCapabilities: [],
}

async function verifyInstanceAccess(toolInstanceId: string, workspaceId: string) {
  const user = await requireUser()
  const instance = await db.toolInstance.findFirst({
    where: {
      id: toolInstanceId,
      workspaceId,
      workspace: { orgId: user.orgId },
      status: 'ACTIVE',
    },
    include: { installationConfig: true },
  })
  if (!instance) throw new Error('Herramienta no encontrada o sin acceso')
  // user ya incluye role (campo del modelo User)
  return { instance, user }
}

export async function getOrCreateConfig(
  toolInstanceId: string,
  workspaceId: string,
): Promise<InstallationConfig> {
  const { instance } = await verifyInstanceAccess(toolInstanceId, workspaceId)

  const cfg = instance.installationConfig
  if (!cfg) return { ...DEFAULT_CONFIG }

  return {
    provider: cfg.provider,
    model: cfg.model,
    temperature: cfg.temperature,
    topP: cfg.topP,
    maxTokens: cfg.maxTokens,
    language: cfg.language,
    outputFormat: cfg.outputFormat,
    systemPromptOverride: cfg.systemPromptOverride,
    customInstructions: cfg.customInstructions,
    defaultVariables: (cfg.defaultVariables as Record<string, string>) ?? {},
    enabledCapabilities: (cfg.enabledCapabilities as string[]) ?? [],
  }
}

export async function saveConfig(
  toolInstanceId: string,
  workspaceId: string,
  config: Partial<InstallationConfig>,
): Promise<{ success: true } | { error: string }> {
  try {
    const { user } = await verifyInstanceAccess(toolInstanceId, workspaceId)
    assertCan(user, 'configure_tool', {
      orgId: user.orgId,
      userId: user.id,
      workspaceId,
      entityType: 'tool_instance',
      entityId: toolInstanceId,
    })

    const data = {
      provider: config.provider,
      model: config.model,
      temperature: config.temperature ?? null,
      topP: config.topP ?? null,
      maxTokens: config.maxTokens ?? null,
      language: config.language,
      outputFormat: config.outputFormat,
      systemPromptOverride: config.systemPromptOverride ?? null,
      customInstructions: config.customInstructions ?? null,
      defaultVariables: config.defaultVariables ?? {},
      enabledCapabilities: config.enabledCapabilities ?? [],
    }

    await db.toolInstallationConfig.upsert({
      where: { toolInstanceId },
      create: { toolInstanceId, ...data },
      update: data,
    })

    audit({
      orgId: user.orgId,
      workspaceId,
      actorUserId: user.id,
      action: 'tool.configure',
      entityType: 'tool_instance',
      entityId: toolInstanceId,
      metadata: { model: data.model, provider: data.provider },
    })

    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al guardar la configuración'
    return { error: msg }
  }
}
