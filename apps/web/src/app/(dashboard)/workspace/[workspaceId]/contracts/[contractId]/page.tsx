import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { getContract } from '@/app/actions/contracts'
import { ContractViewerClient } from './_components/ContractViewerClient'

interface Props {
  params: Promise<{ workspaceId: string; contractId: string }>
}

export default async function ContractPage({ params }: Props) {
  const { id: userId } = await requireUser()
  const { workspaceId, contractId } = await params

  let contract
  try {
    contract = await getContract(workspaceId, contractId)
  } catch {
    notFound()
  }

  if (!contract) notFound()

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <ContractViewerClient contract={contract} workspaceId={workspaceId} />
    </div>
  )
}
