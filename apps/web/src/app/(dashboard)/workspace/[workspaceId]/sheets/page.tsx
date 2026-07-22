import { getSpreadsheets } from '@/app/actions/spreadsheets'
import { requireUser } from '@/lib/auth'
import { SheetList } from './_components/SheetList'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function SheetsPage({ params }: Props) {
  const [{ workspaceId }] = await Promise.all([params, requireUser()])
  const sheets = await getSpreadsheets(workspaceId)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Hojas de cálculo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sube .xlsx existentes o crea hojas desde cero
        </p>
      </div>
      <SheetList workspaceId={workspaceId} initial={sheets} />
    </div>
  )
}
