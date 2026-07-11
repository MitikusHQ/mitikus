'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { type Locale, LOCALE_LABELS } from '@/i18n/config'
import { setLocale, dismissLocaleBanner } from '@/app/actions/locale'

interface LocaleBannerProps {
  suggestedLocale: Locale
  currentLocale: Locale
}

const BANNER_COPY: Record<Locale, {
  available: (lang: string) => string
  switchTo: (lang: string) => string
  keep: (lang: string) => string
}> = {
  en: {
    available: (lang) => `MITIKUS is available in ${lang}.`,
    switchTo: (lang) => `Switch to ${lang}`,
    keep: (lang) => `Keep ${lang}`,
  },
  es: {
    available: (lang) => `MITIKUS está disponible en ${lang}.`,
    switchTo: (lang) => `Cambiar a ${lang}`,
    keep: (lang) => `Mantener ${lang}`,
  },
}

export function LocaleBanner({ suggestedLocale, currentLocale }: LocaleBannerProps) {
  const [visible, setVisible] = useState(true)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (!visible) return null

  // El mensaje del banner siempre en el idioma de la IP (suggestedLocale),
  // no en el idioma actual — así el usuario lo entiende en su lengua nativa.
  const { nativeLabel, flag } = LOCALE_LABELS[suggestedLocale]
  const { nativeLabel: currentLabel } = LOCALE_LABELS[currentLocale]
  const copy = BANNER_COPY[suggestedLocale]

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
        {flag} <span className="font-medium">{copy.available(nativeLabel)}</span>
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={handleSwitch}
          disabled={isPending}
          className="text-primary font-medium hover:underline disabled:opacity-50"
        >
          {copy.switchTo(nativeLabel)}
        </button>
        <span className="text-muted-foreground/40">·</span>
        <button
          onClick={handleKeep}
          disabled={isPending}
          className="text-foreground/70 hover:text-foreground disabled:opacity-50"
        >
          {copy.keep(currentLabel)}
        </button>
      </div>
    </div>
  )
}
