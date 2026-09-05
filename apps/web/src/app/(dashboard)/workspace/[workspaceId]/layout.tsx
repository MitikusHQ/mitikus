import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
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
  const [{ workspaceId }, user, locale] = await Promise.all([params, requireUser(), getLocale()])
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

  const canView = can(user, 'view_workspace')

  // Top — acceso inmediato diario
  const coreItems: NavItem[] = [
    {
      label: t.navToday,
      href: `${base}/today`,
      icon: Icons.today,
      description: t.descToday,
      badge: pendingCount > 0 ? String(pendingCount) : undefined,
    },
    {
      label: t.navCopilot,
      href: `${base}/copilot`,
      icon: Icons.copilot,
      description: t.descCopilot,
    },
    {
      label: t.navBrain,
      href: `${base}/brain`,
      icon: Icons.brain,
      description: t.descBrain,
    },
    {
      label: t.navMail,
      href: `${base}/mail`,
      icon: Icons.mail,
      description: t.descMail,
    },
  ].filter(() => canView)

  // Trabajo — operativa del negocio
  const workItems: NavItem[] = [
    {
      label: t.navClients,
      href: `${base}/clients`,
      icon: Icons.clients,
      description: t.descClients,
    },
    {
      label: t.navLeads,
      href: `${base}/leads`,
      icon: Icons.leads,
      description: t.descLeads,
    },
    {
      label: t.navTasks,
      href: `${base}/tasks`,
      icon: Icons.tasks,
      description: t.descTasks,
      badge: taskCount > 0 ? String(taskCount) : undefined,
    },
    {
      label: t.navTools,
      href: `${base}/tools`,
      icon: Icons.tools,
      description: t.descTools,
    },
    {
      label: t.navWorkflows,
      href: `${base}/workflows`,
      icon: Icons.workflows,
      description: t.descWorkflows,
    },
  ].filter(() => canView)

  // Contenido — documentos y planificación
  const contentItems: NavItem[] = [
    {
      label: t.navOffice,
      href: `${base}/office`,
      icon: Icons.office,
      description: t.descOffice,
    },
    {
      label: t.navFiles,
      href: `${base}/files`,
      icon: Icons.files,
      description: t.descFiles,
    },
    {
      label: t.navMissions,
      href: `${base}/missions`,
      icon: Icons.missions,
      description: t.descMissions,
    },
  ].filter(() => canView)

  const dataItems: NavItem[] = [
    {
      label: t.navFiscal,
      href: `${base}/fiscal`,
      icon: Icons.fiscal,
      description: t.descFiscal,
    },
    {
      label: t.navInvoices,
      href: `${base}/invoices`,
      icon: Icons.invoices,
      description: t.descInvoices,
    },
    {
      label: t.navReceipts,
      href: `${base}/receipts`,
      icon: Icons.receipts,
      description: t.descReceipts,
    },
    {
      label: t.navAnalytics,
      href: `${base}/analytics`,
      icon: Icons.analytics,
      description: t.descAnalytics,
    },
  ].filter(() => can(user, 'view_usage'))

  const adminItems: NavItem[] = []

  // Audit — VIEWER+ (can view_usage)
  if (can(user, 'view_usage')) {
    adminItems.push({
      label: t.navUsage,
      href: `${base}/usage`,
      icon: Icons.usage,
      description: t.descUsage,
    })
    adminItems.push({
      label: t.navAudit,
      href: `${base}/audit`,
      icon: Icons.audit,
      description: t.descAudit,
    })
  }

  // Org Admin — ADMIN+
  if (can(user, 'manage_members')) {
    adminItems.push({
      label: t.navAdminOrg,
      href: '/org',
      icon: Icons.organization,
      description: t.descAdminOrg,
    })
  }

  const profileItems: NavItem[] = [
    {
      label: t.navProfile,
      href: `${base}/profile`,
      icon: Icons.profile,
      description: t.descProfile,
    },
    {
      label: t.navSupport,
      href: `${base}/support`,
      icon: Icons.support,
      description: t.descSupport,
    },
    {
      label: t.navSettings,
      href: `${base}/settings`,
      icon: Icons.settings,
      description: t.descSettings,
    },
  ]

  const navGroups: NavGroup[] = [
    { items: coreItems },
    { label: t.groupWork, items: workItems },
    { label: t.groupContent, items: contentItems },
    { label: t.groupSystem, items: [...dataItems, ...adminItems] },
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



