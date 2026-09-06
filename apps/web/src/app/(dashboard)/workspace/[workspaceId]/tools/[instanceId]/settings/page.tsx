import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ToolSectionNav } from '../_components/ToolSectionNav'
import { ConfigClient } from './_components/ConfigClient'
import { getOrCreateConfig } from '@/app/actions/config'
import { getAvailableProviderIds } from '@/lib/providers'
import { assignClientToInstance } from '@/app/actions/tool'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  params: Promise<{ workspaceId: string; instanceId: string }>
}

export default async function ToolSettingsPage({ params }: Props) {
  const [{ workspaceId, instanceId }, user, locale] = await Promise.all([params, requireUser(), getLocale()])
  const t = getDashboardTranslations(locale)

  const [workspace, instance, clients] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } }),
    db.toolInstance.findFirst({
      where: { id: instanceId, workspaceId, status: 'ACTIVE' },
      select: { name: true, clientId: true, toolDefinition: { select: { name: true, slug: true } } },
    }),
    db.client.findMany({
      where: { workspaceId, isArchived: false },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  if (!workspace) notFound()
  if (!instance) notFound()

  const aiLabel = instance.toolDefinition.slug === 'social-media-manager' ? t.toolAiIdeas : undefined

  const [config, availableProviderIds] = await Promise.all([
    getOrCreateConfig(instanceId, workspaceId),
    Promise.resolve(getAvailableProviderIds()),
  ])

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Link href={`/workspace/${workspaceId}/tools/${instanceId}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        {instance.name}
      </Link>
      <div className="mb-6">
        <h1 className="text-xl font-semibold truncate">{instance.name}</h1>
        <p className="text-xs text-muted-foreground truncate">{instance.toolDefinition.name}</p>
      </div>

      <ToolSectionNav workspaceId={workspaceId} instanceId={instanceId} aiLabel={aiLabel} locale={locale} />

      <div className="mb-6">
        <h2 className="text-lg font-semibold">{t.toolSettingsTitle}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t.toolSettingsDescription}
        </p>
      </div>

      <div className="mb-8 rounded-xl border bg-card p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold">{t.toolSettingsLinkedClient}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.toolSettingsLinkedClientDescription}
          </p>
        </div>
        <form action={assignClientToInstance} className="flex items-end gap-3">
          <input type="hidden" name="instanceId" value={instanceId} />
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <div className="flex-1">
            <select
              name="clientId"
              defaultValue={instance.clientId ?? ''}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{t.toolSettingsNoClient}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            {t.toolSettingsSave}
          </button>
        </form>
        {clients.length === 0 && (
          <p className="text-xs text-muted-foreground">
            {t.toolSettingsNoClientsYet}{' '}
            <a href={`/workspace/${workspaceId}/clients/new`} className="text-primary hover:underline">
              {t.toolSettingsCreateClient}
            </a>
          </p>
        )}
      </div>

      <ConfigClient
        toolInstanceId={instanceId}
        workspaceId={workspaceId}
        initialConfig={config}
        availableProviderIds={availableProviderIds}
        locale={locale}
      />
    </div>
  )
}

