/**
 * GET /api/memory/context?workspaceId=...
 * Devuelve el BusinessContext completo del workspace.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getBusinessContext } from '@/lib/business-memory'

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

  const context = await getBusinessContext(workspaceId)
  return NextResponse.json(context)
}
