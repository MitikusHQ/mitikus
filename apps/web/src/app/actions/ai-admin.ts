'use server'

import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

function startOfTodayUTC(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

// requireAdmin → sustituido por requireRole('ADMIN') del Permission Engine
// requireRole lanza error si el usuario no tiene el nivel mínimo requerido

// Elimina los registros de AIUsage de hoy para la org — reinicia los contadores
export async function resetOrgDailyUsage(): Promise<{ deleted: number } | { error: string }> {
  try {
    const admin = await requireRole('ADMIN')
    const result = await db.aIUsage.deleteMany({
      where: {
        orgId: admin.orgId,
        createdAt: { gte: startOfTodayUTC() },
      },
    })
    return { deleted: result.count }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error desconocido' }
  }
}

// Exporta el historial de uso de los últimos 30 días como CSV
export async function exportOrgUsageCSV(): Promise<{ csv: string } | { error: string }> {
  try {
    const admin = await requireRole('ADMIN')

    const since = new Date()
    since.setDate(since.getDate() - 30)
    since.setUTCHours(0, 0, 0, 0)

    const records = await db.aIUsage.findMany({
      where: { orgId: admin.orgId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    })

    const header = [
      'fecha',
      'userId',
      'workspaceId',
      'modelo',
      'promptChars',
      'tokensEntrada',
      'tokensSalida',
      'tokensTotal',
      'costeEUR',
      'duracionMs',
      'estado',
      'intentos',
      'error',
    ].join(',')

    const rows = records.map((r) =>
      [
        r.createdAt.toISOString(),
        r.userId,
        r.workspaceId ?? '',
        r.model,
        r.promptCharacters,
        r.inputTokens,
        r.outputTokens,
        r.totalTokens,
        r.estimatedCostEUR.toFixed(5),
        r.durationMs,
        r.status,
        r.attempts,
        `"${(r.errorMessage ?? '').replace(/"/g, '""')}"`,
      ].join(','),
    )

    return { csv: [header, ...rows].join('\n') }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error desconocido' }
  }
}

// Devuelve los últimos errores Anthropic de la org (últimas 72h)
export async function getRecentErrors(
  orgId: string,
): Promise<
  Array<{
    id: string
    createdAt: Date
    userId: string
    workspaceId: string | null
    errorMessage: string | null
    durationMs: number
    attempts: number
  }>
> {
  const since = new Date(Date.now() - 72 * 60 * 60 * 1000)
  return db.aIUsage.findMany({
    where: {
      orgId,
      status: 'error',
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      createdAt: true,
      userId: true,
      workspaceId: true,
      errorMessage: true,
      durationMs: true,
      attempts: true,
    },
  })
}
