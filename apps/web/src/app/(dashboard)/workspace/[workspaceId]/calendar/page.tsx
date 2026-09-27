import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { getCalendarClientOptions, getCalendarItems } from '@/app/actions/calendar'
import { CalendarClient } from './_components/CalendarClient'

interface Props {
  params: Promise<{ workspaceId: string }>
}

function monthRange(date = new Date()) {
  const from = new Date(date.getFullYear(), date.getMonth(), 1)
  const to = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
  return { from, to }
}

export default async function CalendarPage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) notFound()

  const range = monthRange()
  const [items, clients] = await Promise.all([
    getCalendarItems(workspaceId, range.from.toISOString(), range.to.toISOString()),
    getCalendarClientOptions(workspaceId),
  ])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <CalendarClient
        workspaceId={workspaceId}
        initialItems={items}
        clients={clients}
        initialFrom={range.from.toISOString()}
        initialTo={range.to.toISOString()}
      />
    </div>
  )
}
