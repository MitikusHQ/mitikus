/**
 * GET  /api/memory/objectives?workspaceId=...  — lista objetivos
 * POST /api/memory/objectives                  — crea un objetivo
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getObjectives, createObjective } from '@/lib/business-memory'
import type { ObjectiveStatus, ObjectivePriority } from '@/lib/business-memory'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const workspaceId = req.nextUrl.searchParams.get('workspaceId')
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId es obligatorio' }, { status: 400 })

  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { orgId: true } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!workspace) return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })

  const status = (req.nextUrl.searchParams.get('status') ?? 'active') as ObjectiveStatus
  const objectives = await getObjectives(workspaceId, status)
  return NextResponse.json(objectives)
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true, orgId: true } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  let body: {
    workspaceId:   string
    canonicalGoal?: string
    label:         string
    description?:  string
    priority?:     ObjectivePriority
    dueDate?:      string
    linkedWorkflowId?: string
  }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  const { workspaceId, label } = body
  if (!workspaceId || !label) return NextResponse.json({ error: 'workspaceId y label son obligatorios' }, { status: 400 })

  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!workspace) return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })

  const objective = await createObjective(workspaceId, {
    canonicalGoal:   body.canonicalGoal,
    label,
    description:     body.description,
    priority:        body.priority,
    dueDate:         body.dueDate ? new Date(body.dueDate) : undefined,
    linkedWorkflowId: body.linkedWorkflowId,
  })
  return NextResponse.json(objective, { status: 201 })
}
