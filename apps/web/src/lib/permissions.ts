/**
 * Permission Engine — fuente única de verdad para control de acceso.
 *
 * Uso:
 *   import { can, PermissionAction } from '@/lib/permissions'
 *   if (!can(user, 'install_tool')) throw new Error('Sin permisos')
 *
 * Regla: NUNCA añadir chequeos de rol ad-hoc fuera de este módulo.
 */

import type { OrgRole } from '@prisma/client'
import { auditDenied, type AuditEntityType } from '@/lib/audit'

// Contexto opcional para trazar accesos denegados en el audit log
export interface AssertCanContext {
  orgId: string
  userId: string
  workspaceId?: string | null
  entityType?: AuditEntityType
  entityId?: string | null
}

// ── Jerarquía de roles ───────────────────────────────────────────
// Cuanto mayor el número, más privilegios.
// MEMBER es alias legacy de EDITOR — mismo nivel.

const ROLE_LEVEL: Record<OrgRole, number> = {
  OWNER:    50,
  ADMIN:    40,
  EDITOR:   30,
  MEMBER:   30,  // Legacy alias — mismo nivel que EDITOR
  OPERATOR: 20,
  VIEWER:   10,
}

// ── Catálogo de acciones ─────────────────────────────────────────

export type PermissionAction =
  // Herramientas
  | 'install_tool'
  | 'uninstall_tool'
  | 'configure_tool'
  // Registros
  | 'create_record'
  | 'update_record'
  | 'delete_record'
  // Ejecuciones IA
  | 'execute_tool'
  | 'execute_workflow'
  // Workflows
  | 'create_workflow'
  | 'edit_workflow'
  | 'delete_workflow'
  // Facturación y contratos
  | 'create_invoice'
  | 'edit_invoice'
  | 'delete_invoice'
  | 'send_invoice'
  | 'create_contract'
  | 'sign_contract'
  | 'send_contract'
  | 'delete_contract'
  // Clientes
  | 'create_client'
  | 'edit_client'
  | 'archive_client'
  // Archivos
  | 'manage_files'
  | 'delete_file'
  // Configuración fiscal y de workspace
  | 'manage_fiscal_settings'
  // Organización
  | 'manage_members'
  | 'create_workspace'
  | 'delete_workspace'
  // Administración
  | 'view_admin_panel'
  | 'reset_usage'
  | 'export_data'
  // Lectura — disponible para todos los roles activos
  | 'view_workspace'
  | 'view_usage'

// Nivel mínimo requerido por acción
const ACTION_MIN_LEVEL: Record<PermissionAction, number> = {
  // Herramientas — requieren EDITOR o superior
  install_tool:    ROLE_LEVEL.EDITOR,
  uninstall_tool:  ROLE_LEVEL.EDITOR,
  configure_tool:  ROLE_LEVEL.EDITOR,

  // Registros — crear/editar: OPERATOR+; eliminar: EDITOR+
  create_record: ROLE_LEVEL.OPERATOR,
  update_record: ROLE_LEVEL.OPERATOR,
  delete_record: ROLE_LEVEL.EDITOR,

  // Ejecuciones — OPERATOR+
  execute_tool:     ROLE_LEVEL.OPERATOR,
  execute_workflow: ROLE_LEVEL.OPERATOR,

  // Workflows — EDITOR+
  create_workflow: ROLE_LEVEL.EDITOR,
  edit_workflow:   ROLE_LEVEL.EDITOR,
  delete_workflow: ROLE_LEVEL.EDITOR,

  // Facturación — OPERATOR crea/edita; EDITOR emite, envía y borra
  create_invoice: ROLE_LEVEL.OPERATOR,
  edit_invoice:   ROLE_LEVEL.OPERATOR,
  delete_invoice: ROLE_LEVEL.EDITOR,
  send_invoice:   ROLE_LEVEL.EDITOR,

  // Contratos — EDITOR para todo (acciones con consecuencias legales)
  create_contract: ROLE_LEVEL.EDITOR,
  sign_contract:   ROLE_LEVEL.EDITOR,
  send_contract:   ROLE_LEVEL.EDITOR,
  delete_contract: ROLE_LEVEL.EDITOR,

  // Clientes — OPERATOR crea/edita; EDITOR archiva
  create_client:  ROLE_LEVEL.OPERATOR,
  edit_client:    ROLE_LEVEL.OPERATOR,
  archive_client: ROLE_LEVEL.EDITOR,

  // Archivos — OPERATOR sube/mueve; EDITOR borra y gestiona carpetas
  manage_files: ROLE_LEVEL.OPERATOR,
  delete_file:  ROLE_LEVEL.EDITOR,

  // Datos fiscales — ADMIN (afectan a todas las facturas)
  manage_fiscal_settings: ROLE_LEVEL.ADMIN,

  // Organización — ADMIN+
  manage_members:   ROLE_LEVEL.ADMIN,
  create_workspace: ROLE_LEVEL.ADMIN,
  delete_workspace: ROLE_LEVEL.OWNER,  // Solo OWNER puede eliminar workspaces

  // Administración — ADMIN+
  view_admin_panel: ROLE_LEVEL.ADMIN,
  reset_usage:      ROLE_LEVEL.ADMIN,
  export_data:      ROLE_LEVEL.ADMIN,

  // Lectura — todos los roles activos
  view_workspace: ROLE_LEVEL.VIEWER,
  view_usage:     ROLE_LEVEL.VIEWER,
}

