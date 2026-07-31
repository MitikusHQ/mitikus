import { notFound } from 'next/navigation'
import Link from 'next/link'
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
    <>
      <div className="px-6 py-2.5 border-b bg-background">
        <Link href={`/workspace/${workspaceId}/contracts`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Contratos
        </Link>
      </div>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 4rem - 41px)' }}>
        <ContractViewerClient contract={contract} workspaceId={workspaceId} />
      </div>
    </>
  )
}
