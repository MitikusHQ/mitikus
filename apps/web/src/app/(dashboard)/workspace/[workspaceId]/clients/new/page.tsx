import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ClientForm } from '../_components/ClientForm'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function NewClientPage({ params }: Props) {
  const { workspaceId } = await params
  const [user, locale] = await Promise.all([requireUser(), getLocale()])
  const t = getDashboardTranslations(locale)

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) notFound()

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Link href={`/workspace/${workspaceId}/clients`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        {t.clientsTitle}
      </Link>
      <h1 className="text-xl font-semibold mb-8">{t.clientsNew}</h1>
      <ClientForm workspaceId={workspaceId} locale={locale} />
    </div>
  )
}
