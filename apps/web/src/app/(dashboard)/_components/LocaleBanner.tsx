'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { type Locale, LOCALE_LABELS, SUPPORTED_LOCALES } from '@/i18n/config'
import { setLocale, dismissLocaleBanner } from '@/app/actions/locale'

interface LocaleBannerProps {
  suggestedLocale: Locale
  currentLocale: Locale
}

const BANNER_COPY: Record<Locale, {
  also: string
  keep: string
}> = {
  en: {
    also: 'Also available in:',
    keep: 'Keep English',
  },
  es: {
    also: 'También disponible en:',
    keep: 'Mantener Español',
  },
}

export function LocaleBanner({ suggestedLocale, currentLocale }: LocaleBannerProps) {
  const [visible, setVisible] = useState(true)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (!visible) return null

  // Mensaje en el idioma detectado por IP (suggestedLocale)
  const copy = BANNER_COPY[suggestedLocale]

  // Otros idiomas disponibles (todos excepto el actual)
  const otherLocales = SUPPORTED_LOCALES.filter((l) => l !== currentLocale)

  function handleSwitch(locale: Locale) {
    startTransition(async () => {
      await setLocale(locale)
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
      className="w-full bg-primary/5 border-b border-primary/10 py-2 px-4 flex items-center justify-center gap-3 text-sm flex-wrap"
    >
      <span className="text-muted-foreground">{copy.also}</span>
      <div className="flex items-center gap-2 flex-wrap">
        {otherLocales.map((locale) => {
          const { flag, nativeLabel } = LOCALE_LABELS[locale]
          return (
            <button
              key={locale}
              onClick={() => handleSwitch(locale)}
              disabled={isPending}
              className="text-primary font-medium hover:underline disabled:opacity-50"
            >
              {flag} {nativeLabel}
            </button>
          )
        })}
        <span className="text-muted-foreground/40">·</span>
        <button
          onClick={handleKeep}
          disabled={isPending}
          className="text-foreground/70 hover:text-foreground disabled:opacity-50 text-xs"
        >
          {copy.keep}
        </button>
      </div>
    </div>
  )
}
