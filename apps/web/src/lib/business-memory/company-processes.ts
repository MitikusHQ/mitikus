/**
 * Company Processes — procesos de negocio conocidos del workspace.
 */

import { db } from '@/lib/db'
import { getOrCreateProfile } from './company-profile'
import type { CompanyProcessData, ProcessDomain, ProcessMaturity } from './memory-types'
import type { Prisma } from '@prisma/client'

function mapProcess(p: {
  id: string
  workspaceId: string
  domain: string
  name: string
  description: string | null
  isDocumented: boolean
  maturity: string
  toolSlugs: Prisma.JsonValue
}): CompanyProcessData {
  return {
    id:           p.id,
    workspaceId:  p.workspaceId,
    domain:       p.domain as ProcessDomain,
    name:         p.name,
    description:  p.description,
    isDocumented: p.isDocumented,
    maturity:     p.maturity as ProcessMaturity,
    toolSlugs:    Array.isArray(p.toolSlugs) ? (p.toolSlugs as string[]) : [],
  }
}

export async function getProcesses(
  workspaceId: string,
  domain?: ProcessDomain,
): Promise<CompanyProcessData[]> {
  const rows = await db.companyProcess.findMany({
    where:   { workspaceId, ...(domain ? { domain } : {}) },
    orderBy: [{ domain: 'asc' }, { name: 'asc' }],
  })
  return rows.map(mapProcess)
}

/**
 * Registra o actualiza un proceso. Si ya existe uno con el mismo dominio y nombre, lo actualiza.
 * Si se conoce la herramienta utilizada, se añade al listado del proceso.
 */
export async function upsertProcess(
  workspaceId: string,
  data: {
    domain:        ProcessDomain
    name:          string
    description?:  string
    isDocumented?: boolean
    maturity?:     ProcessMaturity
    toolSlug?:     string
  },
): Promise<CompanyProcessData> {
  const profile = await getOrCreateProfile(workspaceId)

  const existing = await db.companyProcess.findFirst({
    where: { workspaceId, domain: data.domain, name: data.name },
  })

  if (existing) {
    const existingSlugs = Array.isArray(existing.toolSlugs) ? (existing.toolSlugs as string[]) : []
    const newSlugs      = data.toolSlug && !existingSlugs.includes(data.toolSlug)
      ? [...existingSlugs, data.toolSlug]
      : existingSlugs

    const updated = await db.companyProcess.update({
      where: { id: existing.id },
      data:  {
        description:  data.description  ?? existing.description,
        isDocumented: data.isDocumented ?? existing.isDocumented,
        maturity:     data.maturity     ?? existing.maturity,
        toolSlugs:    newSlugs,
      },
    })
    return mapProcess(updated)
  }

  const created = await db.companyProcess.create({
    data: {
      workspaceId,
      profileId:    profile.id,
      domain:       data.domain,
      name:         data.name.trim().slice(0, 200),
      description:  data.description?.trim() ?? null,
      isDocumented: data.isDocumented ?? false,
      maturity:     data.maturity ?? 'informal',
      toolSlugs:    data.toolSlug ? [data.toolSlug] : [],
    },
  })
  return mapProcess(created)
}
