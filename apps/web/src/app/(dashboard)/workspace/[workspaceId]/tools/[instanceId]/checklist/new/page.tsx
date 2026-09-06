import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { validateToolSchema } from '@protools/schema'
import type { ChecklistConfig } from '@protools/schema'
import { CapabilityNav } from '../../_components/CapabilityNav'
import { ChecklistRenderer } from '../../_components/ChecklistRenderer'
import { buildCapabilityTabs } from '@/lib/capability-tabs'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import { localizeToolSchema } from '@/lib/localized-content'

interface Props {
  params: Promise<{ workspaceId: string; instanceId: string }>
}

export default async function ChecklistNewPage({ params }: Props) {
  const [{ workspaceId, instanceId }, user, locale] = await Promise.all([params, requireUser(), getLocale()])
  const t = getDashboardTranslations(locale)

  const [workspace, instance] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } }),
    db.toolInstance.findFirst({
      where: { id: instanceId, workspaceId, status: 'ACTIVE' },
      include: { toolDefinition: true },
    }),
  ])

  if (!workspace || !instance) notFound()

  const schemaResult = validateToolSchema(instance.toolDefinition.schema)
  if (!schemaResult.success) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-destructive text-sm">{t.toolInvalidSchema}</p>
      </div>
    )
  }

  const schema = localizeToolSchema(schemaResult.data, locale)
  const checklistCap = schema.capabilities.find((c) => c.type === 'CHECKLIST')
  if (!checklistCap) notFound()
  const checklistConfig = checklistCap.config as ChecklistConfig

  const tabs = buildCapabilityTabs(schema, workspaceId, instanceId)

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold mb-6">{t.toolNewChecklist}</h1>
      <CapabilityNav tabs={tabs} active="CHECKLIST" />
      <ChecklistRenderer
        instanceId={instanceId}
        workspaceId={workspaceId}
        dataSchema={schema.dataSchema}
        checklistConfig={checklistConfig}
        locale={locale}
      />
    </div>
  )
}
