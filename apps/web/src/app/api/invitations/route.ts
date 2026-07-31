import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { assertCan } from '@/lib/permissions'
import { db } from '@/lib/db'
import { audit } from '@/lib/audit'
import { checkPlanLimit } from '@/lib/billing/check-plan-limit'
import { sendInvitationLinkEmail } from '@/lib/email'
import type { OrgRole } from '@prisma/client'

export const runtime = 'nodejs'

const VALID_INVITE_ROLES: OrgRole[] = ['ADMIN', 'EDITOR', 'VIEWER']
const TTL_MS = 7 * 24 * 60 * 60 * 1000

export async function POST(req: NextRequest) {
  try {
    const actor = await requireUser()
    assertCan(actor, 'manage_members', { orgId: actor.orgId, userId: actor.id })

    const body: { role?: string; email?: string } = await req.json().catch(() => ({}))
    const role = body.role as OrgRole | undefined
    const email = body.email?.trim().toLowerCase() || null

    if (!role || !VALID_INVITE_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Rol inválido. Usa ADMIN, EDITOR o VIEWER.' }, { status: 400 })
    }

    if (role === 'ADMIN' && actor.role !== 'OWNER') {
      return NextResponse.json({ error: 'Solo el propietario puede invitar administradores.' }, { status: 403 })
    }

    // El OWNER nunca está bloqueado por límites de plan — es el creador de la org
    if (actor.role !== 'OWNER') {
      const limitCheck = await checkPlanLimit(actor.orgId, 'maxUsers')
      if (!limitCheck.allowed) {
        return NextResponse.json({ error: limitCheck.message }, { status: 402 })
      }
    }

    const invitation = await db.orgInvitation.create({
      data: {
        orgId: actor.orgId,
        email,
        role,
        expiresAt: new Date(Date.now() + TTL_MS),
        createdBy: actor.id,
      },
    })

    audit({
      orgId: actor.orgId,
      actorUserId: actor.id,
      action: 'org.invitation_created',
      entityType: 'member',
      entityId: invitation.id,
      metadata: { role, email },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.mitikus.com'
    const link = `${appUrl}/invite/${invitation.token}`

    if (email) {
      const org = await db.organization.findUnique({ where: { id: actor.orgId }, select: { name: true } })
      void sendInvitationLinkEmail({
        to: email,
        orgName: org?.name ?? 'tu equipo',
        inviteUrl: link,
        expiresAt: invitation.expiresAt,
      }).catch(() => null)
    }

    return NextResponse.json({ token: invitation.token, link, expiresAt: invitation.expiresAt })
  } catch (e) {
    if ((e as Error).message?.includes('Sin permisos')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
