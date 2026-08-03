import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { getInvoices } from '@/app/actions/invoices'
import { InvoicesClient } from './_components/InvoicesClient'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function InvoicesPage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) notFound()

  const [invoices, rawClients] = await Promise.all([
    getInvoices(workspaceId),
    db.client.findMany({
      where: { workspaceId, isArchived: false },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
  ])
  const clients = rawClients.map((c) => ({ ...c, email: c.email ?? undefined }))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Facturas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Crea y gestiona tus facturas. Descarga el PDF listo para enviar.
        </p>
      </div>
      <InvoicesClient
        workspaceId={workspaceId}
        initialInvoices={invoices}
        clients={clients}
      />
    </div>
  )
}
