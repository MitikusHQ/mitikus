import { db } from '@/lib/db'

type CheckResult = { label: string; ok: boolean; detail?: string }

async function runChecks(): Promise<CheckResult[]> {
  const results: CheckResult[] = []

  // 1. DB — lectura básica
  try {
    await db.$queryRaw`SELECT 1`
    results.push({ label: 'Base de datos (lectura)', ok: true })
  } catch (e: unknown) {
    results.push({ label: 'Base de datos (lectura)', ok: false, detail: String(e) })
  }

  // 2. DB — escritura (transacción rollback)
  try {
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1`
      // No hacemos escritura real, solo verificamos que la tx abre
    })
    results.push({ label: 'Base de datos (transacción)', ok: true })
  } catch (e: unknown) {
    results.push({ label: 'Base de datos (transacción)', ok: false, detail: String(e) })
  }

  // 3. Organización mínima existe
  try {
    const count = await db.organization.count()
    results.push({ label: 'Tabla organizations', ok: true, detail: `${count} orgs` })
  } catch (e: unknown) {
    results.push({ label: 'Tabla organizations', ok: false, detail: String(e) })
  }

  // 4. Subscriptions — ninguna con estado inválido
  try {
    const invalid = await db.subscription.count({
      where: { status: { notIn: ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'BLOCKED'] } },
    })
    results.push({
      label: 'Suscripciones con estado válido',
      ok: invalid === 0,
      detail: invalid > 0 ? `${invalid} con estado inválido` : 'Todas válidas',
    })
  } catch (e: unknown) {
    results.push({ label: 'Suscripciones con estado válido', ok: false, detail: String(e) })
  }

  // 5. Facturas emitidas tienen huella
  try {
    const sinHuella = await db.invoice.count({
      where: { status: { not: 'borrador' }, huella: null },
    })
    results.push({
      label: 'Facturas emitidas con huella Verifactu',
      ok: sinHuella === 0,
      detail: sinHuella > 0 ? `⚠️ ${sinHuella} sin huella` : 'Todas correctas',
    })
  } catch (e: unknown) {
    results.push({ label: 'Facturas emitidas con huella Verifactu', ok: false, detail: String(e) })
  }

  // 6. Usuarios sin org (estado huérfano)
  try {
    const orphans = await db.user.count({ where: { orgId: null } })
    results.push({
      label: 'Usuarios sin organización',
      ok: orphans === 0,
      detail: orphans > 0 ? `⚠️ ${orphans} usuarios huérfanos` : 'Ninguno',
    })
  } catch (e: unknown) {
    results.push({ label: 'Usuarios sin organización', ok: false, detail: String(e) })
  }

  // 7. Invitaciones expiradas sin aceptar (info, no fallo)
  try {
    const expired = await db.orgInvitation.count({
      where: { expiresAt: { lt: new Date() }, acceptedAt: null, revokedAt: null },
    })
    results.push({
      label: 'Invitaciones expiradas pendientes',
      ok: true,
      detail: expired > 0 ? `${expired} pendientes de limpiar` : 'Ninguna',
    })
  } catch (e: unknown) {
    results.push({ label: 'Invitaciones expiradas pendientes', ok: false, detail: String(e) })
  }

  // 8. AIUsage con errores recientes (últimas 24h)
  try {
    const errors = await db.aIUsage.count({
      where: {
        status: { in: ['error', 'rate_limited', 'timeout'] },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })
    const total24h = await db.aIUsage.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    })
    const errorRate = total24h > 0 ? Math.round((errors / total24h) * 100) : 0
    results.push({
      label: 'Tasa de error IA (24h)',
      ok: errorRate < 10,
      detail: `${errors} errores / ${total24h} llamadas (${errorRate}%)`,
    })
  } catch (e: unknown) {
    results.push({ label: 'Tasa de error IA (24h)', ok: false, detail: String(e) })
  }

  return results
}

export default async function CoreSmokePage() {
  const checks = await runChecks()
  const passed = checks.filter(c => c.ok).length
  const failed = checks.filter(c => !c.ok).length
  const allOk  = failed === 0

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Smoke Tests</h1>
          <p className="text-sm text-muted-foreground">Comprobaciones críticas del sistema en tiempo real.</p>
        </div>
        <div className={`text-sm font-semibold px-3 py-1.5 rounded-full ${allOk ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
          {allOk ? '✓ Todo OK' : `✗ ${failed} fallo${failed > 1 ? 's' : ''}`}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {passed}/{checks.length} checks pasados · ejecutado {new Date().toLocaleString('es-ES')}
      </div>

      <div className="border rounded-xl divide-y overflow-hidden">
        {checks.map((c) => (
          <div key={c.label} className="flex items-start gap-3 px-4 py-3">
            <span className={`mt-0.5 shrink-0 text-sm ${c.ok ? 'text-emerald-500' : 'text-red-500'}`}>
              {c.ok ? '✓' : '✗'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{c.label}</p>
              {c.detail && <p className="text-xs text-muted-foreground mt-0.5">{c.detail}</p>}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Recarga la página para volver a ejecutar los checks.
      </p>
    </div>
  )
}
