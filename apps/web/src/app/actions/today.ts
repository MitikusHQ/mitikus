'use server'

import { db } from '@/lib/db'

export interface PendingStep {
  stepId: string
  stepTitle: string
  objectiveId: string
  objectiveLabel: string
  clientName: string | null
}

export interface PendingWorkflow {
  workflowId: string
  workflowName: string
  lastExecutionStatus: string | null
  lastExecutionAt: string | null
}

export interface TeamActivityEvent {
  actorName: string
  action: string
  entityLabel: string
  timeAgo: string
  createdAt: string
}

export interface TodayData {
  pendingSteps: PendingStep[]
  pendingWorkflows: PendingWorkflow[]
  teamActivity: TeamActivityEvent[]
  pendingCount: number
}

export async function getPendingCount(workspaceId: string, userId: string): Promise<number> {
  const count = await db.missionStep.count({
    where: {
      workspaceId,
      assignedUserId: userId,
      status: { notIn: ['completed', 'skipped'] },
    },
  })
  return count
}

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'ahora mismo'
  if (diffMin < 60) return `hace ${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `hace ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return `hace ${diffD}d`
}

function formatAction(action: string, entityType: string): string {
  const map: Record<string, string> = {
    'tool.run': 'ejecutó una herramienta',
    'tool.install': 'instaló una herramienta',
    'workflow.executed': 'ejecutó un workflow',
    'workflow.create': 'creó un workflow',
    'mission.step_completed': 'completó un paso de misión',
    'record.create': 'creó un registro',
    'record.update': 'actualizó un registro',
    'client.create': 'añadió un cliente',
  }
  return map[action] ?? `actualizó ${entityType}`
}

export async function getTodayData(workspaceId: string, userId: string): Promise<TodayData> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [rawSteps, rawWorkflows, rawActivity] = await Promise.all([
    db.missionStep.findMany({
      where: {
        workspaceId,
        assignedUserId: userId,
        status: { notIn: ['completed', 'skipped'] },
      },
      select: {
        id: true,
        title: true,
        objectiveId: true,
        objective: {
          select: {
            label: true,
            client: { select: { name: true } },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
      take: 10,
    }),

    db.workflow.findMany({
      where: { workspaceId, status: 'PUBLISHED', isActive: true },
      select: {
        id: true,
        name: true,
        executions: {
          where: { userId },
          select: { status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),

    db.auditLog.findMany({
      where: {
        workspaceId,
        createdAt: { gte: since24h },
        actorUserId: { not: userId },
        result: 'success',
      },
      select: {
        action: true,
        entityType: true,
        createdAt: true,
        actorUser: { select: { name: true } },
        metadata: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  const pendingSteps: PendingStep[] = rawSteps.map((s) => ({
    stepId: s.id,
    stepTitle: s.title,
    objectiveId: s.objectiveId,
    objectiveLabel: s.objective.label,
    clientName: s.objective.client?.name ?? null,
  }))

  const pendingWorkflows: PendingWorkflow[] = rawWorkflows.map((w) => {
    const lastExec = w.executions[0] ?? null
    return {
      workflowId: w.id,
      workflowName: w.name,
      lastExecutionStatus: lastExec?.status ?? null,
      lastExecutionAt: lastExec?.createdAt.toISOString() ?? null,
    }
  })

  const teamActivity: TeamActivityEvent[] = rawActivity.map((e) => {
    const meta = (e.metadata ?? {}) as Record<string, unknown>
    const entityLabel = String(meta['entityName'] ?? meta['name'] ?? e.entityType)
    return {
      actorName: e.actorUser?.name ?? 'Alguien',
      action: formatAction(e.action, e.entityType),
      entityLabel,
      timeAgo: formatTimeAgo(e.createdAt),
      createdAt: e.createdAt.toISOString(),
    }
  })

  return {
    pendingSteps,
    pendingWorkflows,
    teamActivity,
    pendingCount: pendingSteps.length,
  }
}
