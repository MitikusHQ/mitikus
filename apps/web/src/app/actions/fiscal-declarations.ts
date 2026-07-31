'use server'

import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface SaveDeclarationInput {
  workspaceId: string
  modelo: string
  periodo: string
  year: number
  data: Record<string, string>
  resultado: number
  notas?: string
}

export async function saveFiscalDeclaration(input: SaveDeclarationInput) {
  const user = await requireUser()
  const workspace = await db.workspace.findFirst({
    where: { id: input.workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) throw new Error('Workspace no encontrado')

  const declaration = await db.fiscalDeclaration.upsert({
    where: {
      workspaceId_modelo_periodo_year: {
        workspaceId: input.workspaceId,
        modelo:      input.modelo,
        periodo:     input.periodo,
        year:        input.year,
      },
    },
    update: {
      data:      input.data,
      resultado: input.resultado,
      notas:     input.notas ?? null,
      status:    'borrador',
    },
    create: {
      workspaceId: input.workspaceId,
      modelo:      input.modelo,
      periodo:     input.periodo,
      year:        input.year,
      data:        input.data,
      resultado:   input.resultado,
      notas:       input.notas ?? null,
      status:      'borrador',
    },
  })

  revalidatePath(`/workspace/${input.workspaceId}/fiscal`)
  return declaration
}

export async function markDeclarationPresented(workspaceId: string, declarationId: string) {
  const user = await requireUser()
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) throw new Error('Workspace no encontrado')

  const declaration = await db.fiscalDeclaration.update({
    where: { id: declarationId },
    data:  { status: 'presentada' },
  })

  revalidatePath(`/workspace/${workspaceId}/fiscal`)
  return declaration
}

export async function getFiscalDeclaration(
  workspaceId: string,
  modelo: string,
  periodo: string,
  year: number,
) {
  const user = await requireUser()
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) return null

  return db.fiscalDeclaration.findUnique({
    where: {
      workspaceId_modelo_periodo_year: { workspaceId, modelo, periodo, year },
    },
  })
}

export async function listFiscalDeclarations(workspaceId: string) {
  const user = await requireUser()
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) return []

  return db.fiscalDeclaration.findMany({
    where:   { workspaceId },
    orderBy: [{ year: 'desc' }, { periodo: 'desc' }, { modelo: 'asc' }],
  })
}
