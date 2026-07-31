'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from '@/i18n/config'
import { setLocale } from '@/app/actions/locale'

interface LocalePickerModalProps {
  currentLocale: Locale
}

export function LocalePickerModal({ currentLocale }: LocalePickerModalProps) {
  const [open, setOpen] = useState(true)
  const [selected, setSelected] = useState<Locale>(currentLocale)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (!open) return null

  function handleConfirm() {
    startTransition(async () => {
      await setLocale(selected)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-background border rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Choose your language</h2>
          <p className="text-sm text-muted-foreground">
            Select the language you want to use in MITIKUS. You can change it later in Settings.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
          {SUPPORTED_LOCALES.map((locale) => {
            const { flag, nativeLabel } = LOCALE_LABELS[locale]
            const isSelected = locale === selected
            return (
              <button
                key={locale}
                onClick={() => setSelected(locale)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/5 text-foreground font-medium'
                    : 'border-border hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                <span className="text-base shrink-0">{flag}</span>
                <span className="truncate">{nativeLabel}</span>
              </button>
            )
          })}
        </div>

        <button
          onClick={handleConfirm}
          disabled={isPending}
          className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? '…' : 'Confirm'}
        </button>
      </div>
    </div>
  )
}
