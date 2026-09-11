import { getLeaves } from '@/app/actions/leaves'
import { getEmployees } from '@/app/actions/employees'
import { LeavesPanel } from './_components/LeavesPanel'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function LeavesPage({ params }: Props) {
  const [{ workspaceId }, locale] = await Promise.all([params, getLocale()])
  const t = getDashboardTranslations(locale)

  const [leaves, employees] = await Promise.all([
    getLeaves(workspaceId).catch(() => []),
    getEmployees(workspaceId).catch(() => []),
  ])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t.leavesTitle}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.leavesSubtitle}</p>
        </div>
      </div>
      <LeavesPanel workspaceId={workspaceId} leaves={leaves} employees={employees} />
    </div>
  )
}
