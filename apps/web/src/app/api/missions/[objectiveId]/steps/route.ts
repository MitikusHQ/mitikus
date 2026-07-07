/**
 * GET  /api/missions/[objectiveId]/steps  — lista pasos de una misión
 * POST /api/missions/[objectiveId]/steps  — crea un paso
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getSteps, createStep } from '@/lib/missions/mission-steps'
import type { StepPriority, ResponsibleActor } from '@/lib/missions/types'

export const runtime = 'nodejs'

async function resolveAccess(
  userId: string,
  objectiveId: string,
): Promise<{ workspaceId: string } | null> {
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { orgId: true },
  })
  if (!user) return null

  const objective = await db.companyObjective.findFirst({
    where: { id: objectiveId, workspace: { orgId: user.orgId } },
    select: { workspaceId: true },
  })
  return objective ? { workspaceId: objective.workspaceId } : null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ objectiveId: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { objectiveId } = await params
  const access = await resolveAccess(userId, objectiveId)
  if (!access) return NextResponse.json({ error: 'Misión no encontrada' }, { status: 404 })

  const steps = await getSteps(objectiveId, access.workspaceId)
  return NextResponse.json(steps)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ objectiveId: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { objectiveId } = await params
  const access = await resolveAccess(userId, objectiveId)
  if (!access) return NextResponse.json({ error: 'Misión no encontrada' }, { status: 404 })

  let body: {
    title:            string
    description?:     string
    priority?:        StepPriority
    responsibleActor?: ResponsibleActor
    estimatedMinutes?: number
    sortOrder?:       number
    recommendedCategory?:  string
    linkedToolInstanceId?: string
  }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'title es obligatorio' }, { status: 400 })
  }

  const step = await createStep(objectiveId, access.workspaceId, body)
  return NextResponse.json(step, { status: 201 })
}
