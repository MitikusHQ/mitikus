'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PLAN_CATALOG } from '@/lib/billing/plan-catalog'
import type { PlanTier } from '@prisma/client'

const CHECKOUT_TIERS: PlanTier[] = ['AUTONOMO', 'STARTER', 'PROFESSIONAL', 'BUSINESS']

const UNLIMITED = Number.MAX_SAFE_INTEGER

function fmtLimit(n: number, unit: string): string {
  return n >= UNLIMITED ? `${unit} ilimitad${unit === 'Herramientas' ? 'as' : 'os'}` : `${n} ${unit.toLowerCase()}`
}

export default function PricingPage() {
  const [loading, setLoading] = useState<PlanTier | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleCheckout(tier: PlanTier) {
    setLoading(tier)
    setError(null)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })

      // No autenticado → redirigir al registro con el plan seleccionado
      if (res.status === 401) {
        router.push(`/sign-up?plan=${tier}`)
        return
      }

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
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Planes y precios</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Todo lo que necesitas para gestionar tu negocio. Sin permanencia, cancela cuando quieras.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CHECKOUT_TIERS.map((tier) => {
            const plan = PLAN_CATALOG[tier]
            if (!plan) return null
            const isLoading = loading === tier
            const isDisabled = loading !== null
            const isPopular = tier === 'PROFESSIONAL'

            return (
              <div
                key={tier}
                className={`rounded-xl border bg-card p-6 flex flex-col gap-5 relative ${isPopular ? 'border-primary shadow-md' : ''}`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground">
                    Más popular
                  </span>
                )}

                <div>
                  <h2 className="text-base font-semibold">{plan.name}</h2>
                  <div className="mt-1.5 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">€{plan.priceMonthlyEUR}</span>
                    <span className="text-sm text-muted-foreground">/mes</span>
                  </div>
                </div>

                <ul className="space-y-1.5 text-sm text-muted-foreground flex-1">
                  <li>
                    {plan.limits.maxUsers >= UNLIMITED
                      ? 'Usuarios ilimitados'
                      : `Hasta ${plan.limits.maxUsers} usuario${plan.limits.maxUsers > 1 ? 's' : ''}`}
                  </li>
                  <li>{fmtLimit(plan.limits.maxWorkspaces, 'Workspaces')}</li>
                  <li>
                    {plan.limits.aiGenerationsPerMonth >= UNLIMITED
                      ? 'Generaciones ilimitadas'
                      : `${plan.limits.aiGenerationsPerMonth} generaciones/mes`}
                  </li>
                  <li>{fmtLimit(plan.limits.maxToolsInstalled, 'Herramientas')}</li>
                </ul>

                <button
                  type="button"
                  onClick={() => handleCheckout(tier)}
                  disabled={isDisabled}
                  className={`w-full rounded-lg font-medium py-2.5 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    isPopular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-current/40 border-t-current animate-spin" aria-hidden />
                      Procesando…
                    </>
                  ) : (
                    `Empezar con ${plan.name}`
                  )}
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2">
          Todos los precios en EUR, IVA incluido. Facturación mensual. Cancela cuando quieras.
        </p>
      </div>
    </div>
  )
}
