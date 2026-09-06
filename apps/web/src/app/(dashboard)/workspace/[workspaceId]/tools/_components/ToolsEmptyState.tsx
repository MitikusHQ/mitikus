'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { quickInstallTool } from '@/app/actions/tool'
import { UpgradeModal } from '@/app/(dashboard)/_components/UpgradeModal'
import type { Locale } from '@/i18n/config'
import { getDashboardTranslations, type DashboardTranslations } from '@/i18n/dashboard-translations'

const LIMIT_ERRORS = ['Límite de herramientas alcanzado', 'límite de herramientas']
const BLOCKED_ERRORS = ['no está permitido para la beta', 'lista de espera']

function upgradeReason(msg: string): 'limit' | 'blocked' | null {
  if (LIMIT_ERRORS.some((s) => msg.includes(s))) return 'limit'
  if (BLOCKED_ERRORS.some((s) => msg.includes(s))) return 'blocked'
  return null
}

function shortcuts(t: DashboardTranslations) {
  return [
  {
    slug:  'it-audit',
    icon:  '🔐',
    label: t.toolsShortcutItAudit,
    desc:  t.toolsShortcutItAuditDescription,
    tag:   t.toolsShortcutPopular,
  },
  {
    slug:  'gdpr-audit',
    icon:  '📋',
    label: t.toolsShortcutGdprAudit,
    desc:  t.toolsShortcutGdprAuditDescription,
    tag:   null,
  },
  {
    slug:  'digital-maturity',
    icon:  '📊',
    label: t.toolsShortcutDigitalMaturity,
    desc:  t.toolsShortcutDigitalMaturityDescription,
    tag:   null,
  },
  ]
}

export function ToolsEmptyState({ workspaceId, locale }: { workspaceId: string; locale: Locale }) {
  const t = getDashboardTranslations(locale)
  const shortcutItems = shortcuts(t)
  const [installing, setInstalling]   = useState<string | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const [upgradeOpen, setUpgradeOpen] = useState<'limit' | 'blocked' | null>(null)
  const [, startTransition]           = useTransition()
  const router                        = useRouter()

  function handleInstall(slug: string) {
    if (installing) return
    setInstalling(slug)
    setError(null)
    startTransition(async () => {
      const result = await quickInstallTool(workspaceId, slug)
      if ('error' in result) {
        const reason = upgradeReason(result.error)
        if (reason) {
          setUpgradeOpen(reason)
        } else {
          setError(result.error)
        }
        setInstalling(null)
      } else {
        router.push(`/workspace/${workspaceId}/tools/${result.instanceId}/run`)
      }
    })
  }

  return (
    <>
      {upgradeOpen && (
        <UpgradeModal reason={upgradeOpen} onClose={() => setUpgradeOpen(null)} />
      )}
    <div className="rounded-xl border border-dashed bg-card p-10 text-center space-y-8">
      <div className="space-y-1.5">
        <p className="font-semibold text-base">{t.toolsEmptyTitle}</p>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {t.toolsEmptyDescription}
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
        {shortcutItems.map((s) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => handleInstall(s.slug)}
            disabled={!!installing}
            className="
              relative rounded-xl border bg-background p-4 space-y-2 text-left
              hover:border-primary hover:bg-primary/5
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all group
            "
          >
            {s.tag && (
              <span className="absolute top-2.5 right-2.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {s.tag}
              </span>
            )}
            <div className="text-xl">{s.icon}</div>
            <p className="text-sm font-medium leading-snug pr-14 group-hover:text-primary transition-colors">
              {installing === s.slug ? t.toolsInstalling : s.label}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
          </button>
        ))}
      </div>

      <Link
        href={`/tools?workspaceId=${workspaceId}`}
        className="inline-block text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
      >
        {t.toolsViewCatalog} →
      </Link>
    </div>
    </>
  )
}
