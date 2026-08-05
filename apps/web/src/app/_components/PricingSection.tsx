'use client'

import { useState } from 'react'

const PLANS = [
  {
    name:     'Evaluación',
    monthly:  null,
    annual:   null,
    label:    'Gratis',
    period:   '15 días',
    forWhom:  'Prueba con un proyecto real antes de decidir.',
    cta:      'Empezar gratis',
    ctaHref:  '/sign-up',
    features: ['1 usuario', '1 workspace', 'Mi Office completo', 'Arkos IA (limitado)', '5 misiones activas', 'Soporte por email'],
  },
  {
    name:     'Autónomo',
    monthly:  29,
    annual:   26,
    label:    null,
    period:   '/mes',
    forWhom:  'Autónomo o profesional independiente que trabaja solo.',
    cta:      'Contratar',
    ctaHref:  '/sign-up',
    features: ['1 usuario', '1 workspace', 'Mi Office completo', 'Arkos IA', 'Misiones ilimitadas', 'Firma digital OTP', 'Facturación + fiscal', 'Soporte por email'],
  },
  {
    name:     'Starter',
    monthly:  39,
    annual:   35,
    label:    null,
    period:   '/mes',
    forWhom:  'Profesionales independientes o equipos pequeños de hasta 2 personas.',
    cta:      'Contratar',
    ctaHref:  '/sign-up',
    features: ['Hasta 2 usuarios', '1 workspace', 'Mi Office completo', 'Arkos IA', 'Misiones ilimitadas', 'Firma digital OTP', 'Soporte por email'],
  },
  {
    name:        'Professional',
    monthly:     149,
    annual:      134,
    label:       null,
    period:      '/mes',
    forWhom:     'Equipos de hasta 15 personas con todas las herramientas.',
    cta:         'Contratar',
    ctaHref:     '/sign-up',
    highlighted: true,
    features:    ['Hasta 15 usuarios', '3 workspaces', 'Mi Office completo', 'Arkos IA avanzado', 'Misiones + Flujos', 'Firma digital OTP', 'Historial de auditoría', 'Soporte prioritario'],
  },
  {
    name:     'Business',
    monthly:  349,
    annual:   314,
    label:    null,
    period:   '/mes',
    forWhom:  'Empresas en crecimiento, varios equipos o sedes.',
    cta:      'Contratar',
    ctaHref:  '/sign-up',
    features: ['Hasta 50 usuarios', '10 workspaces', 'Todo lo de Professional', 'Analytics avanzados', 'Soporte dedicado'],
  },
  {
    name:     'Enterprise',
    monthly:  null,
    annual:   null,
    label:    'A medida',
    period:   '',
    forWhom:  'SSO, integraciones personalizadas o condiciones específicas.',
    cta:      'Hablar con nosotros',
    ctaHref:  '/sign-up',
    features: ['Usuarios a medida', 'Workspaces a medida', 'Todo lo de Business', 'SSO empresarial', 'Integraciones a medida', 'SLA garantizado', 'Gestor de cuenta'],
  },
]

export function PricingSection() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <h2 className="text-2xl font-bold text-center mb-2">Precios</h2>
      <p className="text-center text-muted-foreground mb-6">Sin letra pequeña. Cancelas cuando quieras.</p>

      {/* Toggle mensual / anual */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={`text-sm font-medium transition-colors ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}>
          Mensual
        </span>
        <button
          type="button"
          role="switch"
          aria-label="Cambiar a facturación anual"
          aria-checked={annual}
          onClick={() => setAnnual((v) => !v)}
          className={`relative w-11 h-6 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
            annual ? 'bg-primary' : 'bg-muted-foreground/30'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              annual ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <span className={`text-sm font-medium transition-colors ${annual ? 'text-foreground' : 'text-muted-foreground'}`}>
          Anual
        </span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          −10%
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const price = plan.label
            ? plan.label
            : annual
              ? `${plan.annual}€`
              : `${plan.monthly}€`
          const period = plan.label
            ? plan.period
            : plan.period

          return (
            <div
              key={plan.name}
              className={`rounded-lg border p-5 flex flex-col transition-shadow ${
                plan.highlighted
                  ? 'border-primary shadow-md ring-1 ring-primary/20'
                  : 'border-border'
              }`}
            >
              {plan.highlighted && (
                <span className="self-start text-[10px] font-bold uppercase tracking-wide text-primary mb-2">
                  Más popular
                </span>
              )}
              <p className="font-semibold text-sm mb-0.5">{plan.name}</p>

              {/* Precio */}
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-bold tabular-nums">{price}</span>
                {period && <span className="text-xs text-muted-foreground">{period}</span>}
              </div>

              {/* Ahorro anual */}
              {annual && plan.monthly && plan.annual && (
                <p className="text-[10px] text-green-600 dark:text-green-400 font-medium mb-2">
                  Ahorras {(plan.monthly - plan.annual) * 12}€/año
                </p>
              )}

              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{plan.forWhom}</p>

              {plan.features.length > 0 && (
                <ul className="space-y-1.5 mb-4 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <span className="text-primary mt-0.5 shrink-0">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}

              <a
                href={plan.ctaHref}
                className={`mt-auto text-center text-sm font-medium px-4 py-2 rounded-md transition-colors ${
                  plan.highlighted
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border border-input hover:bg-accent'
                }`}
              >
                {plan.cta}
              </a>
            </div>
          )
        })}
      </div>
    </div>
  )
}
