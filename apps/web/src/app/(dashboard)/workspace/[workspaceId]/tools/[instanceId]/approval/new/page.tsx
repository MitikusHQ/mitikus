import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { validateToolSchema } from '@protools/schema'
import type { ApprovalFlowConfig } from '@protools/schema'
import { createApprovalRecord } from '@/app/actions/record'
import { FormRenderer } from '../../_components/FormRenderer'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import { localizeToolSchema } from '@/lib/localized-content'

interface Props {
  params: Promise<{ workspaceId: string; instanceId: string }>
}

export default async function NewApprovalPage({ params }: Props) {
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
  const approvalCap = schema.capabilities.find((c) => c.type === 'APPROVAL_FLOW')
  if (!approvalCap) notFound()

  const approvalConfig = approvalCap.config as ApprovalFlowConfig
  const pageTitle = approvalCap.label ?? t.toolNewApprovalRequest

  // Verificar que el rol del usuario puede crear solicitudes
  const submitterRoles = approvalConfig.submitterRoles
  if (!submitterRoles.includes(user.role as typeof submitterRoles[number])) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <p className="text-destructive text-sm">{t.toolNoApprovalPermission}</p>
      </div>
    )
  }

  const autoApproveBelow = approvalConfig.autoApproveBelow
  const autoApproveField = approvalConfig.autoApproveAmountField

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Link
        href={`/workspace/${workspaceId}/tools/${instanceId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        {instance.name}
      </Link>

      <h1 className="text-xl font-semibold mb-2">{pageTitle}</h1>

      {autoApproveBelow !== undefined && autoApproveField && (
        <p className="text-sm text-muted-foreground mb-8">
          {t.toolAutoApproveBelowPrefix}{' '}
          <span className="font-medium">{autoApproveBelow.toLocaleString(locale)} €</span>{' '}
          {t.toolAutoApproveBelowSuffix}
        </p>
      )}
      {!(autoApproveBelow !== undefined && autoApproveField) && (
        <p className="text-sm text-muted-foreground mb-8">
          {t.toolApprovalWillRemainPending}
        </p>
      )}

      <FormRenderer
        action={createApprovalRecord}
        instanceId={instanceId}
        dataSchema={schema.dataSchema}
        formConfig={{ layout: 'single-column', submitLabel: t.toolSubmitApprovalRequest }}
        locale={locale}
      />
    </div>
  )
}
