'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { disconnectCalendarIntegration, getCalendarConnectionUrl } from '@/app/actions/integrations'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'
import type { CalendarIntegrationState, CalendarProvider } from '@/lib/integrations/calendar'

export function CalendarIntegrationClient({
  workspaceId,
  locale,
  calendar,
}: {
  workspaceId: string
  locale: Locale
  calendar: CalendarIntegrationState | null
}) {
  const t = getDashboardTranslations(locale)
  const router = useRouter()
  const [loadingProvider, setLoadingProvider] = useState<CalendarProvider | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function connect(provider: CalendarProvider) {
    if (loadingProvider) return
    setLoadingProvider(provider)
    setError(null)
    try {
      const result = await getCalendarConnectionUrl(workspaceId, provider)
      if (!result.ok) {
        setError(result.error)
        return
      }
      window.location.href = result.url
    } catch {
      setError(t.integrationsCalendarConnectError)
      setLoadingProvider(null)
    }
  }

  async function disconnect() {
    if (disconnecting) return
    setDisconnecting(true)
    setError(null)
    try {
      await disconnectCalendarIntegration(workspaceId)
      router.refresh()
    } catch {
      setError(t.integrationsCalendarDisconnectError)
    } finally {
      setDisconnecting(false)
    }
  }

  const providerLabel = calendar?.provider === 'google'
    ? t.integrationsGoogleCalendar
    : calendar?.provider === 'outlook'
      ? t.integrationsOutlookCalendar
      : null

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{t.integrationsCalendarTitle}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t.integrationsCalendarDescription}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${calendar ? 'bg-green-500/10 text-green-600 dark:text-green-300' : 'bg-muted text-muted-foreground'}`}>
          {calendar ? t.integrationsConfigured : t.integrationsNotConfigured}
        </span>
      </div>

      {calendar && providerLabel ? (
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{providerLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {calendar.accountEmail ? calendar.accountEmail : t.integrationsCalendarConnectedAccount}
              </p>
            </div>
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
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => connect('google')}
            disabled={loadingProvider !== null}
            className="rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-primary/60 disabled:opacity-60"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-sm font-semibold">G</span>
              <span>
                <span className="block text-sm font-medium">{t.integrationsGoogleCalendar}</span>
                <span className="block text-xs text-muted-foreground">
                  {loadingProvider === 'google' ? t.integrationsConnecting : t.integrationsConnectProvider}
                </span>
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => connect('outlook')}
            disabled={loadingProvider !== null}
            className="rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-primary/60 disabled:opacity-60"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-sm font-semibold">O</span>
              <span>
                <span className="block text-sm font-medium">{t.integrationsOutlookCalendar}</span>
                <span className="block text-xs text-muted-foreground">
                  {loadingProvider === 'outlook' ? t.integrationsConnecting : t.integrationsConnectProvider}
                </span>
              </span>
            </span>
          </button>
        </div>
      )}

      {error && <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
    </section>
  )
}
