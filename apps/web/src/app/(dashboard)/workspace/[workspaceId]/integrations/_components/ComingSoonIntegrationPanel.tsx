'use client'

import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'

interface Provider {
  name: string
  mark: string
  status?: string
}

export function ComingSoonIntegrationPanel({
  locale,
  title,
  description,
  providers,
}: {
  locale: Locale
  title: string
  description: string
  providers: Provider[]
}) {
  const t = getDashboardTranslations(locale)

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {t.integrationsComingSoon}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {providers.map((provider) => (
          <div key={provider.name} className="rounded-lg border border-dashed border-border bg-background p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-sm font-semibold">
                {provider.mark}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{provider.name}</p>
                <p className="text-xs text-muted-foreground">{provider.status ?? t.integrationsNotConfigured}</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{t.integrationsRequiresSetup}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
