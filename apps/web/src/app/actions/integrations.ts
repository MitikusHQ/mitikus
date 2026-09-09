'use server'

import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { assertCan } from '@/lib/permissions'
import {
  buildAiProviderIntegrationState,
  buildFormsIntegrationState,
  buildFormsWebhookUrl,
  createFormsWebhookToken,
  getCalendarAccessToken,
  getCalendarAuthorizeUrl,
  getStorageAccessToken,
  getStorageAuthorizeUrl,
  parseWorkspaceIntegrations,
  withCalendarIntegration,
  withAiProviderIntegration,
  withStorageIntegration,
  withFormsIntegration,
  type AiProvider,
  type CalendarProvider,
  type StorageProvider,
} from '@/lib/integrations/calendar'
import { buildWorkspaceFilesZip } from '@/lib/files/workspace-export'
import { createExternalCalendarEvent } from '@/lib/integrations/calendar-events'
import { uploadToExternalStorage } from '@/lib/integrations/storage-upload'

async function getWorkspaceProfile(workspaceId: string) {
  const user = await requireUser()
  assertCan(user, 'manage_fiscal_settings')

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: {
      id: true,
      companyProfile: {
        select: {
          integrations: true,
        },
      },
    },
  })
  if (!workspace) throw new Error('Workspace no encontrado')
  return workspace
}

export async function getCalendarConnectionUrl(workspaceId: string, provider: CalendarProvider) {
  await getWorkspaceProfile(workspaceId)
  const url = getCalendarAuthorizeUrl(provider, workspaceId)
  if (!url) {
    return {
      ok: false as const,
      error: provider === 'google'
        ? 'Falta configurar GOOGLE_CALENDAR_CLIENT_ID en producción.'
        : 'Falta configurar MICROSOFT_CALENDAR_CLIENT_ID en producción.',
    }
  }
  return { ok: true as const, url }
}

export async function disconnectCalendarIntegration(workspaceId: string) {
  const workspace = await getWorkspaceProfile(workspaceId)
  const integrations = withCalendarIntegration(workspace.companyProfile?.integrations, null) as Prisma.InputJsonValue

  await db.companyProfile.upsert({
    where: { workspaceId },
    create: { workspaceId, integrations },
    update: { integrations },
  })

  return { ok: true as const, integrations: parseWorkspaceIntegrations(integrations) }
}

export async function getStorageConnectionUrl(workspaceId: string, provider: StorageProvider) {
  await getWorkspaceProfile(workspaceId)
  const url = getStorageAuthorizeUrl(provider, workspaceId)
  if (!url) {
    const missingKey =
      provider === 'google_drive'
        ? 'GOOGLE_DRIVE_CLIENT_ID'
        : provider === 'onedrive'
          ? 'MICROSOFT_STORAGE_CLIENT_ID'
          : 'DROPBOX_CLIENT_ID'
    return {
      ok: false as const,
      error: `Falta configurar ${missingKey} en producción.`,
    }
  }
  return { ok: true as const, url }
}

export async function disconnectStorageIntegration(workspaceId: string) {
  const workspace = await getWorkspaceProfile(workspaceId)
  const integrations = withStorageIntegration(workspace.companyProfile?.integrations, null) as Prisma.InputJsonValue

  await db.companyProfile.upsert({
    where: { workspaceId },
    create: { workspaceId, integrations },
    update: { integrations },
  })

  return { ok: true as const, integrations: parseWorkspaceIntegrations(integrations) }
}

export async function exportWorkspaceFilesToConnectedStorage(workspaceId: string) {
  const workspace = await getWorkspaceProfile(workspaceId)
  const integrations = parseWorkspaceIntegrations(workspace.companyProfile?.integrations)
  const storage = integrations.storage
  if (!storage) {
    return { ok: false as const, error: 'No hay almacenamiento externo conectado.' }
  }

  const accessToken = getStorageAccessToken(storage)
  if (!accessToken) {
    return { ok: false as const, error: 'No se pudo leer la conexión de almacenamiento. Vuelve a conectarla.' }
  }

  const { buffer, filename } = await buildWorkspaceFilesZip(workspaceId)
  const result = await uploadToExternalStorage({
    provider: storage.provider,
    accessToken,
    filename,
    buffer,
  })

  return {
    ok: true as const,
    filename,
    provider: storage.provider,
    url: result.webUrl ?? null,
  }
}

