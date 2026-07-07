'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { validateToolSchema } from '@protools/schema'
import { ToolCategory } from '@prisma/client'
import type { Prisma } from '@prisma/client'

const CATEGORY_MAP: Record<string, ToolCategory> = {
  audit: 'AUDIT',
  evaluation: 'EVALUATION',
  checklist: 'CHECKLIST',
  crm: 'CRM',
  report: 'REPORT',
  hr: 'HR',
  operations: 'OPERATIONS',
  finance: 'FINANCE',
  custom: 'CUSTOM',
}

async function generateUniqueSlug(baseSlug: string, orgId: string): Promise<string> {
  const existing = await db.toolDefinition.findUnique({
    where: { slug_orgId: { slug: baseSlug, orgId } },
  })
  if (!existing) return baseSlug

  for (let i = 2; i <= 99; i++) {
    const slug = `${baseSlug}-${i}`
    const exists = await db.toolDefinition.findUnique({
      where: { slug_orgId: { slug, orgId } },
    })
    if (!exists) return slug
  }

  return `${baseSlug}-${Date.now()}`
}

export async function saveGeneratedTool(
  workspaceId: string,
  generationRequestId: string,
  schema: unknown,
): Promise<{ error: string } | { redirectTo: string }> {
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
  if (!workspace) return { error: 'Workspace no encontrado' }

  const result = validateToolSchema(schema)
  if (!result.success) return { error: 'Schema inválido. Intenta regenerar la herramienta.' }

  const validated = result.data
  const category = CATEGORY_MAP[validated.category]
  if (!category) return { error: 'Categoría no reconocida' }

  const slug = await generateUniqueSlug(validated.slug, user.orgId)

  const definition = await db.toolDefinition.create({
    data: {
      slug,
      name: validated.name,
      description: validated.description,
      category,
      schema: validated as unknown as Prisma.InputJsonValue,
      isPublic: false,
      orgId: user.orgId,
      createdBy: user.id,
    },
  })

  const instance = await db.toolInstance.create({
    data: {
      toolDefinitionId: definition.id,
      workspaceId,
      name: validated.name,
      createdBy: user.id,
    },
  })

  await db.generationRequest.updateMany({
    where: { id: generationRequestId, userId: user.id },
    data: { accepted: true, toolDefinitionId: definition.id },
  })

  return { redirectTo: `/workspace/${workspaceId}/tools/${instance.id}` }
}

export async function discardGenerationRequest(
  generationRequestId: string,
): Promise<void> {
  const { userId } = await auth()
  if (!userId) return

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  })
  if (!user) return

  await db.generationRequest.updateMany({
    where: { id: generationRequestId, userId: user.id },
    data: { errorMessage: 'Descartada por el usuario' },
  })
}
