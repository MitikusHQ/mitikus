import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { queryBrain } from '@/lib/brain/brain-service'
import { checkPlanLimit } from '@/lib/billing/check-plan-limit'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
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
  if (query.trim().length > 500) {
    return NextResponse.json(
      { error: 'La consulta no puede superar los 500 caracteres' },
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

  let result
  try {
    result = await queryBrain(workspaceId, query.trim(), user.orgId)
  } catch (err) {
    console.error('[Brain] query failed:', err)
    return NextResponse.json(
      { error: 'Brain no pudo responder ahora mismo. Revisa la configuración de IA o inténtalo de nuevo.' },
      { status: 500 },
    )
  }

  // CLOUD2 — persist full audit record in a transaction
  try {
    await db.$transaction(async (tx) => {
      const record = await tx.brainQuery.create({
        data: {
          workspaceId,
          orgId: user.orgId,
          userId: user.id,
          query: query.trim(),
          normalizedQuery: query.trim(), // cloud Brain has no normalization step
          mode: result.mode,
          answer: result.answer,
          evidenceCount: result.sources.length,
          warnings: [],                  // cloud Brain has no warnings system yet
          sources: result.sources.length,
        },
      })

      if (result.sources.length > 0) {
        await tx.brainSource.createMany({
          data: result.sources.map((s) => ({
            brainQueryId: record.id,
            sourceType: s.type,
            sourceId: s.id,
            title: s.title,
            excerpt: s.excerpt,
            score: s.score,
            origin: s.type === 'help' ? 'product-help' : 'cloud-memory',
          })),
        })
      }
    })
  } catch (err) {
    console.error('[Brain] failed to persist query:', err)
  }

  return NextResponse.json(result)
}

