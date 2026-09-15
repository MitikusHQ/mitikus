import type { Metadata } from 'next'
import { BrainTabs } from './_components/BrainTabs'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import { requireUser } from '@/lib/auth'
import { getEntitlements } from '@/lib/billing/entitlements'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Brain — MITIKUS' }

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function BrainPage({ params }: Props) {
  const [{ workspaceId }, locale, user] = await Promise.all([params, getLocale(), requireUser()])
  const t = getDashboardTranslations(locale)

  const [entitlements, brainCount, toolCount] = await Promise.all([
    getEntitlements(user.orgId),
    db.brainQuery.count({
      where: { orgId: user.orgId, createdAt: { gte: new Date(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1) } },
    }),
    db.toolExecution.count({
      where: { workspace: { orgId: user.orgId }, status: { not: 'RUNNING' }, createdAt: { gte: new Date(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1) }, workflowNodeExecution: { is: null } },
    }),
  ])

  const queriesUsed = brainCount + toolCount
  const queriesLimit = entitlements.limits.brainQueriesPerMonth

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-6 pt-8 pb-4 border-b border-border">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">✦</span>
          <h1 className="text-2xl font-bold">Brain</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {t.brainDescription}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto h-full">
          <BrainTabs workspaceId={workspaceId} locale={locale} queriesUsed={queriesUsed} queriesLimit={queriesLimit} />
        </div>
      </div>
    </div>
  )
}
