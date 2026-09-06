import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatCostEUR } from '@/lib/ai-cost'
import { getFolderTree } from '@/app/actions/files'
import { ExecutionStatusBadge } from '../../tools/[instanceId]/_components/ExecutionStatusBadge'
import { PortalLinkButton } from './_components/PortalLinkButton'
import { ClientFilesSection } from './_components/ClientFilesSection'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations, type DashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'

interface Props {
  params: Promise<{ workspaceId: string; clientId: string }>
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

function formatDate(d: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

function formatDateShort(d: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export default async function ClientDossierPage({ params }: Props) {
  const [{ workspaceId, clientId }, user, locale] = await Promise.all([params, requireUser(), getLocale()])
  const t = getDashboardTranslations(locale)
  const typeLabels = clientTypeLabels(t)

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) notFound()

  const client = await db.client.findFirst({
    where: { id: clientId, workspaceId },
  })
  if (!client) notFound()
  const clientMeta = [
    { label: t.clientsTypeLabel, value: typeLabels[client.clientType] ?? t.clientsTypeClient },
    client.contactName ? { label: t.clientsContactPrefix, value: client.contactName } : null,
    client.email ? { label: 'Email', value: client.email } : null,
    client.phone ? { label: t.clientsPhone, value: client.phone } : null,
    client.sector ? { label: t.clientsSector, value: client.sector } : null,
    { label: t.clientsSince, value: formatDateShort(client.createdAt, locale) },
  ].filter(Boolean) as Array<{ label: string; value: string }>
  const clientLocation = [client.postalCode, client.city, client.province].filter(Boolean).join(' ')
  const hasFiscalData = Boolean(client.taxId || client.fiscalAddress || clientLocation || client.country)

  // Herramientas vinculadas a este cliente
  const instances = await db.toolInstance.findMany({
    where: { clientId, workspaceId, status: 'ACTIVE' },
    include: {
      toolDefinition: { select: { name: true, category: true } },
      toolExecutions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, status: true, createdAt: true, estimatedCostEUR: true },
      },
      _count: { select: { toolExecutions: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Últimas 30 ejecuciones de herramientas de este cliente
  const recentExecutions = await db.toolExecution.findMany({
    where: {
      workspaceId,
      toolInstance: { clientId },
    },
    include: {
      user: { select: { name: true } },
      toolInstance: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  const totalCost = recentExecutions.reduce((s, e) => s + e.estimatedCostEUR, 0)
  const completedCount = recentExecutions.filter((e) => e.status === 'COMPLETED').length
  const clientFiles = await db.workspaceFile.findMany({
    where: { workspaceId, clientId },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: {
      id: true,
      name: true,
      type: true,
      url: true,
      size: true,
      mimeType: true,
      folderId: true,
      folder: { select: { id: true, name: true } },
      createdAt: true,
    },
  })
  const folders = await getFolderTree(workspaceId)
  const mailHref = client.email ? `/workspace/${workspaceId}/mail?to=${encodeURIComponent(client.email)}` : null

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Link href={`/workspace/${workspaceId}/clients`} className="hover:text-foreground transition-colors">
              {t.clientsTitle}
            </Link>
            <span>/</span>
            <span>{client.name}</span>
          </div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
            {clientMeta.map((item) => (
              <div key={item.label} className="rounded-lg border border-border/70 bg-card/40 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                  {item.label}
                </p>
                <p className="mt-0.5 truncate text-foreground/90">{item.value}</p>
              </div>
            ))}
          </div>
          {client.notes && (
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">{client.notes}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {mailHref && (
            <Link
              href={mailHref}
              className="shrink-0 text-xs border border-input rounded-md px-3 py-1.5 hover:bg-accent transition-colors"
            >
              {t.clientsSendEmail}
            </Link>
          )}
          <PortalLinkButton clientId={clientId} locale={locale} />
          <Link
            href={`/workspace/${workspaceId}/clients/${clientId}/edit`}
            className="shrink-0 text-xs border border-input rounded-md px-3 py-1.5 hover:bg-accent transition-colors"
          >
            {t.clientsEdit}
          </Link>
        </div>
      </div>

      {hasFiscalData && (
        <section className="rounded-xl border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            {t.clientsFiscalDataShort}
          </p>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">{t.clientsClientCompany}</p>
              <p className="font-medium">{client.name}</p>
            </div>
            {client.taxId && <div>
              <p className="text-xs text-muted-foreground">NIF/CIF</p>
              <p className="font-medium">{client.taxId}</p>
            </div>}
            {client.fiscalAddress && <div>
              <p className="text-xs text-muted-foreground">{t.clientsFiscalAddress}</p>
              <p className="font-medium">{client.fiscalAddress}</p>
            </div>}
            {clientLocation && <div>
              <p className="text-xs text-muted-foreground">{t.clientsPostalCityProvince}</p>
              <p className="font-medium">{clientLocation}</p>
            </div>}
            {client.country && <div>
              <p className="text-xs text-muted-foreground">{t.clientsCountry}</p>
              <p className="font-medium">{client.country}</p>
            </div>}
          </div>
        </section>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-1">{t.clientsTools}</p>
          <p className="text-2xl font-bold">{instances.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-1">{t.clientsExecutions}</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-1">{t.clientsAiCost}</p>
          <p className="text-2xl font-bold">{formatCostEUR(totalCost)}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-1">{t.clientsFiles}</p>
          <p className="text-2xl font-bold">{clientFiles.length}</p>
        </div>
      </div>

      <ClientFilesSection
        workspaceId={workspaceId}
        clientId={clientId}
        initialFiles={clientFiles.map((file) => ({
          ...file,
          createdAt: file.createdAt.toISOString(),
        }))}
        initialFolders={folders}
        locale={locale}
      />

      {/* Herramientas del cliente */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">{t.clientsTools}</h2>
          <Link
            href={`/workspace/${workspaceId}/tools`}
            className="text-xs text-primary hover:underline"
          >
            + {t.clientsLinkTool}
          </Link>
        </div>

        {instances.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              {t.clientsNoLinkedTools}
            </p>
            <Link
              href={`/workspace/${workspaceId}/tools`}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              {t.clientsGoToTools}
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border divide-y">
            {instances.map((inst) => {
              const lastExec = inst.toolExecutions[0]
              return (
                <div key={inst.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{inst.name}</p>
                    <p className="text-xs text-muted-foreground">{inst.toolDefinition.name}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-xs text-muted-foreground">
                    <span>{inst._count.toolExecutions} {inst._count.toolExecutions === 1 ? t.clientsExecutionSingular : t.clientsExecutionPlural}</span>
                    {lastExec && (
                      <span>{t.clientsLastPrefix}: {formatDateShort(lastExec.createdAt, locale)}</span>
                    )}
                    <Link
                      href={`/workspace/${workspaceId}/tools/${inst.id}/run`}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                    >
                      ✨ {t.clientsRun}
                    </Link>
                    <Link
                      href={`/workspace/${workspaceId}/tools/${inst.id}/history`}
                      className="text-primary hover:underline"
                    >
                      {t.clientsHistory}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Últimas ejecuciones */}
      {recentExecutions.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-4">{t.clientsRecentExecutions}</h2>
          <div className="rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">{t.clientsDate}</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">{t.clientsTool}</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">{t.clientsStatus}</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">{t.clientsCost}</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground border-b whitespace-nowrap">{t.clientsUser}</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground border-b">{t.clientsView}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExecutions.map((exec, idx) => (
                    <tr
                      key={exec.id}
                      className={cn(
                        'hover:bg-primary/5 transition-colors border-b last:border-0',
                        idx % 2 === 0 ? 'bg-background' : 'bg-muted/20',
                      )}
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(exec.createdAt, locale)}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">
                        {exec.toolInstance.name}
                      </td>
                      <td className="px-4 py-3">
                        <ExecutionStatusBadge status={exec.status} locale={locale} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                        {exec.estimatedCostEUR > 0 ? formatCostEUR(exec.estimatedCostEUR) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {exec.user.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {exec.status === 'COMPLETED' && (
                          <Link
                            href={`/workspace/${workspaceId}/tools/${exec.toolInstance.id}/history/${exec.id}`}
                            className="text-xs text-primary hover:underline"
                          >
                            {t.clientsView}
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}



