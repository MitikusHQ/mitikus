'use client'

import { useState, useEffect } from 'react'

export function useLocale(): 'es' | 'en' {
  const [locale, setLocale] = useState<'es' | 'en'>('es')

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)protools-locale=([^;]+)/)
    if (match?.[1] === 'en') setLocale('en')
  }, [])

  return locale
}
