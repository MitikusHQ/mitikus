'use server'

import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { ExecutionStatus } from '@prisma/client'
import type { Range } from '@/lib/analytics-utils'

// Re-export para backwards compat con los componentes que ya importan desde aquí
export type { Range } from '@/lib/analytics-utils'

function rangeStart(range: Range): Date {
  const now = new Date()
  if (range === '7d')  return new Date(now.getTime() - 7  * 86_400_000)
  if (range === '30d') return new Date(now.getTime() - 30 * 86_400_000)
  if (range === '90d') return new Date(now.getTime() - 90 * 86_400_000)
  return new Date('2020-01-01T00:00:00Z')
}

// ── Public types ─────────────────────────────────────────────────

export interface AnalyticsSummary {
  totalCostEUR: number
  totalTokens: number
  totalToolExecutions: number
  totalWorkflowExecutions: number
  successRate: number        // 0–1
  avgDurationMs: number
  avgCostPerExecution: number
}

export interface DayPoint {
  day: string   // 'YYYY-MM-DD'
  cost: number
  executions: number
}

export interface ProviderPoint {
  provider: string
  count: number
  costEUR: number
}

export interface ModelPoint {
  model: string
  count: number
  costEUR: number
  tokens: number
}

export interface ToolPoint {
  toolInstanceId: string
  name: string
  count: number
  costEUR: number
}

export interface WorkflowPoint {
  workflowId: string
  name: string
  count: number
  costEUR: number
  failRate: number   // 0–1
}

export interface HealthPoint {
  status: string
  count: number
}

export interface UserPoint {
  userId: string
  name: string
  count: number
  costEUR: number
}

export interface AnalyticsInsight {
  text: string
  type: 'info' | 'warning' | 'success'
}

export interface WorkspaceAnalytics {
  range: Range
  summary: AnalyticsSummary
  timeseries: DayPoint[]
  providerBreakdown: ProviderPoint[]
  modelBreakdown: ModelPoint[]
  topTools: ToolPoint[]
  topWorkflows: WorkflowPoint[]
  executionHealth: HealthPoint[]
  userActivity: UserPoint[]
  insights: AnalyticsInsight[]
}

// ── Main action ──────────────────────────────────────────────────

