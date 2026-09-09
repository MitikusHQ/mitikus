'use client'

import { useState, useTransition } from 'react'
import { Copy, Link2, RefreshCw, Trash2 } from 'lucide-react'
import { disconnectFormsWebhookIntegration, rotateFormsWebhookIntegration } from '@/app/actions/integrations'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'
import type { FormsIntegrationState } from '@/lib/integrations/calendar'

interface Props {
  workspaceId: string
  locale: Locale
  forms: FormsIntegrationState | null
}

export function FormsIntegrationClient({ workspaceId, locale, forms: initialForms }: Props) {
  const t = getDashboardTranslations(locale)
  const [forms, setForms] = useState(initialForms)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const providers = [t.integrationsTypeform, t.integrationsGoogleForms, t.integrationsTally, t.integrationsJotform]

  function handleRotate() {
    setMessage('')
    startTransition(async () => {
      const result = await rotateFormsWebhookIntegration(workspaceId)
      if (!result.ok) {
        setMessage(t.integrationsFormsActionError)
        return
      }
      setForms(result.forms)
      setWebhookUrl(result.webhookUrl)
      setMessage(t.integrationsFormsWebhookReady)
    })
  }

  function handleDisconnect() {
    setMessage('')
    startTransition(async () => {
      const result = await disconnectFormsWebhookIntegration(workspaceId)
      if (!result.ok) {
        setMessage(t.integrationsFormsActionError)
        return
      }
      setForms(null)
      setWebhookUrl('')
    })
  }

  async function handleCopy() {
    if (!webhookUrl) return
    await navigator.clipboard.writeText(webhookUrl)
    setMessage(t.integrationsFormsCopied)
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-200">
              <Link2 className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold">{t.integrationsFormsTitle}</h2>
              <p className="text-sm text-muted-foreground">{t.integrationsFormsDescription}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t.integrationsFormsWebhookHelp}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRotate}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            {forms ? t.integrationsFormsRotateToken : t.integrationsFormsEnableWebhook}
          </button>
          {forms && (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {t.integrationsFormsDisableWebhook}
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {providers.map((provider) => (
          <span key={provider} className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
            {provider}
          </span>
        ))}
      </div>

      {forms && (
        <div className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
          <strong>{t.integrationsFormsWebhookActive}</strong>
          <span className="ml-2 text-emerald-100/80">
            {t.integrationsFormsTokenPreview}: {forms.webhookTokenPreview}...
          </span>
        </div>
      )}

      {webhookUrl && (
        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.integrationsFormsWebhookUrl}</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={webhookUrl}
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/5"
            >
              <Copy className="h-4 w-4" />
              {t.integrationsFormsCopyUrl}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">{t.integrationsFormsTokenOnlyShownOnce}</p>
        </div>
      )}

      {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
    </section>
  )
}
