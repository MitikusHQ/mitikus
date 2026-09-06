'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '@/i18n/config'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  workspaceId: string
  instanceId: string
  aiLabel?: string
  locale: Locale
}

export function ToolSectionNav({ workspaceId, instanceId, aiLabel, locale }: Props) {
  const t = getDashboardTranslations(locale)
  const pathname = usePathname()
  const base = `/workspace/${workspaceId}/tools/${instanceId}`

  const tabs = [
    { href: base, label: t.toolNavRecords, exact: true },
    { href: `${base}/run`, label: aiLabel ?? `✨ ${t.toolNavRunAi}`, exact: false },
    { href: `${base}/history`, label: t.toolNavAiHistory, exact: false },
    { href: `${base}/settings`, label: `⚙ ${t.toolNavSettings}`, exact: false },
  ]

  return (
    <nav className="flex items-center gap-0 border-b mb-6" aria-label={t.toolNavAria}>
      {tabs.map((tab) => {
        const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={[
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground',
            ].join(' ')}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}




