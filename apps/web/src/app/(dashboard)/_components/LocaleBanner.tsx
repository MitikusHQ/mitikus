'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { type Locale, LOCALE_LABELS, SUPPORTED_LOCALES } from '@/i18n/config'
import { setLocale } from '@/app/actions/locale'

interface LocaleBannerProps {
  suggestedLocale: Locale
  currentLocale: Locale
}

const ALSO_AVAILABLE: Record<Locale, string> = {
  en: 'Also available in:',
  es: 'También disponible en:',
  fr: 'Également disponible en :',
  de: 'Auch verfügbar in:',
  pt: 'Também disponível em:',
  it: 'Disponibile anche in:',
  nl: 'Ook beschikbaar in:',
  pl: 'Dostępne również w:',
  ro: 'Disponibil și în:',
  sv: 'Finns även på:',
  da: 'Også tilgængeligt på:',
  no: 'Også tilgjengelig på:',
  hu: 'Elérhető más nyelven is:',
  cs: 'K dispozici také v:',
  sk: 'K dispozícii aj v:',
  el: 'Διαθέσιμο επίσης σε:',
  fi: 'Saatavilla myös:',
  hr: 'Dostupno i na:',
  bg: 'Достъпно и на:',
  sl: 'Na voljo tudi v:',
  ja: '他の言語でも利用可能：',
  zh: '也支持以下语言：',
}

export function LocaleBanner({ suggestedLocale, currentLocale }: LocaleBannerProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const otherLocales = SUPPORTED_LOCALES.filter((l) => l !== currentLocale)
  if (otherLocales.length === 0) return null

  function handleSwitch(locale: Locale) {
    startTransition(async () => {
      await setLocale(locale)
      router.refresh()
    })
  }

  return (
    <div
      role="banner"
      className="w-full bg-primary/5 border-b border-primary/10 py-2 px-4 flex items-center justify-center gap-3 text-sm flex-wrap"
    >
      <span className="text-muted-foreground">{ALSO_AVAILABLE[suggestedLocale]}</span>
      <div className="flex items-center gap-3">
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
      </div>
    </div>
  )
}
