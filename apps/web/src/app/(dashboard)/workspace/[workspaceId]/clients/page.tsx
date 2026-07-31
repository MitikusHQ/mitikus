import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArchiveButton } from './_components/ArchiveButton'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function ClientsPage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const [workspace, clients] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } }),
    db.client.findMany({
      where: { workspaceId, isArchived: false },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  if (!workspace) notFound()

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold">Clientes</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Empresas o personas a las que prestas servicio — vincula herramientas y misiones a cada una</p>
        </div>
        <Link
          href={`/workspace/${workspaceId}/clients/new`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          + Nuevo cliente
        </Link>
      </div>

      <div>
        {clients.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-12 text-center space-y-5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl mx-auto">
              🏢
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-base">Añade tu primer cliente</p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Vincula cada auditoría, documento y contrato a una empresa. Todo ordenado, siempre localizable.
              </p>
            </div>
            <Link
              href={`/workspace/${workspaceId}/clients/new`}
              className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              + Añadir cliente
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border divide-y">
            {clients.map((client) => (
              <div key={client.id} className="px-5 py-4 flex items-center justify-between">
                <div className="space-y-0.5 min-w-0">
                  <Link
                    href={`/workspace/${workspaceId}/clients/${client.id}`}
                    className="font-medium text-sm hover:text-primary transition-colors"
                  >
                    {client.name}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {client.email && <span>{client.email}</span>}
                    {client.email && client.sector && <span>·</span>}
                    {client.sector && <span>{client.sector}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <Link
                    href={`/workspace/${workspaceId}/clients/${client.id}`}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Ver expediente
                  </Link>
                  <Link
                    href={`/workspace/${workspaceId}/clients/${client.id}/edit`}
                    className="text-xs text-primary hover:underline"
                  >
                    Editar
                  </Link>
                  <ArchiveButton
                    workspaceId={workspaceId}
                    clientId={client.id}
                    clientName={client.name}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
