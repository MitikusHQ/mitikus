import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { getLocale } from '@/i18n/locale'
import { MeetingsClient } from './_components/MeetingsClient'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function MeetingsPage({ params }: Props) {
  const [{ workspaceId }, user, locale] = await Promise.all([params, requireUser(), getLocale()])

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) return <p className="p-8 text-sm text-muted-foreground">Workspace no encontrado.</p>

  const rooms = await db.guestRoom.findMany({
    where: { workspaceId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.mitikus.com').replace(/\/$/, '')

  return (
    <MeetingsClient
      workspaceId={workspaceId}
      userId={user.id}
      initialRooms={rooms}
      baseUrl={baseUrl}
      locale={locale}
    />
  )
}