// ── API pública ──────────────────────────────────────────────────

/**
 * Comprueba si un usuario puede realizar una acción.
 * Acepta cualquier objeto que tenga la propiedad `role`.
 */
export function can(
  user: { role: OrgRole },
  action: PermissionAction,
): boolean {
  const userLevel = ROLE_LEVEL[user.role] ?? 0
  const requiredLevel = ACTION_MIN_LEVEL[action]
  return userLevel >= requiredLevel
}

/**
 * Lanza un error si el usuario no tiene permiso.
 * Si se proporciona `ctx`, registra el acceso denegado en el audit log.
 */
export function assertCan(
  user: { role: OrgRole },
  action: PermissionAction,
  ctx?: AssertCanContext,
): void {
  if (!can(user, action)) {
    if (ctx) {
      auditDenied({
        orgId: ctx.orgId,
        workspaceId: ctx.workspaceId,
        actorUserId: ctx.userId,
        entityType: ctx.entityType ?? 'tool_instance',
        entityId: ctx.entityId,
        metadata: { action, role: user.role },
      })
    }
    throw new Error(`Sin permisos para realizar la acción: ${action}`)
  }
}

/**
 * Devuelve el nivel numérico de un rol.
 * Útil para comparar roles directamente.
 */
export function roleLevel(role: OrgRole): number {
  return ROLE_LEVEL[role] ?? 0
}

/**
 * Comprueba si un rol tiene al menos el nivel de otro rol.
 */
export function roleAtLeast(role: OrgRole, minRole: OrgRole): boolean {
  return roleLevel(role) >= roleLevel(minRole)
}

// ── Labels para UI ───────────────────────────────────────────────

export const ROLE_LABELS: Record<OrgRole, string> = {
  OWNER:    'Propietario',
  ADMIN:    'Administrador',
  EDITOR:   'Editor',
  MEMBER:   'Miembro',
  OPERATOR: 'Operador',
  VIEWER:   'Lector',
}

export const ROLE_DESCRIPTIONS: Record<OrgRole, string> = {
  OWNER:    'Acceso total. Puede eliminar la organización y gestionar todos los miembros.',
  ADMIN:    'Acceso total excepto eliminar la organización. Puede gestionar el equipo.',
  EDITOR:   'Puede crear, editar y eliminar herramientas, workflows y registros.',
  MEMBER:   'Rol heredado — mismo nivel que Editor.',
  OPERATOR: 'Puede ejecutar herramientas y añadir registros. No puede crear ni eliminar recursos.',
  VIEWER:   'Solo lectura. No puede crear ni modificar nada.',
}
