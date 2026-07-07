'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { type Locale, DEFAULT_LOCALE } from './config'

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE)

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale
  children: ReactNode
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

/** Hook para leer el locale activo en cualquier Client Component. */
export function useLocale(): Locale {
  return useContext(LocaleContext)
}
