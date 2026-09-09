'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { disconnectAiProviderIntegration, saveAiProviderIntegration } from '@/app/actions/integrations'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'
import type { AiProvider, AiProviderIntegrationState } from '@/lib/integrations/calendar'

export function AiProviderIntegrationClient({
  workspaceId,
  locale,
  aiProvider,
}: {
  workspaceId: string
  locale: Locale
  aiProvider: AiProviderIntegrationState | null
}) {
  const t = getDashboardTranslations(locale)
  const router = useRouter()
  const [provider, setProvider] = useState<AiProvider>(aiProvider?.provider ?? 'openai')
  const [label, setLabel] = useState(aiProvider?.label ?? '')
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const providerLabels: Record<AiProvider, string> = {
    openai: t.integrationsOpenAi,
    anthropic: t.integrationsAnthropic,
    gemini: t.integrationsGemini,
  }

  async function save() {
    if (saving) return
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const result = await saveAiProviderIntegration(workspaceId, provider, apiKey, label)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setApiKey('')
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError(t.integrationsAiSaveError)
    } finally {
      setSaving(false)
    }
  }

  async function disconnect() {
    if (disconnecting) return
    setDisconnecting(true)
    setError(null)
    try {
      await disconnectAiProviderIntegration(workspaceId)
      router.refresh()
    } catch {
      setError(t.integrationsAiDisconnectError)
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{t.integrationsAiTitle}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t.integrationsAiDescription}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${aiProvider ? 'bg-green-500/10 text-green-600 dark:text-green-300' : 'bg-muted text-muted-foreground'}`}>
          {aiProvider ? t.integrationsConfigured : t.integrationsManagedByMitikus}
        </span>
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-sm font-semibold">M</div>
          <div>
            <p className="text-sm font-medium">{t.integrationsMitikusAi}</p>
            <p className="text-xs text-muted-foreground">{t.integrationsManagedByMitikus}</p>
          </div>
        </div>
      </div>

      {aiProvider && (
        <div className="mt-3 rounded-lg border border-border bg-background p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{providerLabels[aiProvider.provider]}</p>
              <p className="mt-1 text-xs text-muted-foreground">{aiProvider.label || t.integrationsAiOwnKeyConfigured}</p>
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
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {(['openai', 'anthropic', 'gemini'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setProvider(option)}
            className={`rounded-lg border p-3 text-left transition-colors hover:border-primary/60 ${provider === option ? 'border-primary bg-primary/5' : 'border-border'}`}
          >
            <span className="text-sm font-medium">{providerLabels[option]}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          {t.integrationsAiKeyLabel}
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={t.integrationsAiKeyPlaceholder}
            autoComplete="new-password"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          {t.integrationsAiLabelLabel}
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t.integrationsAiLabelPlaceholder}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || !apiKey.trim()}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? t.integrationsAiSaving : t.integrationsAiSave}
        </button>
        <p className="text-xs text-muted-foreground">{t.integrationsAiSecurityNote}</p>
      </div>

      {saved && <p className="mt-4 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-600 dark:text-green-300">{t.integrationsAiSaved}</p>}
      {error && <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
    </section>
  )
}
