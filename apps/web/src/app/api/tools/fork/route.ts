import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getPlanLimits } from '@/lib/plan-limits'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

const bodySchema = z.object({
  toolDefinitionId: z.string().min(1),
  workspaceId: z.string().min(1),
  searchId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const { toolDefinitionId, workspaceId, searchId } = parsed.data

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true, trialPlan: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const original = await db.toolDefinition.findUnique({
    where: { id: toolDefinitionId },
  })
  if (!original) return NextResponse.json({ error: 'Tool not found' }, { status: 404 })

  // Security: only public tools or tools from own org can be forked
  if (!original.isPublic && original.orgId !== user.orgId) {
    return NextResponse.json({ error: 'Not authorized to fork this tool' }, { status: 403 })
  }

  // Plan limits
  const planLimits = getPlanLimits(user.trialPlan)
  if (planLimits.maxToolsInstalled === 0) {
    return NextResponse.json({ error: 'Account blocked for beta' }, { status: 403 })
  }
  const installedCount = await db.toolInstance.count({
    where: { workspaceId, status: 'ACTIVE' },
  })
  if (installedCount >= planLimits.maxToolsInstalled) {
    return NextResponse.json(
      { error: `Plan limit reached (${planLimits.maxToolsInstalled} tools)` },
      { status: 403 },
    )
  }

  // Generate a unique slug for the fork within this org
  const baseSlug = `fork-${original.slug}`.slice(0, 95)
  let slug = baseSlug
  for (let i = 2; i <= 99; i++) {
    const exists = await db.toolDefinition.findUnique({
      where: { slug_orgId: { slug, orgId: user.orgId } },
    })
    if (!exists) break
    slug = `${baseSlug}-${i}`
  }

  // Clone schema, update metadata fields
  const originalSchema = original.schema as Record<string, unknown>
  const forkedSchema: Record<string, unknown> = {
    ...originalSchema,
    id: crypto.randomUUID(),
    slug,
    isPublic: false,
    createdBy: user.id,
  }

  const definition = await db.toolDefinition.create({
    data: {
      slug,
      name: original.name,
      description: original.description,
      category: original.category,
      schema: forkedSchema as Prisma.InputJsonValue,
      isPublic: false,
      orgId: user.orgId,
      createdBy: user.id,
    },
  })

  const instance = await db.toolInstance.create({
    data: {
      toolDefinitionId: definition.id,
      workspaceId,
      name: original.name,
      createdBy: user.id,
    },
  })

  // Update metrics record (non-blocking)
  if (searchId) {
    void db.registrySearch
      .update({ where: { id: searchId }, data: { action: 'fork', toolDefinitionId: definition.id } })
      .catch(() => {})
  }

  return NextResponse.json({
    redirectTo: `/workspace/${workspaceId}/tools/${instance.id}`,
  })
}
