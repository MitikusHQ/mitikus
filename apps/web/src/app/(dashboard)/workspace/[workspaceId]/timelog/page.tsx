import { requireUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getTodayEntry, getWeekEntries } from '@/app/actions/timelog'
import { ClockWidget } from '../today/_components/ClockWidget'
import { WeekTable } from './_components/WeekTable'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  params: Promise<{ workspaceId: string }>
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function TimelogPage({ params }: Props) {
  const [{ workspaceId }, user, locale] = await Promise.all([params, requireUser(), getLocale()])
  const t = getDashboardTranslations(locale)

  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!workspace) notFound()

  const weekStart = getMonday(new Date())

  const [entries, todayEntry] = await Promise.all([
    getWeekEntries(workspaceId, weekStart),
    getTodayEntry(workspaceId, user.id),
  ])

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{t.timelogTitle}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t.timelogSubtitle}</p>
      </div>

      <ClockWidget workspaceId={workspaceId} initialEntry={todayEntry} locale={locale} />

      <WeekTable
        workspaceId={workspaceId}
        initialEntries={entries}
        weekStart={weekStart.toISOString()}
        locale={locale}
      />
    </div>
  )
}
