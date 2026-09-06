import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { validateToolSchema } from '@protools/schema'
import type { ApprovalFlowConfig } from '@protools/schema'
import { ApprovalActions } from './_components/ApprovalActions'
import type { DashboardTranslations } from '@/i18n/dashboard-translations'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import { getLocale } from '@/i18n/locale'
import type { Locale } from '@/i18n/config'

interface Props {
  params: Promise<{ workspaceId: string; instanceId: string; recordId: string }>
}

const STATUS_CONFIG = {
  pending:  { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  on_hold:  { color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

function defaultStatusLabels(t: DashboardTranslations) {
  return {
    pending: t.toolApprovalPending,
    approved: t.toolApprovalApproved,
    rejected: t.toolApprovalRejected,
    on_hold: t.toolApprovalOnHold,
  }
}

function formatValue(value: unknown, fieldType: string, locale: Locale): string {
  if (value === null || value === undefined) return '—'
  if (fieldType === 'boolean') return value ? (locale === 'es' ? 'Sí' : 'Yes') : 'No'
  if (fieldType === 'date') {
    try {
      return new Date(String(value)).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })
    } catch { return String(value) }
  }
  if (fieldType === 'number') {
    const n = Number(value)
    return isNaN(n) ? '—' : n.toLocaleString(locale, { maximumFractionDigits: 2 })
  }
  return String(value)
}

export default async function ApprovalDetailPage({ params }: Props) {
  const [{ workspaceId, instanceId, recordId }, user, locale] = await Promise.all([params, requireUser(), getLocale()])
  const t = getDashboardTranslations(locale)

  const [workspace, instance, record] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } }),
    db.toolInstance.findFirst({
      where: { id: instanceId, workspaceId, status: 'ACTIVE' },
      include: { toolDefinition: true },
    }),
    db.toolRecord.findFirst({
      where: { id: recordId, toolInstanceId: instanceId, isDeleted: false },
    }),
  ])

  if (!workspace || !instance || !record) notFound()

  const schemaResult = validateToolSchema(instance.toolDefinition.schema)
  if (!schemaResult.success) notFound()

  const schema = schemaResult.data
  const approvalCap = schema.capabilities.find((c) => c.type === 'APPROVAL_FLOW')
  if (!approvalCap) notFound()

  const approvalConfig = approvalCap.config as ApprovalFlowConfig
  const data = (record.data ?? {}) as Record<string, unknown>
  const currentStatus = (data._status as string) ?? 'pending'
  const history = (data._history as Array<{ status: string; comment: string | null; actorUserId: string; at: string }>) ?? []

  const statusCfg = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
  const statusLabels = defaultStatusLabels(t)

  const labelFor = (s: string) =>
    approvalConfig.statusLabels?.[s as keyof typeof approvalConfig.statusLabels] ??
    statusLabels[s as keyof typeof statusLabels] ?? s

  const fields = Object.entries(schema.dataSchema.fields)

  const approverRoles = approvalConfig.approverRoles ?? ['ADMIN', 'OWNER']
  const canApprove = approverRoles.includes(user.role as typeof approverRoles[number])
  const isTerminal = currentStatus === 'approved' || currentStatus === 'rejected'

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

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">{approvalCap.label ?? t.toolApprovalRequest}</h1>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusCfg.color}`}>
          {labelFor(currentStatus)}
        </span>
      </div>

      {/* Datos de la solicitud */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6 space-y-4">
        {fields.map(([fieldId, field]) => {
          const value = data[fieldId]
          if (value === null || value === undefined) return null
          return (
            <div key={fieldId} className="grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-muted-foreground col-span-1">{field.label}</dt>
              <dd className="text-sm text-foreground col-span-2 whitespace-pre-wrap">
                {formatValue(value, field.type, locale)}
              </dd>
            </div>
          )
        })}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border">
          <dt className="text-sm font-medium text-muted-foreground">{t.toolApprovalRequestDate}</dt>
          <dd className="text-sm text-foreground col-span-2">
            {new Date(record.createdAt).toLocaleString(locale, { dateStyle: 'long', timeStyle: 'short' })}
          </dd>
        </div>
      </div>

      {/* Panel de acción para aprobadores — solo si puede aprobar y no está en estado terminal */}
      {canApprove && !isTerminal && (
        <ApprovalActions
          instanceId={instanceId}
          recordId={recordId}
          workspaceId={workspaceId}
          requireCommentOnRejection={approvalConfig.requireCommentOnRejection}
          statusLabels={approvalConfig.statusLabels}
          locale={locale}
        />
      )}

      {/* Historial de transiciones */}
      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            {t.toolApprovalHistory}
          </h2>
          <div className="space-y-3">
            {history.map((entry, i) => {
              const cfg = STATUS_CONFIG[entry.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
              return (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-4">
                  <span className={`mt-0.5 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
                    {labelFor(entry.status)}
                  </span>
                  <div className="min-w-0 flex-1">
                    {entry.comment && (
                      <p className="text-sm text-foreground mb-1">{entry.comment}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
