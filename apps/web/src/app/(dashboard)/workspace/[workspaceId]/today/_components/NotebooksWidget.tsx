import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Notebook {
  id:          string
  title:       string
  sourceCount: number
  createdAt:   string
}

interface Props {
  workspaceId: string
  notebooks:   Notebook[]
  locale:      Locale
}

export function NotebooksWidget({ workspaceId, notebooks, locale }: Props) {
  const t = getDashboardTranslations(locale)
  if (notebooks.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t.todayRecentNotebooks}</h2>
        <Link
          href={`/workspace/${workspaceId}/notebooks`}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {t.todayViewAll} →
        </Link>
      </div>
      <div className="space-y-2">
        {notebooks.map((n) => (
          <Link
            key={n.id}
            href={`/workspace/${workspaceId}/notebooks/${n.id}`}
            className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors"
          >
            <span className="text-base shrink-0">🧠</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{n.title}</p>
              <p className="text-xs text-muted-foreground">
                {n.sourceCount} {n.sourceCount === 1 ? t.todaySourceSingular : t.todaySourcePlural} ·{' '}
                {new Date(n.createdAt).toLocaleDateString(locale)}
              </p>
            </div>
            <span className="shrink-0 text-muted-foreground text-xs">→</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
