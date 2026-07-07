/**
 * Audit Trail — capa centralizada de auditoría Enterprise.
 *
 * Uso:
 *   import { audit } from '@/lib/audit'
 *   void audit({ orgId, actorUserId, action: 'tool.install', ... })
 *
 * Regla: audit() es siempre fire-and-forget. Nunca lanza ni bloquea.
 */

import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

// ── Tipos auditables ─────────────────────────────────────────────

export type AuditAction =
  // Herramientas
  | 'tool.install'
  | 'tool.configure'
  | 'tool.execute'
  // Workflows
  | 'workflow.create'
  | 'workflow.update'
  | 'workflow.delete'
  | 'workflow.execute'
  | 'workflow.graph_save'
  | 'workflow.publish'
  | 'workflow.archive'
  | 'workflow.version_create'
  | 'tool.status_change'
  // Registros de datos
  | 'record.create'
  | 'record.update'
  | 'record.delete'
  | 'record.import'
  // Favoritos
  | 'favorite.add'
  | 'favorite.remove'
  // Organización
  | 'org.member_role_update'
  // Control de acceso
  | 'access.denied'
  // Planning Engine
  | 'plan.generated'
  | 'intent.analyze'

export type AuditEntityType =
  | 'tool_instance'
  | 'tool_definition'
  | 'workflow'
  | 'record'
  | 'member'
  | 'planning_engine'

export type AuditResult = 'success' | 'failure' | 'denied'

export interface AuditEvent {
  orgId: string
  workspaceId?: string | null
  actorUserId?: string | null
  action: AuditAction
  entityType: AuditEntityType
  entityId?: string | null
  result?: AuditResult
  metadata?: Record<string, unknown> | null
  ipHint?: string | null
  userAgentHint?: string | null
}

// ── API pública ──────────────────────────────────────────────────

/**
 * Registra un evento de auditoría de forma asíncrona (fire-and-forget).
 * Nunca lanza ni bloquea la operación principal.
 */
export function audit(event: AuditEvent): void {
  const { result = 'success', ...rest } = event

  void db.auditLog
    .create({
      data: {
        orgId: rest.orgId,
        workspaceId: rest.workspaceId ?? null,
        actorUserId: rest.actorUserId ?? null,
        action: rest.action,
        entityType: rest.entityType,
        entityId: rest.entityId ?? null,
        result,
        metadata: rest.metadata as Prisma.InputJsonValue ?? undefined,
        ipHint: rest.ipHint ?? null,
        userAgentHint: rest.userAgentHint ?? null,
      },
    })
    .catch((err: unknown) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[audit] Error al escribir audit log:', err)
      }
    })
}

/**
 * Versión para registrar acceso denegado.
 * Centraliza el campo result='denied' y action='access.denied'.
 */
export function auditDenied(params: {
  orgId: string
  workspaceId?: string | null
  actorUserId?: string | null
  entityType: AuditEntityType
  entityId?: string | null
  metadata?: Record<string, unknown> | null
}): void {
  audit({
    ...params,
    action: 'access.denied',
    result: 'denied',
  })
}
