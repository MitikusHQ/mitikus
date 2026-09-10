import type { OrgRole } from '@prisma/client'

export const NAV_SECTIONS = [
  'today', 'arkos', 'brain', 'mail', 'clients', 'leads', 'tasks',
  'tools', 'workflows', 'studio', 'files', 'missions', 'employees',
  'payroll', 'leaves', 'fiscal', 'invoices', 'receipts', 'analytics',
  'admin', 'settings',
] as const

export type NavSection = typeof NAV_SECTIONS[number]

export const NAV_DEFAULTS: Record<OrgRole, NavSection[]> = {
  OWNER:    [...NAV_SECTIONS],
  ADMIN:    [...NAV_SECTIONS],
  EDITOR:   ['today','arkos','brain','mail','clients','leads','tasks','tools','studio','files','missions','leaves','invoices','receipts','settings'],
  MEMBER:   ['today','arkos','brain','mail','clients','leads','tasks','tools','studio','files','missions','leaves','invoices','receipts','settings'],
  OPERATOR: ['today','arkos','mail','clients','tasks','tools','studio','files','settings'],
  VIEWER:   ['today','arkos','mail','clients','tasks','studio','files','missions','settings'],
  EMPLOYEE: ['today','leaves','payroll','settings'],
}

export function getNavSections(role: OrgRole, navPermissions: string[]): NavSection[] {
  if (navPermissions.length > 0) {
    return navPermissions.filter((s): s is NavSection => NAV_SECTIONS.includes(s as NavSection))
  }
  return NAV_DEFAULTS[role] ?? NAV_DEFAULTS.VIEWER
}
