'use client'

import { useState, useTransition } from 'react'
import { getOrCreatePortalToken } from '@/app/actions/client-portal'
import type { Locale } from '@/i18n/config'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  clientId: string
  locale: Locale
}

export function PortalLinkButton({ clientId, locale }: Props) {
  const t = getDashboardTranslations(locale)
  const [copied, setCopied]     = useState(false)
  const [, startTransition]     = useTransition()

  function handleCopy() {
    startTransition(async () => {
      const token  = await getOrCreatePortalToken(clientId)
      const url    = `${window.location.origin}/portal/${token}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
    >
      {copied ? `✓ ${t.clientsPortalCopied}` : `🔗 ${t.clientsPortal}`}
    </button>
  )
}
