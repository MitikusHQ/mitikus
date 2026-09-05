'use client'

import { useTransition, useState, useRef, useEffect } from 'react'
import { type Locale, LOCALE_LABELS, SUPPORTED_LOCALES } from '@/i18n/config'
import { setLocale } from '@/app/actions/locale'

interface LocaleSelectorProps {
  currentLocale: Locale
}

export function LocaleSelector({ currentLocale }: LocaleSelectorProps) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleChange(locale: Locale) {
    if (locale === currentLocale) { setOpen(false); return }
    startTransition(async () => {
      await setLocale(locale)
      window.location.reload()
    })
    setOpen(false)
  }

  const current = LOCALE_LABELS[currentLocale]

  return (
    <div ref={ref} className="relative" aria-label="Language selector">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        disabled={isPending}
        title={current.nativeLabel}
        aria-label="Select language"
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-1 text-sm px-2 py-1 rounded-md hover:bg-muted/60 transition-colors disabled:opacity-50"
      >
        <span>{current.flag}</span>
        <span className="text-xs text-muted-foreground uppercase font-mono">{currentLocale}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 top-full mt-1 z-50 bg-background border border-border rounded-xl shadow-lg py-1 w-44 max-h-72 overflow-y-auto"
        >
          {SUPPORTED_LOCALES.map((locale) => {
            const { flag, nativeLabel } = LOCALE_LABELS[locale]
            const isActive = locale === currentLocale
            return (
              <button
                type="button"
                key={locale}
                role="option"
                aria-selected={isActive}
                onClick={() => handleChange(locale)}
                className={[
                  'w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left transition-colors hover:bg-muted/60',
                  isActive ? 'font-medium text-primary' : 'text-foreground',
                ].join(' ')}
              >
                <span className="text-base">{flag}</span>
                <span>{nativeLabel}</span>
                {isActive && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ml-auto shrink-0" aria-hidden>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
