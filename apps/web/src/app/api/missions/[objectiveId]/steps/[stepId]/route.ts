/**
 * PATCH  /api/missions/[objectiveId]/steps/[stepId]  — actualiza un paso
 * DELETE /api/missions/[objectiveId]/steps/[stepId]  — elimina un paso
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { updateStep, deleteStep } from '@/lib/missions/mission-steps'
import type { StepStatus, StepPriority, ResponsibleActor } from '@/lib/missions/types'

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ objectiveId: string; stepId: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { objectiveId, stepId } = await params
  const access = await resolveAccess(userId, objectiveId)
  if (!access) return NextResponse.json({ error: 'Misión no encontrada' }, { status: 404 })

  let body: {
    title?:           string
    description?:     string
    status?:          StepStatus
    priority?:        StepPriority
    responsibleActor?: ResponsibleActor
    estimatedMinutes?: number
    sortOrder?:       number
    assignedUserId?:  string | null
    recommendedCategory?:  string
    linkedToolInstanceId?: string
    resultNote?:      string
  }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const updated = await updateStep(stepId, access.workspaceId, body)
  if (!updated) return NextResponse.json({ error: 'Paso no encontrado' }, { status: 404 })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ objectiveId: string; stepId: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { objectiveId, stepId } = await params
  const access = await resolveAccess(userId, objectiveId)
  if (!access) return NextResponse.json({ error: 'Misión no encontrada' }, { status: 404 })

  const ok = await deleteStep(stepId, access.workspaceId)
  if (!ok) return NextResponse.json({ error: 'Paso no encontrado' }, { status: 404 })

  return new NextResponse(null, { status: 204 })
}
