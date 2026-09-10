import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { getNavSections } from '@/lib/nav-permissions'
import { auth, currentUser } from '@clerk/nextjs/server'
import { WorkspaceShell } from './_components/WorkspaceShell'
import { Icons } from './_components/WorkspaceIcons'
import type { NavItem } from './_components/WorkspaceSidebarItem'
import { getPendingCount } from '@/app/actions/today'
import { getMyPendingTaskCount } from '@/app/actions/tasks'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  children: React.ReactNode
  params: Promise<{ workspaceId: string }>
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

export default async function WorkspaceLayout({ children, params }: Props) {
  const [{ workspaceId }, user, clerkUser, locale] = await Promise.all([params, requireUser(), currentUser(), getLocale()])
  const t = getDashboardTranslations(locale)

  const [workspace, pendingCount, taskCount] = await Promise.all([
    db.workspace.findFirst({
      where: { id: workspaceId, orgId: user.orgId },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        brandColor: true,
        logoShowName: true,
        logoCropX: true,
        logoCropY: true,
        logoCropZoom: true,
        logoTextX: true,
        logoTextY: true,
        logoTextSize: true,
        logoTextColor: true,
        logoTextFont: true,
      },
    }),
    getPendingCount(workspaceId, user.id).catch(() => 0),
    getMyPendingTaskCount(workspaceId, user.id).catch(() => 0),
  ])

  if (!workspace) notFound()

  // ── Navegación declarativa filtrada por permisos ──────────────

  const base = `/workspace/${workspaceId}`

  const allowed = new Set(getNavSections(user.role, user.navPermissions ?? []))
  const show = (section: string) => allowed.has(section as never)

  const coreItems: NavItem[] = [
    show('today') && {
      label: t.navToday, href: `${base}/today`, icon: Icons.today,
      description: t.descToday, badge: pendingCount > 0 ? String(pendingCount) : undefined,
    },
    show('arkos') && {
      label: t.navCopilot, href: `${base}/copilot`, icon: Icons.copilot, description: t.descCopilot,
    },
    show('brain') && {
      label: t.navBrain, href: `${base}/brain`, icon: Icons.brain, description: t.descBrain,
    },
    show('mail') && {
      label: t.navMail, href: `${base}/mail`, icon: Icons.mail, description: t.descMail,
    },
  ].filter(Boolean) as NavItem[]

  // Acordeón Trabajo — Leads, Herramientas, Flujos (secundarios)
  const workSecondary: NavItem[] = [
    show('leads') && { label: t.navLeads, href: `${base}/leads`, icon: Icons.leads, description: t.descLeads },
    show('tools') && { label: t.navTools, href: `${base}/tools`, icon: Icons.tools, description: t.descTools },
    show('workflows') && { label: t.navWorkflows, href: `${base}/workflows`, icon: Icons.workflows, description: t.descWorkflows },
  ].filter(Boolean) as NavItem[]

  // Clientes y Tareas siempre visibles (capa 1 de trabajo)
  const workCoreItems: NavItem[] = [
    show('clients') && { label: t.navClients, href: `${base}/clients`, icon: Icons.clients, description: t.descClients },
    show('tasks') && { label: t.navTasks, href: `${base}/tasks`, icon: Icons.tasks, description: t.descTasks, badge: taskCount > 0 ? String(taskCount) : undefined },
  ].filter(Boolean) as NavItem[]

  // Acordeón Contenido
  const contentChildren: NavItem[] = [
    show('studio') && { label: t.navOffice, href: `${base}/office`, icon: Icons.office, description: t.descOffice },
    show('files') && { label: t.navFiles, href: `${base}/files`, icon: Icons.files, description: t.descFiles },
    show('missions') && { label: t.navMissions, href: `${base}/missions`, icon: Icons.missions, description: t.descMissions },
  ].filter(Boolean) as NavItem[]

  // Acordeón RRHH
  const hrChildren: NavItem[] = [
    show('employees') && { label: t.navEmployees, href: `${base}/employees`, icon: Icons.employees, description: t.descEmployees },
    show('payroll') && { label: t.navPayroll, href: `${base}/payroll`, icon: Icons.payroll, description: t.descPayroll },
    show('leaves') && { label: t.navLeaves, href: `${base}/leaves`, icon: Icons.leaves, description: t.descLeaves },
    { label: locale === 'es' ? 'Control horario' : 'Time Tracking', href: `${base}/timelog`, icon: Icons.timelog, description: locale === 'es' ? 'Registro de jornada e imputación de horas' : 'Workday record and hour allocation' },
  ].filter(Boolean) as NavItem[]

  // Acordeón Sistema
  const superadminEmails = (process.env.SUPERADMIN_EMAILS ?? 'borjaprietomark82@gmail.com').split(',').map(e => e.trim())
  const clerkEmail = clerkUser?.emailAddresses?.[0]?.emailAddress ?? ''
  const isSuperadmin = superadminEmails.includes(clerkEmail)

  const sistemaChildren: NavItem[] = [
    show('fiscal') && { label: t.navFiscal, href: `${base}/fiscal`, icon: Icons.fiscal, description: t.descFiscal },
    show('invoices') && { label: t.navInvoices, href: `${base}/invoices`, icon: Icons.invoices, description: t.descInvoices },
    show('receipts') && { label: t.navReceipts, href: `${base}/receipts`, icon: Icons.receipts, description: t.descReceipts },
    show('analytics') && { label: t.navAnalytics, href: `${base}/analytics`, icon: Icons.analytics, description: t.descAnalytics },
    { label: locale === 'es' ? 'Historial' : 'History', href: `${base}/history`, icon: Icons.history, description: locale === 'es' ? 'Historial de ejecuciones IA' : 'AI execution history' },
    ...(can(user, 'view_usage') ? [
      { label: t.navUsage, href: `${base}/usage`, icon: Icons.usage, description: t.descUsage },
      { label: t.navAudit, href: `${base}/audit`, icon: Icons.audit, description: t.descAudit },
    ] : []),
    ...(show('admin') && can(user, 'manage_members') ? [
      { label: t.navAdminOrg, href: '/org', icon: Icons.organization, description: t.descAdminOrg },
    ] : []),
  ].filter(Boolean) as NavItem[]

  const profileChildren: NavItem[] = [
    { label: locale === 'es' ? 'Ajustes' : 'Settings', href: `${base}/settings`, icon: Icons.settings, description: locale === 'es' ? 'Configuración del workspace' : 'Workspace settings' },
    { label: locale === 'es' ? 'Integraciones' : 'Integrations', href: `${base}/integrations`, icon: Icons.integrations, description: locale === 'es' ? 'Conecta herramientas externas' : 'Connect external tools' },
    { label: locale === 'es' ? 'App de escritorio' : 'Desktop app', href: '/download', icon: Icons.download, description: locale === 'es' ? 'Descarga la app nativa' : 'Download the native app' },
    { label: locale === 'es' ? 'Soporte' : 'Support', href: `${base}/support`, icon: Icons.support, description: locale === 'es' ? 'Ayuda y contacto' : 'Help and contact' },
    ...(isSuperadmin ? [{ label: 'MITIKUS Admin', href: '/admin', icon: Icons.admin, description: 'Panel de control de MITIKUS' }] : []),
  ].filter((item) => {
    if (item.href === `${base}/settings` && !show('settings')) return false
    return true
  })

  const profileItems: NavItem[] = [
    {
      label: t.navProfile,
      href: `${base}/profile`,
      icon: Icons.profile,
      description: t.descProfile,
      children: profileChildren,
    },
  ]

  // Ítem acordeón Trabajo (secundarios: leads, herramientas, flujos)
  const trabajoAccordion: NavItem[] = workSecondary.length > 0 ? [{
    label: locale === 'es' ? 'Más trabajo' : 'More work',
    href: `${base}/tools`,
    icon: Icons.tools,
    description: locale === 'es' ? 'Leads, herramientas y flujos' : 'Leads, tools and workflows',
    children: workSecondary,
  }] : []

  // Ítem acordeón Contenido
  const contenidoAccordion: NavItem[] = contentChildren.length > 0 ? [{
    label: locale === 'es' ? 'Contenido' : 'Content',
    href: `${base}/office`,
    icon: Icons.office,
    description: locale === 'es' ? 'Studio, archivos y misiones' : 'Studio, files and missions',
    children: contentChildren,
  }] : []

  // Ítem acordeón RRHH
  const rrhhAccordion: NavItem[] = hrChildren.length > 0 ? [{
    label: locale === 'es' ? 'RRHH' : 'HR',
    href: `${base}/employees`,
    icon: Icons.employees,
    description: locale === 'es' ? 'Empleados, nóminas y permisos' : 'Employees, payroll and leaves',
    children: hrChildren,
  }] : []

  // Ítem acordeón Sistema
  const sistemaAccordion: NavItem[] = sistemaChildren.length > 0 ? [{
    label: locale === 'es' ? 'Sistema' : 'System',
    href: `${base}/invoices`,
    icon: Icons.invoices,
    description: locale === 'es' ? 'Fiscal, facturas, analítica y más' : 'Fiscal, invoices, analytics and more',
    children: sistemaChildren,
  }] : []

  const navGroups: NavGroup[] = [
    { items: coreItems },
    { items: [...workCoreItems, ...trabajoAccordion, ...contenidoAccordion, ...rrhhAccordion, ...sistemaAccordion] },
    { items: profileItems },
  ].filter((g) => g.items.length > 0)

  return (
    <WorkspaceShell
      workspaceId={workspaceId}
      workspaceName={workspace.name}
      workspaceLogoUrl={workspace.logoUrl ?? null}
      workspaceBrandColor={workspace.brandColor ?? '#3B82F6'}
      workspaceLogoShowName={workspace.logoShowName}
      workspaceLogoCrop={{ x: workspace.logoCropX, y: workspace.logoCropY, zoom: workspace.logoCropZoom }}
      workspaceLogoText={{
        x: workspace.logoTextX,
        y: workspace.logoTextY,
        size: workspace.logoTextSize,
        color: workspace.logoTextColor,
        font: workspace.logoTextFont,
      }}
      userAvatarUrl={user.avatarUrl ?? null}
      navGroups={navGroups}
      myId={user.id}
      locale={locale}
    >
      {children}
    </WorkspaceShell>
  )
}



