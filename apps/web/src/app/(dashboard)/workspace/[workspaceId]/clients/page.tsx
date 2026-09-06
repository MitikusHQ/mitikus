import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArchiveButton } from './_components/ArchiveButton'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations, type DashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  params: Promise<{ workspaceId: string }>
}

function clientTypeLabels(t: DashboardTranslations): Record<string, string> {
  return {
    client: t.clientsTypeClient,
    company: t.clientsTypeCompany,
    freelancer: t.clientsTypeFreelancer,
    individual: t.clientsTypeIndividual,
    patient: t.clientsTypePatient,
    student: t.clientsTypeStudent,
    athlete: t.clientsTypeAthlete,
    event: t.clientsTypeEvent,
  }
}

export default async function ClientsPage({ params }: Props) {
  const [{ workspaceId }, user, locale] = await Promise.all([params, requireUser(), getLocale()])
  const t = getDashboardTranslations(locale)
  const typeLabels = clientTypeLabels(t)

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
          <h1 className="text-xl font-semibold">{t.clientsTitle}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t.clientsDescription}</p>
        </div>
        <Link
          href={`/workspace/${workspaceId}/clients/new`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          + {t.clientsNew}
        </Link>
      </div>

      <div>
        {clients.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-12 text-center space-y-5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl mx-auto">
              🏢
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-base">{t.clientsEmptyTitle}</p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {t.clientsEmptyDescription}
              </p>
            </div>
            <Link
              href={`/workspace/${workspaceId}/clients/new`}
              className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              + {t.clientsAdd}
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
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {typeLabels[client.clientType] ?? t.clientsTypeClient}
                    </span>
                    {client.contactName && <span>{t.clientsContactPrefix}: {client.contactName}</span>}
                    {client.contactName && client.email && <span>·</span>}
                    {client.email && <span>{client.email}</span>}
                    {(client.contactName || client.email) && client.sector && <span>·</span>}
                    {client.sector && <span>{client.sector}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <Link
                    href={`/workspace/${workspaceId}/clients/${client.id}`}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t.clientsViewDossier}
                  </Link>
                  <Link
                    href={`/workspace/${workspaceId}/clients/${client.id}/edit`}
                    className="text-xs text-primary hover:underline"
                  >
                    {t.clientsEdit}
                  </Link>
                  <ArchiveButton
                    workspaceId={workspaceId}
                    clientId={client.id}
                    clientName={client.name}
                    locale={locale}
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
