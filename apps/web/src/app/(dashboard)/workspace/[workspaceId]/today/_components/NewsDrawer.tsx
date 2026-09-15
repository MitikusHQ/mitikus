'use client'

import { useEffect, useRef } from 'react'
import type { NewsArticle } from './news-types'

const SCOPES: { key: NewsArticle['scope']; label: string }[] = [
  { key: 'sector',        label: 'Sector' },
  { key: 'national',      label: 'Nacional' },
  { key: 'autonomic',     label: 'Autonómico' },
  { key: 'local',         label: 'Local' },
  { key: 'international', label: 'Internacional' },
]

const SCOPE_DOT: Record<string, string> = {
  sector:        'bg-blue-500',
  national:      'bg-primary',
  autonomic:     'bg-violet-500',
  local:         'bg-green-500',
  international: 'bg-amber-500',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'hace menos de 1h'
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

interface Props {
  articles: NewsArticle[]
  activeTab: NewsArticle['scope']
  onTabChange: (scope: NewsArticle['scope']) => void
  onClose: () => void
}

export function NewsDrawer({ articles, activeTab, onTabChange, onClose }: Props) {
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const filtered = articles.filter((a) => a.scope === activeTab)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Noticias del día"
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
              Hoy
            </p>
            <h2 className="text-base font-semibold tracking-tight">Noticias del día</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted/40 transition-colors text-muted-foreground"
            aria-label="Cerrar"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 px-4 pt-3 pb-2 shrink-0">
          {SCOPES.map(({ key, label }) => {
            const count = articles.filter((a) => a.scope === key).length
            if (count === 0) return null
            return (
              <button
                key={key}
                onClick={() => onTabChange(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted/70'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${SCOPE_DOT[key]}`} />
                {label}
                <span className={`tabular-nums ${activeTab === key ? 'opacity-70' : 'opacity-50'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Articles */}
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              Sin noticias en este ámbito
            </div>
          ) : (
            filtered.map((article) => (
              <a
                key={article.url}
                href={article.url}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-start gap-3 px-5 py-4 hover:bg-muted/20 transition-colors group"
              >
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${SCOPE_DOT[article.scope]}`} />
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                    {article.title}
                  </p>
                  {article.description && (
                    <p className="text-xs text-muted-foreground/70 line-clamp-2">
                      {article.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                    <span className="font-medium">{article.source}</span>
                    <span>·</span>
                    <span>{timeAgo(article.publishedAt)}</span>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border shrink-0">
          <p className="text-[11px] text-muted-foreground/50 text-center">
            Noticias actualizadas cada 24h · Fuente: Google News
          </p>
        </div>
      </div>
    </>
  )
}
