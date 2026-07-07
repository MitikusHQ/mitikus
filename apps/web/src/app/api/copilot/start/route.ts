import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { startCopilot } from '@/lib/business-copilot'

export const runtime    = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true },
  })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const { workspaceId, companyDescription } = body as { workspaceId?: string; companyDescription?: string }

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
  }

  // Verificar que el workspace pertenece a la organización del usuario
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })
  }

  try {
    const response = await startCopilot(workspaceId, user.id, companyDescription)
    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Error al iniciar el copilot' }, { status: 500 })
  }
}
