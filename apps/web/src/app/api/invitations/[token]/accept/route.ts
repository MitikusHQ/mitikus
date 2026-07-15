import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { audit } from '@/lib/audit'

export const runtime = 'nodejs'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const user = await requireUser()

    const invitation = await db.orgInvitation.findUnique({ where: { token } })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
    }
    if (invitation.revokedAt) {
      return NextResponse.json({ error: 'Esta invitación ha sido revocada' }, { status: 410 })
    }
    if (invitation.acceptedAt) {
      return NextResponse.json({ error: 'Esta invitación ya fue aceptada' }, { status: 410 })
    }
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Esta invitación ha caducado' }, { status: 410 })
    }

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { orgId: invitation.orgId, role: invitation.role },
      }),
      db.orgInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ])

    audit({
      orgId: invitation.orgId,
      actorUserId: user.id,
      action: 'org.invitation_accepted',
      entityType: 'member',
      entityId: invitation.id,
      metadata: { role: invitation.role },
    })

    return NextResponse.json({ ok: true, orgId: invitation.orgId })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
