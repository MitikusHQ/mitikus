import Link from 'next/link'
import type { InvoiceData } from '@/app/actions/invoices'
import type { Locale } from '@/i18n/config'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  workspaceId: string
  invoices: InvoiceData[]
  locale: Locale
}

export function InvoicesWidget({ workspaceId, invoices, locale }: Props) {
  const t = getDashboardTranslations(locale)
  const pending = invoices.filter((i) => i.status === 'enviada')
  if (pending.length === 0) return null

  const total = pending.reduce((s, i) => s + i.total, 0)
  const fmtMoney = (n: number) =>
    n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t.todayInvoicesPendingCollection}
        </h2>
        <Link href={`/workspace/${workspaceId}/invoices`} className="text-xs text-primary hover:underline">
          {t.todayViewAll} →
        </Link>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-amber-50 dark:bg-amber-900/10 border-b border-border">
          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            {pending.length} {pending.length === 1 ? t.todayInvoiceUnpaidSingular : t.todayInvoiceUnpaidPlural}
          </span>
          <span className="text-sm font-semibold font-mono text-amber-700 dark:text-amber-400">
            {fmtMoney(total)} EUR
          </span>
        </div>
        <div className="divide-y divide-border">
          {pending.slice(0, 4).map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-sm font-medium text-foreground min-w-0 flex-1 truncate">
                {inv.number}
                {inv.clientName && <span className="text-muted-foreground font-normal"> · {inv.clientName}</span>}
              </span>
              <span className="text-xs font-mono text-muted-foreground shrink-0">
                {fmtMoney(inv.total)} {inv.currency}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
