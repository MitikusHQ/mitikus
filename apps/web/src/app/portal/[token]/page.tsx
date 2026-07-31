import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getClientByPortalToken } from '@/app/actions/client-portal'

interface Props {
  params: Promise<{ token: string }>
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  DRAFT:   { label: 'Borrador',       className: 'bg-muted text-muted-foreground' },
  SENT:    { label: 'Pendiente firma', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  SIGNED:  { label: 'Firmado',        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  EXPIRED: { label: 'Expirado',       className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

export default async function ClientPortalPage({ params }: Props) {
  const { token } = await params

  const client = await getClientByPortalToken(token)
  if (!client) notFound()

  // Contratos: por email del cliente o por nombre (fallback)
  const contractsWhere = client.email
    ? { workspaceId: client.workspaceId, clientEmail: client.email }
    : { workspaceId: client.workspaceId, clientName: client.name }

  const [contracts, sharedDocs] = await Promise.all([
    db.contract.findMany({
      where: contractsWhere,
      select: {
        id: true, title: true, status: true, shareToken: true,
        createdAt: true, clientSignedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    client.email
      ? db.clientShare.findMany({
          where: { workspaceId: client.workspaceId, recipientEmail: client.email },
          select: {
            id: true, note: true, createdAt: true,
            document: { select: { id: true, title: true, category: true } },
          },
          orderBy: { createdAt: 'desc' },
        })
      : Promise.resolve([]),
  ])

  const pendingContracts = contracts.filter((c) => c.status === 'SENT')
  const signedContracts  = contracts.filter((c) => c.status === 'SIGNED')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-widest text-muted-foreground/60 uppercase">mitikus</span>
          <span className="text-xs text-muted-foreground">Portal de {client.workspace.name}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-10">
        {/* Saludo */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Hola, {client.name} 👋</h1>
          <p className="text-sm text-muted-foreground">
            Aquí tienes todo lo que {client.workspace.name} ha compartido contigo.
          </p>
        </div>

        {/* Contratos pendientes */}
        {pendingContracts.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Contratos pendientes de firma</h2>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                {pendingContracts.length}
              </span>
            </div>
            <div className="space-y-2">
              {pendingContracts.map((c) => (
                <div key={c.id} className="rounded-xl border-2 border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Enviado el {formatDate(c.createdAt)}</p>
                  </div>
                  <Link
                    href={`/contracts/sign/${c.shareToken}`}
                    className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Firmar →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sin pendientes */}
        {pendingContracts.length === 0 && contracts.length === 0 && sharedDocs.length === 0 && (
          <div className="rounded-xl border border-dashed p-10 text-center space-y-2">
            <p className="font-medium text-sm">Nada pendiente por ahora</p>
            <p className="text-xs text-muted-foreground">Cuando {client.workspace.name} comparta algo contigo, aparecerá aquí.</p>
          </div>
        )}

        {/* Documentos compartidos */}
        {sharedDocs.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-semibold">Documentos compartidos</h2>
            <div className="divide-y divide-border rounded-xl border bg-card overflow-hidden">
              {sharedDocs.map((share) => (
                <div key={share.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-lg shrink-0">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{share.document.title}</p>
                    {share.note && (
                      <p className="text-xs text-muted-foreground truncate">{share.note}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{formatDate(share.createdAt)}</p>
                  </div>
                  {share.document.category && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                      {share.document.category}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contratos firmados */}
        {signedContracts.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-muted-foreground">Contratos firmados</h2>
            <div className="divide-y divide-border rounded-xl border bg-card overflow-hidden">
              {signedContracts.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-lg shrink-0">✅</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Firmado el {c.clientSignedAt ? formatDate(c.clientSignedAt) : '—'}
                    </p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 shrink-0">
                    Firmado
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t mt-16">
        <div className="max-w-2xl mx-auto px-6 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Portal gestionado por{' '}
            <span className="font-medium">{client.workspace.name}</span>
            {' '}· Powered by{' '}
            <a href="https://www.mitikus.com" className="text-primary hover:underline">MITIKUS</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
