import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { assertCan } from '@/lib/permissions'
import { db } from '@/lib/db'
import { audit } from '@/lib/audit'

export const runtime = 'nodejs'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const actor = await requireUser()
    assertCan(actor, 'manage_members', { orgId: actor.orgId, userId: actor.id })

    const invitation = await db.orgInvitation.findFirst({
      where: { token, orgId: actor.orgId, acceptedAt: null, revokedAt: null },
    })
    if (!invitation) {
      return NextResponse.json({ error: 'Invitación no encontrada o ya no está activa' }, { status: 404 })
    }

    await db.orgInvitation.update({
      where: { id: invitation.id },
      data: { revokedAt: new Date() },
    })

    audit({
      orgId: actor.orgId,
      actorUserId: actor.id,
      action: 'org.invitation_revoked',
      entityType: 'member',
      entityId: invitation.id,
      metadata: { token },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    if ((e as Error).message?.includes('Sin permisos')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
