import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { audit } from '@/lib/audit'
import { sendInviteWelcomeEmail } from '@/lib/email'

export const runtime = 'nodejs'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const user = await requireUser()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mitikus.com'

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
    if (invitation.email !== null && invitation.email !== user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Esta invitación no está dirigida a tu cuenta' }, { status: 403 })
    }

    const previousOrgId = user.orgId

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

    // Limpiar org anterior si quedó sin usuarios (org auto-creada al registrarse)
    if (previousOrgId !== invitation.orgId) {
      const remaining = await db.user.count({ where: { orgId: previousOrgId } })
      if (remaining === 0) {
        await db.organization.delete({ where: { id: previousOrgId } }).catch(() => null)
      }
    }

    audit({
      orgId: invitation.orgId,
      actorUserId: user.id,
      action: 'org.invitation_accepted',
      entityType: 'member',
      entityId: invitation.id,
      metadata: { role: invitation.role },
    })

    // Bienvenida al invitado — fire-and-forget, no bloqueamos la respuesta
    void (async () => {
      try {
        const org = await db.organization.findUnique({
          where: { id: invitation.orgId },
          select: {
            name: true,
            workspaces: { take: 1, select: { id: true } },
          },
        })
        if (!org) return

        const workspaceId = org.workspaces[0]?.id
        const workspaceUrl = workspaceId
          ? `${appUrl}/workspace/${workspaceId}`
          : appUrl

        if (!user.inviteWelcomeSentAt) {
          await sendInviteWelcomeEmail({
            to: user.email,
            userName: user.name,
            orgName: org.name,
            workspaceUrl,
          })
          await db.user.update({
            where: { id: user.id },
            data: { inviteWelcomeSentAt: new Date() },
          })
        }
      } catch {
        // no interrumpimos el flujo principal si falla el email
      }
    })()

    const newOrg = await db.organization.findUnique({
      where: { id: invitation.orgId },
      select: { workspaces: { take: 1, select: { id: true } } },
    })
    const workspaceId = newOrg?.workspaces[0]?.id
    const workspaceUrl = workspaceId ? `${appUrl}/workspace/${workspaceId}` : appUrl

    return NextResponse.json({ ok: true, orgId: invitation.orgId, workspaceUrl })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
