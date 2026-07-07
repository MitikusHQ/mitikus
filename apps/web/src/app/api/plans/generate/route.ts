import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { audit } from '@/lib/audit'
import { buildExecutionPlans, generateWorkflowFromPlan, validatePlanPublic } from '@/lib/planning-engine'
import type { IntentResult } from '@/lib/intent-engine/types'

export const runtime    = 'nodejs'
export const maxDuration = 30

interface RequestBody {
  intentResult: IntentResult
  workspaceId:  string
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const user = await db.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true, orgId: true },
  })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { intentResult, workspaceId } = body

  if (!intentResult || !workspaceId) {
    return NextResponse.json(
      { error: 'intentResult y workspaceId son obligatorios' },
      { status: 400 },
    )
  }

  // Validar que el workspace pertenece al org del usuario
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })

  // Validación mínima del IntentResult recibido
  if (typeof intentResult.rawGoal !== 'string' || intentResult.rawGoal.length < 3) {
    return NextResponse.json({ error: 'intentResult.rawGoal inválido' }, { status: 422 })
  }

  try {
    const start  = Date.now()
    const result = await buildExecutionPlans(intentResult)

    // Añadir workflow del plan recomendado
    const bestWorkflow = generateWorkflowFromPlan(result.best)

    // Validar el plan recomendado
    const validation = validatePlanPublic(result.best)

    audit({
      orgId:       user.orgId,
      workspaceId,
      actorUserId: user.id,
      action:      'plan.generated',
      entityType:  'planning_engine',
      entityId:    result.requestId,
      result:      'success',
      metadata:    {
        canonicalGoal:   result.canonicalGoal,
        domain:          result.domain,
        plansGenerated:  result.plans.length,
        bestStrategy:    result.best.strategyType,
        bestScore:       result.best.score.total,
        planningMs:      Date.now() - start,
      },
    })

    return NextResponse.json({
      requestId:    result.requestId,
      canonicalGoal: result.canonicalGoal,
      domain:       result.domain,
      plans:        result.plans,
      best:         result.best,
      bestWorkflow,
      validation,
      planningMs:   result.planningMs,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido'

    audit({
      orgId:       user.orgId,
      workspaceId,
      actorUserId: user.id,
      action:      'plan.generated',
      entityType:  'planning_engine',
      entityId:    'unknown',
      result:      'failure',
      metadata:    { errorMessage },
    })

    return NextResponse.json(
      { error: 'Error al generar el plan. Inténtalo de nuevo.' },
      { status: 500 },
    )
  }
}
