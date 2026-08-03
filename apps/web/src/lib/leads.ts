'use server'

import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { LeadStatus } from '@prisma/client'

export async function getLeads(workspaceId: string) {
  const user = await requireUser()
  const ws = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!ws) throw new Error('No autorizado')

  return db.workspaceLead.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const user = await requireUser()
  const lead = await db.workspaceLead.findUnique({ where: { id: leadId }, include: { workspace: true } })
  if (!lead || lead.workspace.orgId !== user.orgId) throw new Error('No autorizado')

  await db.workspaceLead.update({ where: { id: leadId }, data: { status } })
  revalidatePath(`/workspace/${lead.workspaceId}/leads`)
}

export async function updateLeadNotes(leadId: string, notes: string) {
  const user = await requireUser()
  const lead = await db.workspaceLead.findUnique({ where: { id: leadId }, include: { workspace: true } })
  if (!lead || lead.workspace.orgId !== user.orgId) throw new Error('No autorizado')

  await db.workspaceLead.update({ where: { id: leadId }, data: { notes } })
  revalidatePath(`/workspace/${lead.workspaceId}/leads`)
}

export async function convertLeadToClient(leadId: string) {
  const user = await requireUser()
  const lead = await db.workspaceLead.findUnique({ where: { id: leadId }, include: { workspace: true } })
  if (!lead || lead.workspace.orgId !== user.orgId) throw new Error('No autorizado')

  const client = await db.client.create({
    data: {
      workspaceId: lead.workspaceId,
      name: lead.name,
      email: lead.email ?? undefined,
      sector: lead.company ?? undefined,
      notes: lead.phone ? `Teléfono: ${lead.phone}` : undefined,
    },
  })

  await db.workspaceLead.update({
    where: { id: leadId },
    data: { status: 'CUALIFICADO', convertedToClientId: client.id },
  })

  revalidatePath(`/workspace/${lead.workspaceId}/leads`)
  revalidatePath(`/workspace/${lead.workspaceId}/clients`)
  return client
}

export async function deleteLead(leadId: string) {
  const user = await requireUser()
  const lead = await db.workspaceLead.findUnique({ where: { id: leadId }, include: { workspace: true } })
  if (!lead || lead.workspace.orgId !== user.orgId) throw new Error('No autorizado')

  await db.workspaceLead.delete({ where: { id: leadId } })
  revalidatePath(`/workspace/${lead.workspaceId}/leads`)
}
