'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { type Locale, SUPPORTED_LOCALES, LOCALE_LABELS } from '@/i18n/config'
import { setLocale } from '@/app/actions/locale'

interface Props {
  currentLocale: Locale
}

export function LocaleSwitcher({ currentLocale }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const otherLocales = SUPPORTED_LOCALES.filter((l) => l !== currentLocale)

  function handleSwitch(locale: Locale) {
    startTransition(async () => {
      await setLocale(locale)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-1">
      {otherLocales.map((locale) => {
        const { flag, nativeLabel } = LOCALE_LABELS[locale]
        return (
          <button
            key={locale}
            type="button"
            onClick={() => handleSwitch(locale)}
            disabled={isPending}
            title={`Switch to ${nativeLabel}`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent disabled:opacity-50"
          >
            <span>{flag}</span>
            <span className="hidden sm:inline">{nativeLabel}</span>
          </button>
        )
      })}
    </div>
  )
}
