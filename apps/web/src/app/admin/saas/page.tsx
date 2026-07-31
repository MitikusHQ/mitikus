import { requireUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { getAdminSaaSMetrics } from '@/lib/billing/admin-metrics'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'SaaS Metrics — MITIKUS Admin' }

const SUPERADMIN_EMAILS = (process.env.SUPERADMIN_EMAILS ?? 'borjaprietomark82@gmail.com').split(',').map((e) => e.trim())

export default async function AdminSaaSPage() {
  const user = await requireUser()
  if (!SUPERADMIN_EMAILS.includes(user.email)) notFound()

  const m = await getAdminSaaSMetrics()

  const fmtEur = (n: number) =>
    n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
      <div>
        <h1 className="text-xl font-bold">SaaS Metrics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Solo visible para superadmins · Actualizado ahora</p>
      </div>

      {/* MRR highlight */}
      <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-card p-6 flex flex-wrap gap-8 items-center">
        <div className="text-center">
          <p className="text-4xl font-black text-primary">{fmtEur(m.mrrEur)}</p>
          <p className="text-xs text-muted-foreground mt-1">MRR estimado</p>
        </div>
        <div className="text-center">
          <p className="text-4xl font-black">{m.active}</p>
          <p className="text-xs text-muted-foreground mt-1">Clientes activos</p>
        </div>
        <div className="text-center">
          <p className="text-4xl font-black">{m.totalOrgs}</p>
          <p className="text-xs text-muted-foreground mt-1">Organizaciones</p>
        </div>
        <div className="text-center">
          <p className="text-4xl font-black">{m.totalUsers}</p>
          <p className="text-xs text-muted-foreground mt-1">Usuarios totales</p>
        </div>
      </div>

      {/* Dos filas de KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Nuevos (7d)" value={String(m.newUsersLast7d)} sub="usuarios" />
        <KpiCard label="Nuevos (30d)" value={String(m.newUsersLast30d)} sub="usuarios" />
        <KpiCard label="Activos (30d)" value={String(m.activeOrgs)} sub="orgs con actividad" />
        <KpiCard label="En trial" value={String(m.trialing)} sub="organizaciones" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Past due" value={String(m.pastDue)} sub="suscripciones" warn={m.pastDue > 0} />
        <KpiCard label="Cancelados" value={String(m.cancelled)} sub="suscripciones" />
        <KpiCard label="Ejecuciones IA (30d)" value={String(m.toolExecutionsLast30d)} sub="llamadas" />
        <KpiCard label="Coste IA (30d)" value={fmtEur(m.aiCostEurLast30d)} sub="EUR" />
      </div>

      {/* Por plan */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Distribución por plan</h2>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Plan</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Orgs</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Precio/mes</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">MRR parcial</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'] as const).map((tier) => {
                const count = m.byTier[tier] ?? 0
                const price = { STARTER: 39, PROFESSIONAL: 149, BUSINESS: 349, ENTERPRISE: 599 }[tier]
                return (
                  <tr key={tier} className="bg-card">
                    <td className="px-4 py-2.5 font-medium">{tier}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{count}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{fmtEur(price)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium">{fmtEur(count * price)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Fiscal */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Módulo fiscal</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <KpiCard label="Declaraciones totales" value={String(m.totalFiscalDeclarations)} sub="guardadas" />
          <KpiCard label="Presentadas" value={String(m.declaracionesPresentadas)} sub="confirmadas" />
          <KpiCard
            label="Tasa presentación"
            value={m.totalFiscalDeclarations > 0
              ? `${Math.round((m.declaracionesPresentadas / m.totalFiscalDeclarations) * 100)}%`
              : '—'}
            sub="de las guardadas"
          />
        </div>
      </section>
    </div>
  )
}

function KpiCard({ label, value, sub, warn }: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${warn ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10' : 'bg-card'}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-black tabular-nums ${warn ? 'text-red-600 dark:text-red-400' : ''}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}
