import { notFound } from 'next/navigation'
import { getContractByToken } from '@/app/actions/contracts'
import { PublicSignClient } from './_components/PublicSignClient'

interface Props {
  params: Promise<{ token: string }>
}

export default async function PublicSignPage({ params }: Props) {
  const { token } = await params

  let contract
  try {
    contract = await getContractByToken(token)
  } catch {
    notFound()
  }

  if (!contract) notFound()

  if (contract.status === 'SIGNED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-semibold mb-2">Contrato ya firmado</h1>
          <p className="text-sm text-muted-foreground">
            Este contrato ya ha sido firmado por ambas partes.
          </p>
        </div>
      </div>
    )
  }

  return (
    <PublicSignClient
      shareToken={token}
      contractTitle={contract.title}
      pdfDataArray={contract.pdfDataArray}
      workspaceName={contract.creatorName}
    />
  )
}
