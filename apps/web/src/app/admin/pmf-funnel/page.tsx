import { db } from '@/lib/db'

function fmt(n: number) { return n.toLocaleString('es-ES') }
function pct(num: number, den: number) {
  if (!den) return '0%'
  return `${Math.round((num / den) * 100)}%`
}

function bar(value: number, max: number) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${w}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">{value}</span>
    </div>
  )
}

export default async function PmfFunnelPage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000)

  const [
    totalOrgs,
    totalUsers,
    orgsWithTool,
    orgsWithExecution,
    orgsWithClient,
    orgsWithInvoice,
    orgsWithWorkflow,
    activeUsers30d,
    activeUsers7d,
    signups30d,
    conversions30d,
    topEvents,
  ] = await Promise.all([
    db.organization.count(),
    db.user.count(),

    // Orgs que han instalado al menos 1 herramienta
    db.organization.count({
      where: { workspaces: { some: { toolInstances: { some: {} } } } },
    }),

    // Orgs con al menos 1 ejecución de herramienta
    db.organization.count({
      where: { workspaces: { some: { toolExecutions: { some: {} } } } },
    }),

    // Orgs con al menos 1 cliente
    db.organization.count({
      where: { workspaces: { some: { clients: { some: {} } } } },
    }),

    // Orgs con al menos 1 factura emitida
    db.organization.count({
      where: { workspaces: { some: { invoices: { some: { status: { not: 'borrador' } } } } } },
    }),

    // Orgs con al menos 1 workflow publicado
    db.organization.count({
      where: { workspaces: { some: { workflows: { some: { status: 'PUBLISHED' } } } } },
    }),

    // Usuarios activos últimos 30d (proxy: lastSeenAt)
    db.user.count({ where: { lastSeenAt: { gte: thirtyDaysAgo } } }),
    db.user.count({ where: { lastSeenAt: { gte: sevenDaysAgo } } }),

    // Nuevos registros últimos 30d
    db.organization.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),

    // Conversiones trial→activo últimos 30d
    db.billingEvent.count({ where: { type: 'activated', createdAt: { gte: thirtyDaysAgo } } }),

    // Top 10 eventos de producto últimos 30d
    db.productEvent.groupBy({
      by: ['event'],
      _count: { event: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { _count: { event: 'desc' } },
      take: 10,
    }),
  ])

  const funnelSteps = [
    { label: 'Orgs registradas',         value: totalOrgs,         pctBase: totalOrgs },
    { label: 'Instalaron herramienta',   value: orgsWithTool,      pctBase: totalOrgs },
    { label: 'Ejecutaron herramienta',   value: orgsWithExecution, pctBase: totalOrgs },
    { label: 'Crearon cliente',          value: orgsWithClient,    pctBase: totalOrgs },
    { label: 'Emitieron factura',        value: orgsWithInvoice,   pctBase: totalOrgs },
    { label: 'Publicaron workflow',      value: orgsWithWorkflow,  pctBase: totalOrgs },
  ]

  const maxEvent = topEvents[0]?._count.event ?? 1

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-xl font-bold">PMF Funnel</h1>
        <p className="text-sm text-muted-foreground">Activación y retención — últimos 30 días donde aplica.</p>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Usuarios activos 30d', value: fmt(activeUsers30d), sub: `${pct(activeUsers30d, totalUsers)} del total` },
          { label: 'Usuarios activos 7d',  value: fmt(activeUsers7d),  sub: `${pct(activeUsers7d, totalUsers)} del total` },
          { label: 'Nuevas orgs 30d',      value: fmt(signups30d),     sub: 'registros' },
          { label: 'Conversiones 30d',     value: fmt(conversions30d), sub: 'trial → activo' },
        ].map(c => (
          <div key={c.label} className="border rounded-xl p-5 space-y-1">
            <p className="text-3xl font-black">{c.value}</p>
            <p className="text-xs font-medium">{c.label}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Funnel de activación */}
        <div className="border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold">Funnel de activación</h2>
          <div className="space-y-3">
            {funnelSteps.map((step, i) => (
              <div key={step.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{i + 1}. {step.label}</span>
                  <span className="font-medium tabular-nums">{pct(step.value, step.pctBase)}</span>
                </div>
                {bar(step.value, totalOrgs)}
              </div>
            ))}
          </div>
        </div>

        {/* Top eventos */}
        <div className="border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold">Top eventos (30d)</h2>
          <div className="space-y-3">
            {topEvents.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin eventos registrados</p>
            )}
            {topEvents.map((ev) => (
              <div key={ev.event}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-mono truncate max-w-[180px]">{ev.event}</span>
                  <span className="font-medium tabular-nums">{fmt(ev._count.event)}</span>
                </div>
                {bar(ev._count.event, maxEvent)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen de adopción por módulo */}
      <div className="border rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold">Adopción por módulo</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Herramientas',  value: orgsWithTool,      icon: '🔧' },
            { label: 'Ejecuciones',   value: orgsWithExecution,  icon: '⚡' },
            { label: 'Clientes',      value: orgsWithClient,     icon: '👥' },
            { label: 'Facturas',      value: orgsWithInvoice,    icon: '🧾' },
            { label: 'Workflows',     value: orgsWithWorkflow,   icon: '🔄' },
          ].map(m => (
            <div key={m.label} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <span className="text-xl">{m.icon}</span>
              <div>
                <p className="text-lg font-bold tabular-nums">{pct(m.value, totalOrgs)}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
