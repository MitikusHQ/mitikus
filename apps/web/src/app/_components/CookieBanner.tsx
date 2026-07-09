'use client'

import { useState, useEffect } from 'react'

const COOKIE_KEY = 'mitikus-cookie-consent'

function getCookie(name: string) {
  return document.cookie.split('; ').find(r => r.startsWith(name + '='))?.split('=')[1] ?? null
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!getCookie(COOKIE_KEY)) setVisible(true)
  }, [])

  function accept() {
    setCookie(COOKIE_KEY, 'accepted')
    setVisible(false)
  }

  function reject() {
    setCookie(COOKIE_KEY, 'rejected')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div role="region" aria-label="Consentimiento de cookies" className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm p-4 shadow-lg">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-muted-foreground flex-1">
          Usamos cookies esenciales para el funcionamiento del servicio. No usamos cookies de seguimiento ni publicidad.{' '}
          <a href="/privacy" className="underline hover:text-foreground">Política de privacidad</a>.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={reject}
            className="text-sm px-4 py-2 rounded-md border border-input hover:bg-accent transition-colors"
          >
            Solo esenciales
          </button>
          <button
            onClick={accept}
            className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
