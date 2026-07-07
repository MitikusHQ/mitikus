'use server'

import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { assertCan, can, ROLE_LABELS, roleLevel } from '@/lib/permissions'
import { audit } from '@/lib/audit'
import type { OrgRole } from '@prisma/client'

// ── Tipos públicos ────────────────────────────────────────────────

export interface OrgData {
  id: string
  name: string
  sector: string | null
  plan: string
  createdAt: string
}

export interface OrgMember {
  id: string
  name: string | null
  email: string
  role: OrgRole
  roleLabel: string
  createdAt: string
  lastActivityAt: string | null
}

export interface OrgWorkspaceSummary {
  id: string
  name: string
  slug: string
  createdAt: string
  toolCount: number
  workflowCount: number
}

export interface OrgUsageSummary {
  totalCostEUR: number
  totalExecutions: number
  totalTokens: number
  totalWorkflowExecutions: number
}

export interface OrgOverview {
  org: OrgData
  memberCount: number
  workspaceCount: number
  toolCount: number
  workflowCount: number
  usage: OrgUsageSummary
  recentActivity: OrgActivityItem[]
}

export interface OrgActivityItem {
  id: string
  action: string
  entityType: string
  result: string
  actorName: string | null
  createdAt: string
}

// ── getOrgData ────────────────────────────────────────────────────

export async function getOrgData(): Promise<OrgData | { error: string }> {
  try {
    const user = await requireUser()
    const org = await db.organization.findUnique({ where: { id: user.orgId } })
    if (!org) return { error: 'Organización no encontrada' }
    return {
      id: org.id,
      name: org.name,
      sector: org.sector,
      plan: org.plan,
      createdAt: org.createdAt.toISOString(),
    }
  } catch {
    return { error: 'Error al obtener datos de la organización' }
  }
}

// ── getOrgOverview ────────────────────────────────────────────────

export async function getOrgOverview(): Promise<OrgOverview | { error: string }> {
  try {
    const user = await requireUser()
    assertCan(user, 'view_usage', { orgId: user.orgId, userId: user.id })

    const [org, memberCount, workspaceCount, toolCount, workflowCount, usageAgg, wfExecAgg, tokenAgg, recentLogs] =
      await Promise.all([
        db.organization.findUnique({ where: { id: user.orgId } }),
        db.user.count({ where: { orgId: user.orgId } }),
        db.workspace.count({ where: { orgId: user.orgId } }),
        db.toolDefinition.count({ where: { orgId: user.orgId } }),
        db.workflow.count({
          where: { workspace: { orgId: user.orgId } },
        }),
        db.toolExecution.aggregate({
          where: { workspace: { orgId: user.orgId } },
          _sum: { estimatedCostEUR: true },
          _count: { _all: true },
        }),
        db.workflowExecution.count({
          where: { workspace: { orgId: user.orgId } },
        }),
        db.aIUsage.aggregate({
          where: { orgId: user.orgId },
          _sum: { totalTokens: true },
        }),
        db.auditLog.findMany({
          where: { orgId: user.orgId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { actorUser: { select: { name: true, email: true } } },
        }),
      ])

    if (!org) return { error: 'Organización no encontrada' }

    return {
      org: {
        id: org.id,
        name: org.name,
        sector: org.sector,
        plan: org.plan,
        createdAt: org.createdAt.toISOString(),
      },
      memberCount,
      workspaceCount,
      toolCount,
      workflowCount,
      usage: {
        totalCostEUR: Number(usageAgg._sum?.estimatedCostEUR ?? 0),
        totalExecutions: usageAgg._count._all,
        totalTokens: Number(tokenAgg._sum.totalTokens ?? 0),
        totalWorkflowExecutions: wfExecAgg,
      },
      recentActivity: recentLogs.map((l) => ({
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        result: l.result,
        actorName: l.actorUser?.name ?? l.actorUser?.email ?? null,
        createdAt: l.createdAt.toISOString(),
      })),
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al obtener resumen de la organización' }
  }
}

// ── listOrgMembers ────────────────────────────────────────────────

export async function listOrgMembers(): Promise<OrgMember[] | { error: string }> {
  try {
    const user = await requireUser()
    assertCan(user, 'view_usage', { orgId: user.orgId, userId: user.id })

    const members = await db.user.findMany({
      where: { orgId: user.orgId },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    })

    // Last activity: latest audit log per user
    const actorIds = members.map((m) => m.id)
    const lastActivities = await db.auditLog.findMany({
      where: { orgId: user.orgId, actorUserId: { in: actorIds } },
      orderBy: { createdAt: 'desc' },
      distinct: ['actorUserId'],
      select: { actorUserId: true, createdAt: true },
    })
    const activityMap = new Map(lastActivities.map((a) => [a.actorUserId, a.createdAt.toISOString()]))

    return members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      roleLabel: ROLE_LABELS[m.role],
      createdAt: m.createdAt.toISOString(),
      lastActivityAt: activityMap.get(m.id) ?? null,
    }))
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al listar miembros' }
  }
}

