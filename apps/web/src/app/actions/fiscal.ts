'use server'

import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import type { LegalForm, Country } from '@/lib/fiscal-calendar'

export async function setFiscalConfig(workspaceId: string, country: Country, legalForm?: LegalForm) {
  const user = await requireUser()

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) throw new Error('Workspace no encontrado')

  await db.companyProfile.upsert({
    where:  { workspaceId },
    create: { workspaceId, country, legalForm: legalForm ?? null },
    update: { country, legalForm: legalForm ?? null },
  })
}

// Alias for backward compat with LegalFormPicker (ES only)
export async function setLegalForm(workspaceId: string, legalForm: LegalForm) {
  return setFiscalConfig(workspaceId, 'ES', legalForm)
}

export async function updateNif(workspaceId: string, nif: string) {
  const user = await requireUser()
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) throw new Error('Workspace no encontrado')

  await db.companyProfile.upsert({
    where:  { workspaceId },
    create: { workspaceId, nif: nif.trim().toUpperCase() || null },
    update: { nif: nif.trim().toUpperCase() || null },
  })
}
