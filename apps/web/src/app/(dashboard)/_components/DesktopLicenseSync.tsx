'use client'

import { useEffect } from 'react'
import { isDesktopApp, saveLicenseToken } from '@/lib/desktop-bridge'

const SYNC_KEY = 'mitikus_desktop_license_synced_at'
const SYNC_INTERVAL_MS = 12 * 60 * 60 * 1000

export function DesktopLicenseSync() {
  useEffect(() => {
    if (!isDesktopApp()) return

    const lastSync = Number(window.localStorage.getItem(SYNC_KEY) ?? '0')
    if (Number.isFinite(lastSync) && Date.now() - lastSync < SYNC_INTERVAL_MS) return

    let cancelled = false

    async function syncLicense() {
      try {
        const res = await fetch('/api/desktop/license-token', { method: 'POST' })
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

    return () => {
      cancelled = true
    }
  }, [])

  return null
}
