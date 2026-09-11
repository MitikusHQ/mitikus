import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { getDocuments } from '@/app/actions/documents'
import { DocList } from './_components/DocList'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function DocsPage({ params }: Props) {
  const [{ workspaceId }, user, locale] = await Promise.all([params, requireUser(), getLocale()])
  const t = getDashboardTranslations(locale)

  const workspace = await db.workspace.findFirst({
    where:  { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) notFound()

  const docs = await getDocuments(workspaceId, user.id)

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t.docsTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.docsSubtitle}</p>
      </div>
      <DocList workspaceId={workspaceId} initialDocs={docs} currentUserId={user.id} />
    </div>
  )
}
