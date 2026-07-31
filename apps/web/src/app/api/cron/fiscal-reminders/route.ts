import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getFiscalEvents, type LegalForm } from '@/lib/fiscal-calendar'
import { sendFiscalReminderEmail } from '@/lib/email'

const REMIND_AT_DAYS = [7, 3, 1]
const CALCULABLE     = ['303', '130', '111', '115']

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profiles = await db.companyProfile.findMany({
    where: {
      OR: [
        { legalForm: { not: null } },
        { country: { not: null } },
      ],
    },
    select: { workspaceId: true, legalForm: true, country: true },
    take:   500,
  })

  let sent = 0

  for (const profile of profiles) {
    const events = getFiscalEvents(profile.country ?? 'ES', profile.legalForm)
    const upcoming = events.filter(
      (e) => e.daysLeft !== null && REMIND_AT_DAYS.includes(e.daysLeft),
    )
    if (upcoming.length === 0) continue

    // Get workspace owner email
    const workspace = await db.workspace.findUnique({
      where:  { id: profile.workspaceId },
      select: { name: true, orgId: true },
    })
    if (!workspace) continue

    const admin = await db.user.findFirst({
      where:  { orgId: workspace.orgId, role: 'ADMIN' },
      select: { email: true },
    })
    const ownerEmail = admin?.email
    if (!ownerEmail) continue

    for (const e of upcoming) {
      const calcUrl = CALCULABLE.includes(e.modelo)
        ? `https://mitikus.com/workspace/${profile.workspaceId}/fiscal/${e.modelo}`
        : `https://mitikus.com/workspace/${profile.workspaceId}/fiscal`

      await sendFiscalReminderEmail({
        to:            ownerEmail,
        workspaceName: workspace.name,
        modelo:        e.modelo,
        titulo:        e.titulo,
        periodo:       e.periodo,
        deadline:      e.deadline.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
        daysLeft:      e.daysLeft!,
        url:           calcUrl,
      })
      sent++
    }
  }

  return NextResponse.json({ ok: true, sent })
}
