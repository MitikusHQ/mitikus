'use server'

import { requireUser } from '@/lib/auth'
import { assertCan } from '@/lib/permissions'
import { db } from '@/lib/db'
import type { AuditAction, AuditEntityType, AuditResult } from '@/lib/audit'

export interface AuditLogRow {
  id: string
  orgId: string
  workspaceId: string | null
  actorUserId: string | null
  actorName: string | null
  actorEmail: string | null
  action: AuditAction
  entityType: AuditEntityType
  entityId: string | null
  result: AuditResult
  metadata: Record<string, unknown> | null
  createdAt: string  // ISO string (server → client)
}

export interface AuditFilters {
  action?: AuditAction
  entityType?: AuditEntityType
  actorUserId?: string
  result?: AuditResult
  from?: string  // ISO date
  to?: string    // ISO date
}

export interface AuditListResult {
  logs: AuditLogRow[]
  total: number
}

// Solo EDITOR o superior puede ver el audit trail del workspace
const AUDIT_ACCESS = 'view_usage' as const  // VIEWER+ — ajustable

export async function listAuditLogs(
  workspaceId: string,
  filters: AuditFilters = {},
  limit = 50,
  offset = 0,
): Promise<AuditListResult | { error: string }> {
  try {
    const user = await requireUser()
    assertCan(user, AUDIT_ACCESS, {
      orgId: user.orgId,
      userId: user.id,
      workspaceId,
      entityType: 'workflow',
    })

    const where = {
      orgId: user.orgId,
      ...(workspaceId ? { workspaceId } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.actorUserId ? { actorUserId: filters.actorUserId } : {}),
      ...(filters.result ? { result: filters.result } : {}),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {}),
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          actorUser: { select: { id: true, name: true, email: true } },
        },
      }),
      db.auditLog.count({ where }),
    ])

    return {
      logs: logs.map((log) => ({
        id: log.id,
        orgId: log.orgId,
        workspaceId: log.workspaceId,
        actorUserId: log.actorUserId,
        actorName: log.actorUser?.name ?? null,
        actorEmail: log.actorUser?.email ?? null,
        action: log.action as AuditAction,
        entityType: log.entityType as AuditEntityType,
        entityId: log.entityId,
        result: log.result as AuditResult,
        metadata: log.metadata as Record<string, unknown> | null,
        createdAt: log.createdAt.toISOString(),
      })),
      total,
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al cargar el audit log' }
  }
}

export interface AuditFilterOptions {
  actors: Array<{ id: string; name: string | null; email: string }>
}

export async function getAuditFilterOptions(
  workspaceId: string,
): Promise<AuditFilterOptions | { error: string }> {
  try {
    const user = await requireUser()
    assertCan(user, AUDIT_ACCESS, {
      orgId: user.orgId,
      userId: user.id,
      workspaceId,
      entityType: 'workflow',
    })

    const actorIds = await db.auditLog.findMany({
      where: { orgId: user.orgId, workspaceId, actorUserId: { not: null } },
      distinct: ['actorUserId'],
      select: { actorUserId: true },
    })

    const ids = actorIds.map((r) => r.actorUserId).filter(Boolean) as string[]

    const actors = await db.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, email: true },
    })

    return { actors }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al cargar los filtros' }
  }
}
