'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  disconnectStorageIntegration,
  exportWorkspaceFilesToConnectedStorage,
  getStorageConnectionUrl,
} from '@/app/actions/integrations'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'
import type { StorageIntegrationState, StorageProvider } from '@/lib/integrations/calendar'

export function StorageIntegrationClient({
  workspaceId,
  locale,
  storage,
}: {
  workspaceId: string
  locale: Locale
  storage: StorageIntegrationState | null
}) {
  const t = getDashboardTranslations(locale)
  const router = useRouter()
  const [loadingProvider, setLoadingProvider] = useState<StorageProvider | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportUrl, setExportUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const providerLabels: Record<StorageProvider, string> = {
    google_drive: t.integrationsGoogleDrive,
    onedrive: t.integrationsOneDrive,
    dropbox: t.integrationsDropbox,
  }

  async function connect(provider: StorageProvider) {
    if (loadingProvider) return
    setLoadingProvider(provider)
    setError(null)
    try {
      const result = await getStorageConnectionUrl(workspaceId, provider)
      if (!result.ok) {
        setError(result.error)
        return
      }
      window.location.href = result.url
    } catch {
      setError(t.integrationsStorageConnectError)
      setLoadingProvider(null)
    }
  }

  async function disconnect() {
    if (disconnecting) return
    setDisconnecting(true)
    setError(null)
    try {
      await disconnectStorageIntegration(workspaceId)
      router.refresh()
    } catch {
      setError(t.integrationsStorageDisconnectError)
    } finally {
      setDisconnecting(false)
    }
  }

  async function exportFiles() {
    if (exporting) return
    setExporting(true)
    setExportUrl(null)
    setError(null)
    try {
      const result = await exportWorkspaceFilesToConnectedStorage(workspaceId)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setExportUrl(result.url)
    } catch {
      setError(t.integrationsStorageExportError)
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{t.integrationsStorageTitle}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t.integrationsStorageDescription}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${storage ? 'bg-green-500/10 text-green-600 dark:text-green-300' : 'bg-muted text-muted-foreground'}`}>
          {storage ? t.integrationsConfigured : t.integrationsNotConfigured}
        </span>
      </div>

      {storage ? (
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{providerLabels[storage.provider]}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {storage.accountEmail ? storage.accountEmail : t.integrationsStorageConnectedAccount}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportFiles}
                disabled={exporting}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {exporting ? t.integrationsStorageExporting : t.integrationsStorageExportFiles}
              </button>
              <button
                type="button"
                onClick={disconnect}
                disabled={disconnecting}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-60"
              >
                {disconnecting ? t.integrationsDisconnecting : t.integrationsDisconnect}
              </button>
            </div>
          </div>
          {exportUrl && (
            <p className="mt-3 text-xs text-green-600 dark:text-green-300">
              {t.integrationsStorageExported}{' '}
              {exportUrl.startsWith('http') && (
                <a href={exportUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                  {t.integrationsStorageOpenExport}
                </a>
              )}
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {([
            ['google_drive', t.integrationsGoogleDrive, 'G'],
            ['onedrive', t.integrationsOneDrive, 'O'],
            ['dropbox', t.integrationsDropbox, 'D'],
          ] as const).map(([provider, label, mark]) => (
            <button
              key={provider}
              type="button"
              onClick={() => connect(provider)}
              disabled={loadingProvider !== null}
              className="rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-primary/60 disabled:opacity-60"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-sm font-semibold">{mark}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {loadingProvider === provider ? t.integrationsConnecting : t.integrationsConnectProvider}
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
    </section>
  )
}
