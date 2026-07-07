/**
 * GET  /api/memory/profile?workspaceId=...  — obtiene el perfil
 * POST /api/memory/profile                  — actualiza campos del perfil
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { getOrCreateProfile, updateProfile } from '@/lib/business-memory'
import type { CompanyProfileUpdate } from '@/lib/business-memory'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const workspaceId = req.nextUrl.searchParams.get('workspaceId')
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId es obligatorio' }, { status: 400 })

  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true, orgId: true } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!workspace) return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })

  const profile = await getOrCreateProfile(workspaceId)
  return NextResponse.json(profile)
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true, orgId: true } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  let body: { workspaceId: string; update: CompanyProfileUpdate }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  const { workspaceId, update } = body
  if (!workspaceId || !update) return NextResponse.json({ error: 'workspaceId y update son obligatorios' }, { status: 400 })

  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!workspace) return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })

  const updated = await updateProfile(workspaceId, update, 'user', user.id, 1.0, null)
  return NextResponse.json(updated)
}
