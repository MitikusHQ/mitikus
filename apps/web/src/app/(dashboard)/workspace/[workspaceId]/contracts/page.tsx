import { requireUser } from '@/lib/auth'
import { getContracts } from '@/app/actions/contracts'
import { ContractList } from './_components/ContractList'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function ContractsPage({ params }: Props) {
  await requireUser()
  const { workspaceId } = await params
  const contracts = await getContracts(workspaceId)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Contratos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {contracts.length} {contracts.length === 1 ? 'contrato' : 'contratos'}
          </p>
        </div>
      </div>
      <ContractList workspaceId={workspaceId} initial={contracts} />
    </div>
  )
}
