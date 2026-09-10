import { db } from '@/lib/db'
import Link from 'next/link'

function fmtDate(d: Date) {
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_LABEL: Record<string, string> = {
  TRIALING: 'Trial',
  ACTIVE: 'Activo',
  PAST_DUE: 'Vencido',
  CANCELED: 'Cancelado',
  UNPAID: 'Impagado',
  INCOMPLETE: 'Incompleto',
}

const STATUS_COLOR: Record<string, string> = {
  TRIALING: 'bg-amber-500/10 text-amber-600',
  ACTIVE: 'bg-emerald-500/10 text-emerald-600',
  PAST_DUE: 'bg-destructive/10 text-destructive',
  CANCELED: 'bg-muted text-muted-foreground',
  UNPAID: 'bg-destructive/10 text-destructive',
  INCOMPLETE: 'bg-muted text-muted-foreground',
}

export default async function AdminOrgsPage() {
  const orgs = await db.organization.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      subscription: { select: { tier: true, status: true, trialEndsAt: true, currentPeriodEnd: true } },
      _count: { select: { users: true, workspaces: true } },
    },
  })

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-bold">Organizaciones</h1>
        <p className="text-sm text-muted-foreground">{orgs.length} en total</p>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Organización</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Estado</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Usuarios</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">WS</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Creada</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Vence</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orgs.map((org) => {
                const sub = org.subscription
                const status = sub?.status ?? 'SIN_SUB'
                const vence = sub?.trialEndsAt ?? sub?.currentPeriodEnd
                return (
                  <tr key={org.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{org.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{org.id.slice(-8)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono">{sub?.tier ?? org.plan}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[status] ?? 'bg-muted text-muted-foreground'}`}>
                        {STATUS_LABEL[status] ?? status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">{org._count.users}</td>
                    <td className="px-4 py-3 text-center tabular-nums">{org._count.workspaces}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(org.createdAt)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {vence ? fmtDate(vence) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
