import { requireUser } from '@/lib/auth'
import { getContracts } from '@/app/actions/contracts'
import { ContractList } from './_components/ContractList'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function ContractsPage({ params }: Props) {
  const [{ workspaceId }, user, locale] = await Promise.all([params, requireUser(), getLocale()])
  const t = getDashboardTranslations(locale)
  const contracts = await getContracts(workspaceId)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">{t.contractsTitle}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {contracts.length} {contracts.length === 1 ? t.contractsSingular : t.contractsPlural}
          </p>
        </div>
      </div>
      <ContractList workspaceId={workspaceId} initial={contracts} currentUserId={user.id} locale={locale} />
    </div>
  )
}
