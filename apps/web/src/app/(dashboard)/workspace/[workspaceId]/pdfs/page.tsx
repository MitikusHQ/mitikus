import { getPdfs } from '@/app/actions/pdfs'
import { requireUser } from '@/lib/auth'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import { PdfList } from './_components/PdfList'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function PdfsPage({ params }: Props) {
  const [{ workspaceId }, user, locale] = await Promise.all([params, requireUser(), getLocale()])
  const t = getDashboardTranslations(locale)
  const pdfs = await getPdfs(workspaceId)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t.pdfsTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t.pdfsSubtitle}
        </p>
      </div>
      <PdfList workspaceId={workspaceId} initial={pdfs} currentUserId={user.id} locale={locale} />
    </div>
  )
}
