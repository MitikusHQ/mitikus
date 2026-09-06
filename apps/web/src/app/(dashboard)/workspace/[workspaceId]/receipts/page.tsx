import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getReceipts } from '@/app/actions/receipts'
import { ReceiptsClient } from './_components/ReceiptsClient'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function ReceiptsPage({ params }: Props) {
  const [{ workspaceId }, user, locale] = await Promise.all([params, requireUser(), getLocale()])
  const t = getDashboardTranslations(locale)

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true, name: true },
  })
  if (!workspace) notFound()

  const receipts = await getReceipts(workspaceId)

  return (
    <>
      <div className="px-6 py-2.5 border-b bg-background print:hidden">
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href={`/workspace/${workspaceId}/office`} className="hover:text-foreground transition-colors">
            {t.receiptsOffice}
          </Link>
          <svg className="w-3.5 h-3.5 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
          <span className="text-foreground font-medium">{t.receiptsTitle}</span>
        </nav>
      </div>
      <div className="px-6 pt-6 pb-2 print:hidden">
        <h1 className="text-xl font-semibold">{t.receiptsTitle}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{t.receiptsSubtitle}</p>
      </div>
      <ReceiptsClient workspaceId={workspaceId} initialReceipts={receipts} />
    </>
  )
}
