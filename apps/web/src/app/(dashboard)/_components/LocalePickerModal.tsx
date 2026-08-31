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
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-2xl dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50">
        <div className="space-y-1 px-6 pt-6">
          <h2 className="text-lg font-semibold">Choose your language</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Select the language you want to use in MITIKUS. You can change it later in Settings.
          </p>
        </div>

        <div className="mx-6 mt-5 grid max-h-[min(18rem,calc(100dvh-16rem))] grid-cols-2 gap-2 overflow-y-auto pr-1">
          {SUPPORTED_LOCALES.map((locale) => {
            const { flag, nativeLabel } = LOCALE_LABELS[locale]
            const isSelected = locale === selected
            return (
              <button
                key={locale}
                onClick={() => setSelected(locale)}
                className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/10 font-medium text-slate-950 dark:text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-base shrink-0">{flag}</span>
                <span className="truncate">{nativeLabel}</span>
              </button>
            )
          })}
        </div>

        <div className="px-6 pb-6 pt-5">
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? '…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