export async function getWorkspaceAnalytics(
  workspaceId: string,
  range: Range,
): Promise<WorkspaceAnalytics | { error: string }> {
  const user = await requireUser()

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) return { error: 'Workspace no encontrado' }

  if (!can(user, 'view_usage')) return { error: 'Sin permisos para ver analytics' }

  const start = rangeStart(range)
  const dateFilter = { gte: start }
  const truncUnit = range === 'all' ? 'month' : 'day'

  // ── Parallel tier 1: bulk queries ────────────────────────────
  const [
    aiUsageStats,
    toolExecAgg,
    toolExecByStatus,
    workflowExecAgg,
    topToolGroups,
    topWorkflowGroups,
    providerGroups,
    modelGroups,
    userGroups,
    timeseriesRaw,
  ] = await Promise.all([
    db.aIUsage.aggregate({
      where: { workspaceId, createdAt: dateFilter },
      _sum: { estimatedCostEUR: true, totalTokens: true },
    }),
    db.toolExecution.aggregate({
      where: { workspaceId, createdAt: dateFilter },
      _count: { id: true },
      _sum: { durationMs: true },
    }),
    db.toolExecution.groupBy({
      by: ['status'],
      where: { workspaceId, createdAt: dateFilter },
      _count: { id: true },
    }),
    db.workflowExecution.aggregate({
      where: { workspaceId, createdAt: dateFilter },
      _count: { id: true },
    }),
    db.toolExecution.groupBy({
      by: ['toolInstanceId'],
      where: { workspaceId, createdAt: dateFilter },
      _count: { id: true },
      _sum: { estimatedCostEUR: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
    db.workflowExecution.groupBy({
      by: ['workflowId'],
      where: { workspaceId, createdAt: dateFilter },
      _count: { id: true },
      _sum: { totalCostEUR: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
    db.toolExecution.groupBy({
      by: ['provider'],
      where: { workspaceId, createdAt: dateFilter },
      _count: { id: true },
      _sum: { estimatedCostEUR: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    db.toolExecution.groupBy({
      by: ['model'],
      where: { workspaceId, createdAt: dateFilter },
      _count: { id: true },
      _sum: { estimatedCostEUR: true, inputTokens: true, outputTokens: true },
      orderBy: { _sum: { estimatedCostEUR: 'desc' } },
      take: 8,
    }),
    db.toolExecution.groupBy({
      by: ['userId'],
      where: { workspaceId, createdAt: dateFilter },
      _count: { id: true },
      _sum: { estimatedCostEUR: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
    // Raw SQL for date_trunc — truncUnit is 'day' or 'month', never user input
    db.$queryRawUnsafe<Array<{ day: Date; cost: number; executions: number }>>(
      `SELECT date_trunc('${truncUnit}', "createdAt")::date AS day,
              COALESCE(SUM("estimatedCostEUR"), 0)::float8   AS cost,
              COUNT(*)::int                                   AS executions
       FROM tool_executions
       WHERE "workspaceId" = $1 AND "createdAt" >= $2
       GROUP BY 1 ORDER BY 1 ASC`,
      workspaceId,
      start,
    ),
  ])

  // ── Parallel tier 2: resolve names ───────────────────────────
  const toolInstanceIds = topToolGroups.map((t) => t.toolInstanceId)
  const workflowIds     = topWorkflowGroups.map((w) => w.workflowId)
  const userIds         = userGroups.map((u) => u.userId)

  const [toolInstances, workflows, users, workflowFailCounts] = await Promise.all([
    toolInstanceIds.length > 0
      ? db.toolInstance.findMany({
          where: { id: { in: toolInstanceIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as Array<{ id: string; name: string }>),
    workflowIds.length > 0
      ? db.workflow.findMany({
          where: { id: { in: workflowIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as Array<{ id: string; name: string }>),
    userIds.length > 0
      ? db.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        })
      : Promise.resolve([] as Array<{ id: string; name: string | null; email: string }>),
    workflowIds.length > 0
      ? db.workflowExecution.groupBy({
          by: ['workflowId'],
          where: {
            workspaceId,
            workflowId: { in: workflowIds },
            status: ExecutionStatus.FAILED,
            createdAt: dateFilter,
          },
          _count: { id: true },
        })
      : Promise.resolve([] as Array<{ workflowId: string; _count: { id: number } }>),
  ])

  // ── Lookup maps ───────────────────────────────────────────────
  const toolNameMap     = new Map(toolInstances.map((t) => [t.id, t.name]))
  const workflowNameMap = new Map(workflows.map((w) => [w.id, w.name]))
  const userNameMap     = new Map(users.map((u) => [u.id, u.name ?? u.email]))
  const workflowFailMap = new Map(workflowFailCounts.map((w) => [w.workflowId, w._count.id]))

  // ── Build summary ─────────────────────────────────────────────
  const totalCostEUR          = aiUsageStats._sum.estimatedCostEUR ?? 0
  const totalTokens           = aiUsageStats._sum.totalTokens ?? 0
  const totalToolExecutions   = toolExecAgg._count.id
  const totalWorkflowExecutions = workflowExecAgg._count.id

  const statusMap  = new Map(toolExecByStatus.map((s) => [s.status as string, s._count.id]))
  const completed  = statusMap.get('COMPLETED') ?? 0
  const failed     = statusMap.get('FAILED') ?? 0
  const cancelled  = statusMap.get('CANCELLED') ?? 0
  const finished   = completed + failed + cancelled
  const successRate = finished > 0 ? completed / finished : 1

  const totalDurationMs    = toolExecAgg._sum.durationMs ?? 0
  const avgDurationMs      = totalToolExecutions > 0 ? totalDurationMs / totalToolExecutions : 0
  const totalExecutions    = totalToolExecutions + totalWorkflowExecutions
  const avgCostPerExecution = totalExecutions > 0 ? totalCostEUR / totalExecutions : 0

  // ── Build datasets ────────────────────────────────────────────
  const executionHealth: HealthPoint[] = toolExecByStatus.map((s) => ({
    status: s.status as string,
    count: s._count.id,
  }))

  const topTools: ToolPoint[] = topToolGroups.map((t) => ({
    toolInstanceId: t.toolInstanceId,
    name: toolNameMap.get(t.toolInstanceId) ?? 'Herramienta desconocida',
    count: t._count.id,
    costEUR: t._sum.estimatedCostEUR ?? 0,
  }))

  const topWorkflows: WorkflowPoint[] = topWorkflowGroups.map((w) => {
    const total = w._count.id
    const fails = workflowFailMap.get(w.workflowId) ?? 0
    return {
      workflowId: w.workflowId,
      name: workflowNameMap.get(w.workflowId) ?? 'Workflow desconocido',
      count: total,
      costEUR: w._sum.totalCostEUR ?? 0,
      failRate: total > 0 ? fails / total : 0,
    }
  })

  const providerBreakdown: ProviderPoint[] = providerGroups.map((p) => ({
    provider: p.provider,
    count: p._count.id,
    costEUR: p._sum.estimatedCostEUR ?? 0,
  }))

  const modelBreakdown: ModelPoint[] = modelGroups.map((m) => ({
    model: m.model,
    count: m._count.id,
    costEUR: m._sum.estimatedCostEUR ?? 0,
    tokens: (m._sum.inputTokens ?? 0) + (m._sum.outputTokens ?? 0),
  }))

  const userActivity: UserPoint[] = userGroups.map((u) => ({
    userId: u.userId,
    name: userNameMap.get(u.userId) ?? 'Usuario desconocido',
    count: u._count.id,
    costEUR: u._sum.estimatedCostEUR ?? 0,
  }))

  const timeseries: DayPoint[] = timeseriesRaw.map((r) => ({
    day: (r.day instanceof Date ? r.day : new Date(r.day)).toISOString().slice(0, 10),
    cost: Number(r.cost),
    executions: Number(r.executions),
  }))

  // ── Insights ──────────────────────────────────────────────────
  const summary: AnalyticsSummary = {
    totalCostEUR,
    totalTokens,
    totalToolExecutions,
    totalWorkflowExecutions,
    successRate,
    avgDurationMs,
    avgCostPerExecution,
  }

  const insights = generateInsights({ summary, modelBreakdown, topWorkflows, timeseries })

  return {
    range,
    summary,
    timeseries,
    providerBreakdown,
    modelBreakdown,
    topTools,
    topWorkflows,
    executionHealth,
    userActivity,
    insights,
  }
}

// ── Insight generator (rule-based) ──────────────────────────────

function generateInsights(data: {
  summary: AnalyticsSummary
  modelBreakdown: ModelPoint[]
  topWorkflows: WorkflowPoint[]
  timeseries: DayPoint[]
}): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = []

  // No data at all
  if (data.summary.totalToolExecutions === 0 && data.summary.totalWorkflowExecutions === 0) {
    insights.push({
      text: 'Sin ejecuciones en este periodo. Ejecuta alguna herramienta para ver métricas.',
      type: 'info',
    })
    return insights
  }

  // Dominant model (>60% of cost)
  if (data.modelBreakdown.length > 1) {
    const totalCost = data.modelBreakdown.reduce((s, m) => s + m.costEUR, 0)
    const top = data.modelBreakdown[0]
    if (top && totalCost > 0.0001 && top.costEUR / totalCost > 0.6) {
      const pct = Math.round((top.costEUR / totalCost) * 100)
      insights.push({ text: `${top.model} concentra el ${pct}% del coste IA.`, type: 'info' })
    }
  }

  // Failing workflow
  const failingWorkflow = data.topWorkflows
    .filter((w) => w.count >= 3 && w.failRate > 0.3)
    .sort((a, b) => b.failRate - a.failRate)[0]
  if (failingWorkflow) {
    const pct = Math.round(failingWorkflow.failRate * 100)
    insights.push({
      text: `"${failingWorkflow.name}" tiene una tasa de fallo del ${pct}%.`,
      type: 'warning',
    })
  }

  // Cost trend: compare first half vs second half of timeseries
  if (data.timeseries.length >= 8) {
    const half      = Math.floor(data.timeseries.length / 2)
    const firstHalf = data.timeseries.slice(0, half).reduce((s, d) => s + d.cost, 0)
    const lastHalf  = data.timeseries.slice(half).reduce((s, d) => s + d.cost, 0)
    if (firstHalf > 0.0001) {
      const change = (lastHalf - firstHalf) / firstHalf
      if (change > 0.25) {
        insights.push({
          text: `El coste IA ha subido un ${Math.round(change * 100)}% en la segunda mitad del periodo.`,
          type: 'warning',
        })
      } else if (change < -0.25) {
        insights.push({
          text: `El coste IA ha bajado un ${Math.round(Math.abs(change) * 100)}% en la segunda mitad del periodo.`,
          type: 'success',
        })
      }
    }
  }

  // Success rate
  const { successRate, totalToolExecutions } = data.summary
  if (totalToolExecutions >= 5) {
    if (successRate < 0.8) {
      insights.push({
        text: `Tasa de éxito del ${Math.round(successRate * 100)}%. Revisa los errores en el historial.`,
        type: 'warning',
      })
    } else if (successRate >= 0.98) {
      insights.push({
        text: `Tasa de éxito del ${Math.round(successRate * 100)}%. El workspace funciona con alta estabilidad.`,
        type: 'success',
      })
    }
  }

  return insights
}
