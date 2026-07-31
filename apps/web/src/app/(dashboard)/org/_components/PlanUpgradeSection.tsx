'use client'

import { useState } from 'react'
import type { PlanTier } from '@prisma/client'
import { PLAN_CATALOG } from '@/lib/billing/plan-catalog'

const DISPLAY_PLANS = Object.values(PLAN_CATALOG).filter(
  (p): p is typeof p & { priceMonthlyEUR: number } => p.priceMonthlyEUR !== null,
)

function formatLimit(n: number): string {
  return Number.isFinite(n) ? n.toLocaleString('es-ES') : 'Ilimitadas'
}

interface Props {
  currentTier: PlanTier
  trialDaysLeft: number | null
  trialEndsAt: string | null
  hasActiveSubscription: boolean
}

export function PlanUpgradeSection({ currentTier, trialDaysLeft, trialEndsAt, hasActiveSubscription }: Props) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function redirectToBillingUrl(endpoint: string, loadingKey: string, body?: object) {
    setLoadingTier(loadingKey)
    setError(null)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Error al conectar con el sistema de pagos.')
        setLoadingTier(null)
        return
      }
      window.location.href = data.url
    } catch {
      setError('No se pudo conectar con el sistema de pagos.')
      setLoadingTier(null)
    }
  }

  const isBillableTier = DISPLAY_PLANS.some(p => p.tier === currentTier)

  const trialBannerDate = trialEndsAt
    ? new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long' }).format(new Date(trialEndsAt))
    : null

  return (
    <div className="space-y-4">
      {/* Trial banner */}
      {trialDaysLeft !== null && (
        <div className={`rounded-lg px-4 py-3 text-sm flex items-center justify-between gap-4 ${
          trialDaysLeft <= 3
            ? 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
            : 'bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300'
        }`}>
          <span>
            {trialDaysLeft <= 0
              ? 'Tu periodo de prueba ha finalizado. Activa un plan para seguir usando MITIKUS.'
              : `Tu prueba gratuita termina en ${trialDaysLeft} día${trialDaysLeft === 1 ? '' : 's'}${trialBannerDate ? ` (${trialBannerDate})` : ''}.`}
          </span>
        </div>
      )}

      {/* Already subscribed → show portal */}
      {hasActiveSubscription && isBillableTier ? (
        <div className="rounded-lg border bg-card p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">
              Plan actual: {PLAN_CATALOG[currentTier]?.name ?? currentTier}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gestiona tu suscripción, facturas y datos de pago desde el portal de facturación.
            </p>
          </div>
          <button
            onClick={() => redirectToBillingUrl('/api/billing/portal', 'portal')}
            disabled={loadingTier === 'portal'}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loadingTier === 'portal' ? 'Redirigiendo…' : 'Gestionar plan →'}
          </button>
        </div>
      ) : (
        /* Pricing cards */
        <div className="grid gap-3 sm:grid-cols-3">
          {DISPLAY_PLANS.map((plan) => {
            const isCurrent = plan.tier === currentTier
            const isLoading = loadingTier === plan.tier
            const isRecommended = plan.tier === 'PROFESSIONAL'

            return (
              <div
                key={plan.tier}
                className={`relative rounded-xl border bg-card p-5 flex flex-col gap-4 transition-colors ${
                  isRecommended ? 'border-primary/60 shadow-sm' : ''
                } ${isCurrent ? 'ring-1 ring-primary/30' : ''}`}
              >
                {isRecommended && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground uppercase tracking-wide">
                    Recomendado
                  </span>
                )}

                <div>
                  <p className="font-semibold text-sm">{plan.name}</p>
                  <p className="mt-1">
                    <span className="text-2xl font-bold">€{plan.priceMonthlyEUR}</span>
                    <span className="text-xs text-muted-foreground">/mes</span>
                  </p>
                </div>

                <ul className="space-y-1.5 text-xs text-muted-foreground flex-1">
                  <li className="flex items-center gap-1.5">
                    <span className="text-primary">✓</span>
                    {formatLimit(plan.limits.maxUsers)} usuario{plan.limits.maxUsers > 1 ? 's' : ''}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-primary">✓</span>
                    {formatLimit(plan.limits.maxWorkspaces)} workspace{plan.limits.maxWorkspaces > 1 ? 's' : ''}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-primary">✓</span>
                    {formatLimit(plan.limits.aiGenerationsPerMonth)} gen. IA/mes
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-primary">✓</span>
                    {formatLimit(plan.limits.maxToolsInstalled)} herramientas
                  </li>
                  {plan.features.prioritySupport && (
                    <li className="flex items-center gap-1.5">
                      <span className="text-primary">✓</span> Soporte prioritario
                    </li>
                  )}
                </ul>

                <button
                  onClick={() => redirectToBillingUrl('/api/billing/checkout', plan.tier, { tier: plan.tier })}
                  disabled={!!loadingTier || isCurrent}
                  className={`w-full rounded-lg py-2 text-xs font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-muted text-muted-foreground cursor-default'
                      : isRecommended
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
                        : 'border border-input bg-background hover:bg-muted disabled:opacity-50'
                  }`}
                >
                  {isCurrent ? 'Plan actual' : isLoading ? 'Redirigiendo…' : 'Contratar →'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>
      )}
    </div>
  )
}
