'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { NewsArticle } from './news-types'
import { NewsDrawer } from './NewsDrawer'

interface Props {
  workspaceId: string
}

const SCOPE_LABEL: Record<string, string> = {
  sector:        'Sector',
  national:      'Nacional',
  autonomic:     'Autonómico',
  local:         'Local',
  international: 'Internacional',
}

const SCOPE_COLOR: Record<string, string> = {
  sector:        'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  national:      'bg-primary/10 text-primary',
  autonomic:     'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  local:         'bg-green-500/10 text-green-600 dark:text-green-400',
  international: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'hace menos de 1h'
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

// Muestra máx 1 por scope en el resumen principal
function pickSummary(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>()
  const result: NewsArticle[] = []
  for (const a of articles) {
    if (!seen.has(a.scope)) {
      seen.add(a.scope)
      result.push(a)
    }
    if (result.length >= 3) break
  }
  return result
}

export function DailyBriefBlock({ workspaceId }: Props) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [noSector, setNoSector] = useState(false)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<NewsArticle['scope']>('sector')

  useEffect(() => {
    fetch(`/api/today/news?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((data: { articles: NewsArticle[]; noSector?: boolean }) => {
        if (data.noSector) setNoSector(true)
        else setArticles(data.articles ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [workspaceId])

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 rounded-lg bg-muted/40 animate-pulse" />
        ))}
      </div>
    )
  }

  if (noSector) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 flex items-center gap-3">
        <span className="text-base">📰</span>
        <p className="text-xs text-muted-foreground">
          Configura el sector de tu empresa para ver noticias relevantes.{' '}
          <Link href={`/workspace/${workspaceId}/settings`} className="text-primary hover:underline">
            Ir a Settings
          </Link>
        </p>
      </div>
    )
  }

  if (articles.length === 0) return null

  const summary = pickSummary(articles)

  return (
    <>
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
            Noticias del día
          </p>
          <button
            onClick={() => { setActiveTab('sector'); setDrawerOpen(true) }}
            className="text-[11px] text-primary/70 hover:text-primary transition-colors"
          >
            Ver todas ({articles.length}) →
          </button>
        </div>
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {summary.map((article) => (
            <a
              key={article.url}
              href={article.url}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group"
            >
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
                  <span>{article.source}</span>
                  <span>·</span>
                  <span>{timeAgo(article.publishedAt)}</span>
                </div>
              </div>
              <span className={`shrink-0 mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${SCOPE_COLOR[article.scope]}`}>
                {SCOPE_LABEL[article.scope]}
              </span>
            </a>
          ))}
        </div>
      </section>

      {drawerOpen && (
        <NewsDrawer
          articles={articles}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </>
  )
}
