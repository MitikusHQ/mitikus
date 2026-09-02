'use client'

import { useEffect } from 'react'
import { clearLicenseToken, isDesktopApp, saveLicenseToken } from '@/lib/desktop-bridge'

const SYNC_KEY = 'mitikus_desktop_license_synced_at'
const SYNC_INTERVAL_MS = 12 * 60 * 60 * 1000

export function DesktopLicenseSync() {
  useEffect(() => {
    if (!isDesktopApp()) return

    let cancelled = false

    async function syncLicense(force = false) {
      const lastSync = Number(window.localStorage.getItem(SYNC_KEY) ?? '0')
      if (!force && Number.isFinite(lastSync) && Date.now() - lastSync < SYNC_INTERVAL_MS) return

      try {
        const res = await fetch('/api/desktop/license-token', { method: 'POST' })
        if (res.status === 403) {
          window.localStorage.removeItem(SYNC_KEY)
          await clearLicenseToken()
          return
        }
        if (!res.ok) return

        const body = (await res.json()) as { token?: string }
        if (!body.token || cancelled) return

        const saved = await saveLicenseToken(body.token)
        if (saved && !cancelled) {
          window.localStorage.setItem(SYNC_KEY, String(Date.now()))
        }
      } catch {
        // MITIKUS puede seguir funcionando con la licencia local ya guardada.
      }
    }

    void syncLicense()
    const intervalId = window.setInterval(() => {
      void syncLicense()
    }, SYNC_INTERVAL_MS)

    function handleOnline() {
      void syncLicense(true)
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void syncLicense()
      }
    }

    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null
}
