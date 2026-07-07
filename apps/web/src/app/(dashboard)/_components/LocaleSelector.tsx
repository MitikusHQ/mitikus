'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { type Locale, LOCALE_LABELS, SUPPORTED_LOCALES } from '@/i18n/config'
import { setLocale } from '@/app/actions/locale'

interface LocaleSelectorProps {
  currentLocale: Locale
}

export function LocaleSelector({ currentLocale }: LocaleSelectorProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleChange(locale: Locale) {
    if (locale === currentLocale) return
    startTransition(async () => {
      await setLocale(locale)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Language">
      {SUPPORTED_LOCALES.map((locale) => {
        const { flag, nativeLabel } = LOCALE_LABELS[locale]
        const isActive = locale === currentLocale
        return (
          <button
            key={locale}
            onClick={() => handleChange(locale)}
            disabled={isActive || isPending}
            title={nativeLabel}
            aria-pressed={isActive}
            className={[
              'text-sm px-1.5 py-0.5 rounded transition-colors',
              isActive
                ? 'text-foreground font-medium cursor-default'
                : 'text-muted-foreground hover:text-foreground',
              isPending ? 'opacity-50' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {flag}
          </button>
        )
      })}
    </div>
  )
}
