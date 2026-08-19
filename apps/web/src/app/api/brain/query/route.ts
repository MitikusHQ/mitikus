import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { queryBrain } from '@/lib/brain/brain-service'
import { checkPlanLimit } from '@/lib/billing/check-plan-limit'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'IA no configurada. Añade ANTHROPIC_API_KEY a .env.local.' },
      { status: 503 },
    )
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  let body: { workspaceId?: string; query?: string }
  try {
    body = (await req.json()) as { workspaceId?: string; query?: string }
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { workspaceId, query } = body
  if (!workspaceId || !query?.trim()) {
    return NextResponse.json(
      { error: 'workspaceId y query son obligatorios' },
      { status: 400 },
    )
  }

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })
  }

  const limitCheck = await checkPlanLimit(user.orgId, 'brainQueriesPerMonth')
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: limitCheck.message }, { status: 429 })
  }

  const result = await queryBrain(workspaceId, query.trim(), user.orgId)

  await db.brainQuery.create({
    data: {
      workspaceId,
      orgId: user.orgId,
      userId: user.id,
      query: query.trim(),
      sources: result.sources?.length ?? 0,
    },
  })

  return NextResponse.json(result)
}
