import { db } from '@/lib/db'

// Precio mensual estimado por tier (€) — solo para MRR aproximado
const TIER_PRICE: Record<string, number> = {
  AUTONOMO:     19,
  STARTER:      39,
  PROFESSIONAL: 79,
  BUSINESS:     149,
  ENTERPRISE:   299,
}

function fmt(n: number) {
  return n.toLocaleString('es-ES')
}

function fmtEur(n: number) {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function pct(num: number, den: number) {
  if (!den) return '—'
  return `${Math.round((num / den) * 100)}%`
}

const STATUS_LABEL: Record<string, string> = {
  TRIALING: 'Trial', ACTIVE: 'Activo', PAST_DUE: 'Vencido',
  CANCELLED: 'Cancelado', EXPIRED: 'Expirado', BLOCKED: 'Bloqueado',
}
const STATUS_COLOR: Record<string, string> = {
  TRIALING:  'bg-amber-500/10 text-amber-600',
  ACTIVE:    'bg-emerald-500/10 text-emerald-600',
  PAST_DUE:  'bg-red-500/10 text-red-600',
  CANCELLED: 'bg-muted text-muted-foreground',
  EXPIRED:   'bg-muted text-muted-foreground',
  BLOCKED:   'bg-red-500/10 text-red-700',
}

const EVENT_LABEL: Record<string, string> = {
  trial_started:       '🚀 Trial iniciado',
  checkout_completed:  '💳 Checkout completado',
  activated:           '✅ Suscripción activada',
  plan_changed:        '🔄 Plan cambiado',
  payment_failed:      '❌ Pago fallido',
  payment_succeeded:   '💰 Pago recibido',
  cancel_scheduled:    '⏳ Cancelación programada',
  cancelled:           '🚫 Cancelado',
  reactivated:         '♻️ Reactivado',
  trial_expired:       '⌛ Trial expirado',
  blocked:             '🔒 Bloqueado',
}

export default async function AdminSaasPage() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [subs, recentEvents, monthlyOrgs] = await Promise.all([
    db.subscription.findMany({
      select: {
        tier: true, status: true, interval: true,
        createdAt: true, cancelledAt: true, trialEndsAt: true,
        organization: { select: { name: true, createdAt: true } },
      },
    }),
    db.billingEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        type: true, fromTier: true, toTier: true,
        fromStatus: true, toStatus: true, createdAt: true,
        subscription: { select: { organization: { select: { name: true } } } },
      },
    }),
    // Nuevas orgs por mes (últimos 6 meses)
    db.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
             COUNT(*) AS count
      FROM organizations
      WHERE "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY 1
      ORDER BY 1
    `,
  ])

  // ── Métricas ──────────────────────────────────────────────────
  const active    = subs.filter(s => s.status === 'ACTIVE')
  const trialing  = subs.filter(s => s.status === 'TRIALING')
  const cancelled = subs.filter(s => s.status === 'CANCELLED')
  const pastDue   = subs.filter(s => s.status === 'PAST_DUE')

  const mrr = active.reduce((sum, s) => {
    const monthly = s.interval === 'YEARLY'
      ? Math.round((TIER_PRICE[s.tier] ?? 0) * 12 * 0.8 / 12) // descuento anual 20%
      : (TIER_PRICE[s.tier] ?? 0)
    return sum + monthly
  }, 0)

  const arr = mrr * 12

  // Conversión: orgs que pasaron de trial a activo en los últimos 30d
  const trialConversions = recentEvents.filter(
    e => e.type === 'activated' && e.createdAt >= thirtyDaysAgo
  ).length
  const trialStarts30d = recentEvents.filter(
    e => e.type === 'trial_started' && e.createdAt >= thirtyDaysAgo
  ).length

  // Churn: cancelaciones últimos 30d sobre total activos previos
  const churnCount = subs.filter(
    s => s.cancelledAt && s.cancelledAt >= thirtyDaysAgo
  ).length

  // Distribución por tier
  const byTier: Record<string, number> = {}
  for (const s of active) {
    byTier[s.tier] = (byTier[s.tier] ?? 0) + 1
  }

  const cards = [
    { label: 'MRR estimado',      value: fmtEur(mrr),          sub: `ARR: ${fmtEur(arr)}` },
    { label: 'Clientes activos',  value: fmt(active.length),    sub: `${fmt(pastDue.length)} con pago vencido` },
    { label: 'Trials activos',    value: fmt(trialing.length),  sub: `${trialConversions} convertidos este mes` },
    { label: 'Churn 30d',         value: fmt(churnCount),       sub: pct(churnCount, active.length + churnCount) + ' del total' },
  ]

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-xl font-bold">Métricas SaaS</h1>
        <p className="text-sm text-muted-foreground">MRR estimado con precios base — sin descuentos personalizados ni add-ons.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="border rounded-xl p-5 space-y-1">
            <p className="text-3xl font-black">{c.value}</p>
            <p className="text-xs font-medium text-foreground">{c.label}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Distribución por tier */}
        <div className="border rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold">Distribución por plan</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase">
                <th className="text-left pb-2">Plan</th>
                <th className="text-right pb-2">Clientes</th>
                <th className="text-right pb-2">MRR</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.entries(TIER_PRICE).map(([tier, price]) => {
                const count = byTier[tier] ?? 0
                return (
                  <tr key={tier} className="py-2">
                    <td className="py-2 font-mono text-xs">{tier}</td>
                    <td className="py-2 text-right tabular-nums">{count}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">{fmtEur(count * price)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Crecimiento mensual */}
        <div className="border rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold">Nuevas organizaciones (últimos 6 meses)</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase">
                <th className="text-left pb-2">Mes</th>
                <th className="text-right pb-2">Nuevas orgs</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {monthlyOrgs.map(row => (
                <tr key={row.month}>
                  <td className="py-2">{row.month}</td>
                  <td className="py-2 text-right tabular-nums font-medium">{Number(row.count)}</td>
                </tr>
              ))}
              {monthlyOrgs.length === 0 && (
                <tr><td colSpan={2} className="py-4 text-center text-muted-foreground text-xs">Sin datos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Estado de suscripciones */}
      <div className="border rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold">Estado de suscripciones</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUS_LABEL).map(([status, label]) => {
            const count = subs.filter(s => s.status === status).length
            return (
              <div key={status} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${STATUS_COLOR[status] ?? 'bg-muted text-muted-foreground'}`}>
                {label} <span className="font-black">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Feed de eventos recientes */}
      <div className="border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b bg-muted/30">
          <h2 className="text-sm font-semibold">Últimos eventos de billing</h2>
        </div>
        <div className="divide-y">
          {recentEvents.map((ev, i) => (
            <div key={i} className="px-5 py-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{EVENT_LABEL[ev.type] ?? ev.type}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {ev.subscription?.organization?.name ?? '—'}
                  {ev.fromTier && ev.toTier ? ` · ${ev.fromTier} → ${ev.toTier}` : ''}
                  {ev.fromStatus && ev.toStatus ? ` · ${ev.fromStatus} → ${ev.toStatus}` : ''}
                </p>
              </div>
              <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{fmtDate(ev.createdAt)}</p>
            </div>
          ))}
          {recentEvents.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">Sin eventos registrados</p>
          )}
        </div>
      </div>
    </div>
  )
}