// ── updateMemberRole ──────────────────────────────────────────────

export async function updateMemberRole(
  targetUserId: string,
  newRole: OrgRole,
): Promise<{ success: true } | { error: string }> {
  try {
    const actor = await requireUser()
    assertCan(actor, 'manage_members', { orgId: actor.orgId, userId: actor.id, entityType: 'member', entityId: targetUserId })

    const target = await db.user.findFirst({
      where: { id: targetUserId, orgId: actor.orgId },
    })
    if (!target) return { error: 'Usuario no encontrado' }

    // Impedir degradar al último OWNER
    if (target.role === 'OWNER' && newRole !== 'OWNER') {
      const ownerCount = await db.user.count({ where: { orgId: actor.orgId, role: 'OWNER' } })
      if (ownerCount <= 1) return { error: 'No puedes degradar al único propietario de la organización' }
    }

    // ADMIN no puede asignar OWNER ni gestionar otros ADMIN/OWNER
    if (!can(actor, 'delete_workspace')) {
      // Only OWNER can assign OWNER role or demote other OWNERs
      if (newRole === 'OWNER' || target.role === 'OWNER') {
        return { error: 'Solo un propietario puede asignar o cambiar el rol de otro propietario' }
      }
      // ADMIN can't modify other ADMINs
      if (target.role === 'ADMIN' && roleLevel(actor.role) <= roleLevel('ADMIN' as OrgRole)) {
        return { error: 'No tienes permisos para modificar a otro administrador' }
      }
    }

    const oldRole = target.role

    await db.user.update({ where: { id: targetUserId }, data: { role: newRole } })

    audit({
      orgId: actor.orgId,
      actorUserId: actor.id,
      action: 'org.member_role_update',
      entityType: 'member',
      entityId: targetUserId,
      metadata: { oldRole, newRole, targetEmail: target.email },
    })

    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al actualizar rol' }
  }
}

// ── getOrgWorkspaces ──────────────────────────────────────────────

export async function getOrgWorkspaces(): Promise<OrgWorkspaceSummary[] | { error: string }> {
  try {
    const user = await requireUser()
    assertCan(user, 'view_usage', { orgId: user.orgId, userId: user.id })

    const workspaces = await db.workspace.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { toolInstances: true, workflows: true },
        },
      },
    })

    return workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      createdAt: w.createdAt.toISOString(),
      toolCount: w._count.toolInstances,
      workflowCount: w._count.workflows,
    }))
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al obtener workspaces' }
  }
}

// ── getOrgUsageSummary ────────────────────────────────────────────

export async function getOrgUsageSummary(): Promise<OrgUsageSummary | { error: string }> {
  try {
    const user = await requireUser()
    assertCan(user, 'view_usage', { orgId: user.orgId, userId: user.id })

    const [execAgg, wfCount, tokenAgg] = await Promise.all([
      db.toolExecution.aggregate({
        where: { workspace: { orgId: user.orgId } },
        _sum: { estimatedCostEUR: true },
        _count: { _all: true },
      }),
      db.workflowExecution.count({ where: { workspace: { orgId: user.orgId } } }),
      db.aIUsage.aggregate({
        where: { orgId: user.orgId },
        _sum: { totalTokens: true },
      }),
    ])

    return {
      totalCostEUR: Number(execAgg._sum?.estimatedCostEUR ?? 0),
      totalExecutions: execAgg._count._all,
      totalTokens: Number(tokenAgg._sum.totalTokens ?? 0),
      totalWorkflowExecutions: wfCount,
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al obtener uso' }
  }
}

// ── currentUserRole ───────────────────────────────────────────────

export async function getCurrentUserOrgRole(): Promise<{ role: OrgRole; canManageMembers: boolean } | { error: string }> {
  try {
    const user = await requireUser()
    return {
      role: user.role,
      canManageMembers: can(user, 'manage_members'),
    }
  } catch {
    return { error: 'Error al obtener rol' }
  }
}
