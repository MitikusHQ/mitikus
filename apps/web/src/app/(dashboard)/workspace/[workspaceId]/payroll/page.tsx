import { getPayrolls } from '@/app/actions/payrolls'
import { getEmployees } from '@/app/actions/employees'
import { PayrollTable } from './_components/PayrollTable'

interface Props {
  params: Promise<{ workspaceId: string }>
  searchParams: Promise<{ year?: string }>
}

export default async function PayrollPage({ params, searchParams }: Props) {
  const { workspaceId } = await params
  const { year: yearStr } = await searchParams
  const year = yearStr ? parseInt(yearStr) : new Date().getFullYear()

  const [payrolls, employees] = await Promise.all([
    getPayrolls(workspaceId, year).catch(() => []),
    getEmployees(workspaceId).catch(() => []),
  ])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Nóminas</h1>
          <p className="text-muted-foreground text-sm mt-1">Generación y aprobación de nóminas mensuales</p>
        </div>
      </div>
      <PayrollTable workspaceId={workspaceId} payrolls={payrolls} employees={employees} year={year} />
    </div>
  )
}
