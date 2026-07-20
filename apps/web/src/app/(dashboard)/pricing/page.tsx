'use client'

import { useState } from 'react'
import { PLAN_CATALOG } from '@/lib/billing/plan-catalog'
import type { PlanTier } from '@prisma/client'

const CHECKOUT_TIERS: PlanTier[] = ['STARTER', 'PROFESSIONAL', 'BUSINESS']

function fmtLimit(n: number, unit: string): string {
  return n === Infinity ? `${unit} ilimitad${unit === 'Herramientas' ? 'as' : 'os'}` : `${n} ${unit.toLowerCase()}`
}

export default function PricingPage() {
  const [loading, setLoading] = useState<PlanTier | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout(tier: PlanTier) {
    setLoading(tier)
    setError(null)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Error al iniciar el pago.')
        return
      }
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Elige el plan que mejor se adapta a tu organización.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {CHECKOUT_TIERS.map((tier) => {
          const plan = PLAN_CATALOG[tier]
          const isLoading = loading === tier
          const isDisabled = loading !== null

          return (
            <div key={tier} className="rounded-xl border bg-card p-6 flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">€{plan.priceMonthlyEUR}</span>
                  <span className="text-sm text-muted-foreground">/mes</span>
                </div>
              </div>

              <ul className="space-y-1.5 text-sm text-muted-foreground flex-1">
                <li>
                  {plan.limits.maxUsers === Infinity
                    ? 'Usuarios ilimitados'
                    : `Hasta ${plan.limits.maxUsers} usuario${plan.limits.maxUsers > 1 ? 's' : ''}`}
                </li>
                <li>{fmtLimit(plan.limits.maxWorkspaces, 'Workspaces')}</li>
                <li>
                  {plan.limits.aiGenerationsPerMonth === Infinity
                    ? 'Generaciones ilimitadas'
                    : `${plan.limits.aiGenerationsPerMonth} generaciones/mes`}
                </li>
                <li>{fmtLimit(plan.limits.maxToolsInstalled, 'Herramientas')}</li>
              </ul>

              <button
                type="button"
                onClick={() => handleCheckout(tier)}
                disabled={isDisabled}
                className="w-full rounded-lg bg-primary text-primary-foreground font-medium py-2.5 text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" aria-hidden />
                    Procesando…
                  </>
                ) : (
                  `Contratar ${plan.name}`
                )}
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center pt-2">
        Todos los precios en EUR, IVA no incluido. Facturación mensual. Cancela cuando quieras.
      </p>
    </div>
  )
}
