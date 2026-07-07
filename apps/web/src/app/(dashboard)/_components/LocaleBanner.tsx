'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { type Locale, LOCALE_LABELS } from '@/i18n/config'
import { setLocale, dismissLocaleBanner } from '@/app/actions/locale'

interface LocaleBannerProps {
  suggestedLocale: Locale
}

export function LocaleBanner({ suggestedLocale }: LocaleBannerProps) {
  const [visible, setVisible] = useState(true)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (!visible) return null

  const { nativeLabel, flag } = LOCALE_LABELS[suggestedLocale]

  function handleSwitch() {
    startTransition(async () => {
      await setLocale(suggestedLocale)
      setVisible(false)
      router.refresh()
    })
  }

  function handleKeep() {
    startTransition(async () => {
      await dismissLocaleBanner()
      setVisible(false)
    })
  }

  return (
    <div
      role="banner"
      className="w-full bg-primary/5 border-b border-primary/10 py-2 px-4 flex items-center justify-center gap-3 text-sm"
    >
      <span>
        {flag} MITIKUS is available in{' '}
        <span className="font-medium">{nativeLabel}</span>.
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={handleSwitch}
          disabled={isPending}
          className="text-primary font-medium hover:underline disabled:opacity-50"
        >
          Switch to {nativeLabel}
        </button>
        <span className="text-muted-foreground/40">·</span>
        <button
          onClick={handleKeep}
          disabled={isPending}
          className="text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          Keep English
        </button>
      </div>
    </div>
  )
}
