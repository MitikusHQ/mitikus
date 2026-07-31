'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from '@/i18n/config'
import { setLocale } from '@/app/actions/locale'

interface LocaleSelectorProps {
  currentLocale: Locale
}

export function LocaleSelector({ currentLocale }: LocaleSelectorProps) {
  const [selected, setSelected] = useState<Locale>(currentLocale)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelected(e.target.value as Locale)
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      await setLocale(selected)
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={selected}
        onChange={handleChange}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        {SUPPORTED_LOCALES.map((locale) => {
          const { flag, nativeLabel, label } = LOCALE_LABELS[locale]
          return (
            <option key={locale} value={locale}>
              {flag} {nativeLabel} ({label})
            </option>
          )
        })}
      </select>

      <button
        onClick={handleSave}
        disabled={isPending || selected === currentLocale}
        className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Saving…' : 'Save'}
      </button>

      {saved && <span className="text-sm text-muted-foreground">✓ Saved</span>}
    </div>
  )
}
