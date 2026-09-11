import { getSpreadsheets } from '@/app/actions/spreadsheets'
import { requireUser } from '@/lib/auth'
import { SheetList } from './_components/SheetList'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function SheetsPage({ params }: Props) {
  const [{ workspaceId }, , locale] = await Promise.all([params, requireUser(), getLocale()])
  const t = getDashboardTranslations(locale)
  const sheets = await getSpreadsheets(workspaceId)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t.sheetsTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.sheetsSubtitle}</p>
      </div>
      <SheetList workspaceId={workspaceId} initial={sheets} />
    </div>
  )
}
