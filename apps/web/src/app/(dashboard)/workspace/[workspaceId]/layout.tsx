import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { WorkspaceShell } from './_components/WorkspaceShell'
import { Icons } from './_components/WorkspaceIcons'
import type { NavItem } from './_components/WorkspaceSidebarItem'
import { getPendingCount } from '@/app/actions/today'
import { getMyPendingTaskCount } from '@/app/actions/tasks'

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

  const [workspace, pendingCount, taskCount] = await Promise.all([
    db.workspace.findFirst({
      where: { id: workspaceId, orgId: user.orgId },
      select: { id: true, name: true, logoUrl: true, brandColor: true },
    }),
    getPendingCount(workspaceId, user.id).catch(() => 0),
    getMyPendingTaskCount(workspaceId, user.id).catch(() => 0),
  ])

  if (!workspace) notFound()

  // ── Navegación declarativa filtrada por permisos ──────────────

  const base = `/workspace/${workspaceId}`

  const canView = can(user, 'view_workspace')

  // Top — acceso inmediato diario
  const coreItems: NavItem[] = [
    {
      label: 'Mi día',
      href: `${base}/today`,
      icon: Icons.today,
      description: 'Tus tareas pendientes y actividad del equipo de hoy',
      badge: pendingCount > 0 ? String(pendingCount) : undefined,
    },
    {
      label: 'Arkos',
      href: `${base}/copilot`,
      icon: Icons.copilot,
      description: 'Tu asesor estratégico — cuéntale tus objetivos y te ayuda a planificarlos',
    },
  ].filter(() => canView)

  // Trabajo — operativa del negocio
  const workItems: NavItem[] = [
    {
      label: 'Clientes',
      href: `${base}/clients`,
      icon: Icons.clients,
      description: 'Las empresas o personas a las que prestas servicio',
    },
    {
      label: 'Leads',
      href: `${base}/leads`,
      icon: Icons.leads,
      description: 'Potenciales clientes captados desde tu formulario público',
    },
    {
      label: 'Tareas',
      href: `${base}/tasks`,
      icon: Icons.tasks,
      description: 'Tareas del equipo con etiquetado colaborativo',
      badge: taskCount > 0 ? String(taskCount) : undefined,
    },
    {
      label: 'Herramientas',
      href: `${base}/tools`,
      icon: Icons.tools,
      description: 'Las herramientas que has instalado o creado para tu negocio',
    },
    {
      label: 'Flujos',
      href: `${base}/workflows`,
      icon: Icons.workflows,
      description: 'Encadena varias herramientas para automatizar un proceso completo',
    },
  ].filter(() => canView)

  // Contenido — documentos y planificación
  const contentItems: NavItem[] = [
    {
      label: 'Mi Office',
      href: `${base}/office`,
      icon: Icons.office,
      description: 'Documentos, hojas de cálculo, PDFs, contratos y presentaciones',
    },
    {
      label: 'Misiones',
      href: `${base}/missions`,
      icon: Icons.missions,
      description: 'Objetivos estratégicos y sus pasos de ejecución',
    },
  ].filter(() => canView)

  const dataItems: NavItem[] = [
    {
      label: 'Fiscal',
      href: `${base}/fiscal`,
      icon: Icons.fiscal,
      description: 'Calendario de obligaciones fiscales para tu empresa',
    },
    {
      label: 'Facturas',
      href: `${base}/invoices`,
      icon: Icons.invoices,
      description: 'Crea y gestiona facturas para tus clientes con PDF descargable',
    },
    {
      label: 'Gastos',
      href: `${base}/receipts`,
      icon: Icons.receipts,
      description: 'Escanea tickets y facturas con la cámara — la IA extrae los datos',
    },
    {
      label: 'Analítica',
      href: `${base}/analytics`,
      icon: Icons.analytics,
      description: 'Actividad, ejecuciones y costes de tu workspace',
    },
  ].filter(() => can(user, 'view_usage'))

  const adminItems: NavItem[] = []

  // Audit — VIEWER+ (can view_usage)
  if (can(user, 'view_usage')) {
    adminItems.push({
      label: 'Uso del plan',
      href: `${base}/usage`,
      icon: Icons.usage,
      description: 'Cuánto has generado este mes y cuánto te queda de tu plan',
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

  const profileItems: NavItem[] = [
    {
      label: 'Soporte',
      href: `${base}/support`,
      icon: Icons.support,
      description: 'Asistente de ayuda y contacto con el equipo MITIKUS',
    },
    {
      label: 'Mi perfil',
      href: `${base}/profile`,
      icon: Icons.profile,
      description: 'Tu perfil, control horario y preferencias personales',
    },
  ]

  const navGroups: NavGroup[] = [
    { items: coreItems },
    { label: 'Trabajo', items: workItems },
    { label: 'Contenido', items: contentItems },
    { label: 'Sistema', items: [...dataItems, ...adminItems] },
    { items: profileItems },
  ].filter((g) => g.items.length > 0)

  return (
    <WorkspaceShell
      workspaceId={workspaceId}
      workspaceName={workspace.name}
      workspaceLogoUrl={workspace.logoUrl ?? null}
      workspaceBrandColor={workspace.brandColor ?? '#3B82F6'}
      navGroups={navGroups}
      myId={user.id}
    >
      {children}
    </WorkspaceShell>
  )
}