export async function createCalendarEventFromTask(workspaceId: string, taskId: string) {
  await getWorkspaceProfile(workspaceId)

  const task = await db.task.findFirst({
    where: { id: taskId, workspaceId },
    select: {
      title: true,
      description: true,
      dueDate: true,
      workspace: {
        select: {
          companyProfile: {
            select: { integrations: true },
          },
        },
      },
    },
  })
  if (!task) return { ok: false as const, error: 'Tarea no encontrada.' }
  if (!task.dueDate) return { ok: false as const, error: 'La tarea no tiene fecha.' }

  const integrations = parseWorkspaceIntegrations(task.workspace.companyProfile?.integrations)
  const calendar = integrations.calendar
  if (!calendar) return { ok: false as const, error: 'No hay calendario conectado.' }

  const accessToken = getCalendarAccessToken(calendar)
  if (!accessToken) {
    return { ok: false as const, error: 'No se pudo leer la conexión de calendario. Vuelve a conectarla.' }
  }

  const result = await createExternalCalendarEvent({
    provider: calendar.provider,
    accessToken,
    title: task.title,
    description: task.description,
    startsAt: task.dueDate,
    durationMinutes: 60,
  })

  return {
    ok: true as const,
    provider: calendar.provider,
    url: result.webUrl ?? null,
  }
}

export async function saveAiProviderIntegration(workspaceId: string, provider: AiProvider, apiKey: string, label?: string) {
  const workspace = await getWorkspaceProfile(workspaceId)
  const trimmedKey = apiKey.trim()
  if (!trimmedKey) return { ok: false as const, error: 'Introduce una API key válida.' }

  const aiProvider = buildAiProviderIntegrationState({ provider, apiKey: trimmedKey, label })
  if (!aiProvider) {
    return { ok: false as const, error: 'No se pudo cifrar la API key. Revisa MITIKUS_ENCRYPTION_KEY.' }
  }

  const integrations = withAiProviderIntegration(workspace.companyProfile?.integrations, aiProvider) as Prisma.InputJsonValue

  await db.companyProfile.upsert({
    where: { workspaceId },
    create: { workspaceId, integrations },
    update: { integrations },
  })

  return { ok: true as const }
}

export async function disconnectAiProviderIntegration(workspaceId: string) {
  const workspace = await getWorkspaceProfile(workspaceId)
  const integrations = withAiProviderIntegration(workspace.companyProfile?.integrations, null) as Prisma.InputJsonValue

  await db.companyProfile.upsert({
    where: { workspaceId },
    create: { workspaceId, integrations },
    update: { integrations },
  })

  return { ok: true as const, integrations: parseWorkspaceIntegrations(integrations) }
}

export async function rotateFormsWebhookIntegration(workspaceId: string) {
  const workspace = await getWorkspaceProfile(workspaceId)
  const current = parseWorkspaceIntegrations(workspace.companyProfile?.integrations).forms ?? null
  const token = createFormsWebhookToken()
  const forms = buildFormsIntegrationState(token, current)
  const integrations = withFormsIntegration(workspace.companyProfile?.integrations, forms) as Prisma.InputJsonValue

  await db.companyProfile.upsert({
    where: { workspaceId },
    create: { workspaceId, integrations },
    update: { integrations },
  })

  return {
    ok: true as const,
    forms,
    webhookUrl: buildFormsWebhookUrl(workspaceId, token),
  }
}

export async function disconnectFormsWebhookIntegration(workspaceId: string) {
  const workspace = await getWorkspaceProfile(workspaceId)
  const integrations = withFormsIntegration(workspace.companyProfile?.integrations, null) as Prisma.InputJsonValue

  await db.companyProfile.upsert({
    where: { workspaceId },
    create: { workspaceId, integrations },
    update: { integrations },
  })

  return { ok: true as const, integrations: parseWorkspaceIntegrations(integrations) }
}


