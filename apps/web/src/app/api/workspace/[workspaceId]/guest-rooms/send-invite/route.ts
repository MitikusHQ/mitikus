import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { sendMeetingInviteEmail } from '@/lib/email'
import { clerkClient } from '@clerk/nextjs/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  const user = await requireUser()
  const { workspaceId } = await params
  const { token, to } = await req.json() as { token: string; to: string }

  if (!to || !token) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId }, select: { id: true } })
  if (!workspace) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const room = await db.guestRoom.findUnique({ where: { token } })
  if (!room || room.expiresAt < new Date()) return NextResponse.json({ error: 'Room expired' }, { status: 404 })

  const clerk = await clerkClient()
  const clerkUser = await clerk.users.getUser(user.id)
  const fromName = ([clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.emailAddresses[0]?.emailAddress) ?? 'Tu contacto'

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mitikus.com'
  if (!process.env.RESEND_API_KEY) {
    console.error('[send-invite] RESEND_API_KEY not set')
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  try {
    await sendMeetingInviteEmail({
      to,
      fromName,
      roomLabel: room.label,
      meetUrl: `${baseUrl}/meet/${token}`,
    })
  } catch (err) {
    console.error('[send-invite] Resend error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
