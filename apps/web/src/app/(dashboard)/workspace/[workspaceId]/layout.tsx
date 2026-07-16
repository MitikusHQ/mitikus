import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { WorkspaceShell } from './_components/WorkspaceShell'
import { Icons } from './_components/WorkspaceIcons'
import type { NavItem } from './_components/WorkspaceSidebarItem'
import { getPendingCount } from '@/app/actions/today'

interface Props {
  children: React.ReactNode
  params: Promise<{ workspaceId: string }>
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

export default async function WorkspaceLayout({ children, params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const [workspace, pendingCount] = await Promise.all([
    db.workspace.findFirst({
      where: { id: workspaceId, orgId: user.orgId },
      select: { id: true, name: true },
    }),
    getPendingCount(workspaceId, user.id).catch(() => 0),
  ])

  if (!workspace) notFound()

  // ── Navegación declarativa filtrada por permisos ──────────────

  const base = `/workspace/${workspaceId}`

  const mainItems: NavItem[] = [
    {
      label: 'Mi día',
      href: `${base}/today`,
      icon: Icons.today,
      description: 'Tus tareas pendientes y actividad del equipo de hoy',
      badge: pendingCount > 0 ? String(pendingCount) : undefined,
    },
    {
      label: 'Control horario',
      href: `${base}/timelog`,
      icon: Icons.timelog,
      description: 'Fichaje de entrada/salida e imputación de horas por proyecto',
    },
    {
      label: 'Copilot',
      href: `${base}/copilot`,
      icon: Icons.copilot,
      description: 'Tu Director de Operaciones IA — cuéntale tus objetivos y te ayuda a planificarlos',
    },
    {
      label: 'Mission Control',
      href: base,
      icon: Icons.dashboard,
      description: 'Qué es lo más importante que debes hacer hoy en tu empresa',
    },
    {
      label: 'Historial',
      href: `${base}/history`,
      icon: Icons.history,
      description: 'Todo el trabajo generado con IA en este workspace',
    },
    {
      label: 'Herramientas',
      href: `${base}/tools`,
      icon: Icons.tools,
      description: 'Las herramientas con IA que has instalado o generado para tu negocio',
    },
    {
      label: 'Flows',
      href: `${base}/workflows`,
      icon: Icons.workflows,
      description: 'Encadena varias herramientas para automatizar un proceso completo',
    },
    {
      label: 'Clientes',
      href: `${base}/clients`,
      icon: Icons.clients,
      description: 'Las empresas o personas a las que prestas servicio',
    },
  ].filter(() => {
    // All VIEWER+ can see main items
    return can(user, 'view_workspace')
  })

  const dataItems: NavItem[] = [
    {
      label: 'Analytics',
      href: `${base}/analytics`,
      icon: Icons.analytics,
      description: 'Uso de IA, ejecuciones y costes de tu workspace',
    },
  ].filter(() => can(user, 'view_usage'))

  const adminItems: NavItem[] = []

  // Audit — VIEWER+ (can view_usage)
  if (can(user, 'view_usage')) {
    adminItems.push({
      label: 'Uso IA',
      href: `${base}/usage`,
      icon: Icons.usage,
      description: 'Cuánta IA has generado este mes y cuánto te queda de tu plan',
    })
    adminItems.push({
      label: 'Auditoría',
      href: `${base}/audit`,
      icon: Icons.audit,
      description: 'Registro de quién hizo qué y cuándo en este workspace',
    })
  }

  // Org Admin — ADMIN+
  if (can(user, 'manage_members')) {
    adminItems.push({
      label: 'Admin Org',
      href: '/org',
      icon: Icons.settings,
      description: 'Miembros, planes y configuración de tu organización',
    })
  }

  const navGroups: NavGroup[] = [
    { items: mainItems },
    { label: 'Datos', items: dataItems },
    ...(adminItems.length > 0 ? [{ label: 'Administración', items: adminItems }] : []),
  ].filter((g) => g.items.length > 0)

  return (
    <WorkspaceShell
      workspaceId={workspaceId}
      workspaceName={workspace.name}
      navGroups={navGroups}
    >
      {children}
    </WorkspaceShell>
  )
}
