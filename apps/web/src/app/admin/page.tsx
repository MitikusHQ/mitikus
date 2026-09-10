import { db } from '@/lib/db'
import Link from 'next/link'

export default async function AdminOverviewPage() {
  const [orgCount, userCount, activeTrials, paying] = await Promise.all([
    db.organization.count(),
    db.user.count(),
    db.subscription.count({ where: { status: 'TRIALING' } }),
    db.subscription.count({ where: { status: 'ACTIVE' } }),
  ])

  const cards = [
    { label: 'Organizaciones', value: orgCount, href: '/admin/orgs' },
    { label: 'Usuarios', value: userCount, href: '/admin/orgs' },
    { label: 'Trials activos', value: activeTrials, href: '/admin/saas' },
    { label: 'Clientes de pago', value: paying, href: '/admin/saas' },
  ]

  const shortcuts = [
    { href: '/admin/orgs', label: 'Ver todas las organizaciones →' },
    { href: '/admin/saas', label: 'Métricas SaaS (MRR, churn) →' },
    { href: '/admin/pmf-funnel', label: 'PMF Funnel →' },
    { href: '/admin/core-smoke', label: 'Smoke Tests →' },
  ]

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Panel de administración</h1>
        <p className="text-sm text-muted-foreground mt-1">Solo tú ves esto.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="border rounded-xl p-5 hover:bg-muted/40 transition-colors space-y-1">
            <p className="text-3xl font-black">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="border rounded-xl p-5 space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Accesos rápidos</h2>
        {shortcuts.map((s) => (
          <Link key={s.href} href={s.href} className="block text-sm hover:text-primary transition-colors py-0.5">
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
