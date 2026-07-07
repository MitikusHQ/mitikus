import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { sendMessage } from '@/lib/business-copilot'

export const runtime    = 'nodejs'
export const maxDuration = 60

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
  const { conversationId, workspaceId, message } = body as {
    conversationId?: string
    workspaceId?:    string
    message?:        string
  }

  if (!conversationId || !workspaceId || !message) {
    return NextResponse.json(
      { error: 'conversationId, workspaceId and message are required' },
      { status: 400 },
    )
  }

  // Verificar que el workspace pertenece a la organización del usuario (IMP-1: anti-IDOR)
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })
  }

  try {
    const response = await sendMessage(conversationId, workspaceId, user.id, message)
    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Error al procesar el mensaje' }, { status: 500 })
  }
}
