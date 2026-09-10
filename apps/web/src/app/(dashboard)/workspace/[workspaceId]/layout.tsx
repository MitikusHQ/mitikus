import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { getNavSections } from '@/lib/nav-permissions'
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

  const workItems: NavItem[] = [
    show('clients') && {
      label: t.navClients, href: `${base}/clients`, icon: Icons.clients, description: t.descClients,
    },
    show('leads') && {
      label: t.navLeads, href: `${base}/leads`, icon: Icons.leads, description: t.descLeads,
    },
    show('tasks') && {
      label: t.navTasks, href: `${base}/tasks`, icon: Icons.tasks,
      description: t.descTasks, badge: taskCount > 0 ? String(taskCount) : undefined,
    },
    show('tools') && {
      label: t.navTools, href: `${base}/tools`, icon: Icons.tools, description: t.descTools,
    },
    show('workflows') && {
      label: t.navWorkflows, href: `${base}/workflows`, icon: Icons.workflows, description: t.descWorkflows,
    },
  ].filter(Boolean) as NavItem[]

  const contentItems: NavItem[] = [
    show('studio') && {
      label: t.navOffice, href: `${base}/office`, icon: Icons.office, description: t.descOffice,
    },
    show('files') && {
      label: t.navFiles, href: `${base}/files`, icon: Icons.files, description: t.descFiles,
    },
    show('missions') && {
      label: t.navMissions, href: `${base}/missions`, icon: Icons.missions, description: t.descMissions,
    },
  ].filter(Boolean) as NavItem[]

  const hrItems: NavItem[] = [
    show('employees') && {
      label: t.navEmployees, href: `${base}/employees`, icon: Icons.employees, description: t.descEmployees,
    },
    show('payroll') && {
      label: t.navPayroll, href: `${base}/payroll`, icon: Icons.payroll, description: t.descPayroll,
    },
    show('leaves') && {
      label: t.navLeaves, href: `${base}/leaves`, icon: Icons.leaves, description: t.descLeaves,
    },
  ].filter(Boolean) as NavItem[]

  const dataItems: NavItem[] = [
    show('fiscal') && {
      label: t.navFiscal, href: `${base}/fiscal`, icon: Icons.fiscal, description: t.descFiscal,
    },
    show('invoices') && {
      label: t.navInvoices, href: `${base}/invoices`, icon: Icons.invoices, description: t.descInvoices,
    },
    show('receipts') && {
      label: t.navReceipts, href: `${base}/receipts`, icon: Icons.receipts, description: t.descReceipts,
    },
    show('analytics') && {
      label: t.navAnalytics, href: `${base}/analytics`, icon: Icons.analytics, description: t.descAnalytics,
    },
  ].filter(Boolean) as NavItem[]

  const adminItems: NavItem[] = []
  if (can(user, 'view_usage')) {
    adminItems.push({ label: t.navUsage, href: `${base}/usage`, icon: Icons.usage, description: t.descUsage })
    adminItems.push({ label: t.navAudit, href: `${base}/audit`, icon: Icons.audit, description: t.descAudit })
  }
  if (show('admin') && can(user, 'manage_members')) {
    adminItems.push({ label: t.navAdminOrg, href: '/org', icon: Icons.organization, description: t.descAdminOrg })
  }

  const profileItems: NavItem[] = [
    { label: t.navProfile, href: `${base}/profile`, icon: Icons.profile, description: t.descProfile },
    { label: t.navDownload, href: '/download', icon: Icons.download, description: t.descDownload },
    { label: t.navSupport, href: `${base}/support`, icon: Icons.support, description: t.descSupport },
    show('settings') && { label: t.navSettings, href: `${base}/settings`, icon: Icons.settings, description: t.descSettings },
    { label: t.navIntegrations, href: `${base}/integrations`, icon: Icons.integrations, description: t.descIntegrations },
  ].filter(Boolean) as NavItem[]

  const navGroups: NavGroup[] = [
    { items: coreItems },
    { label: t.groupWork, items: workItems },
    { label: t.groupContent, items: contentItems },
    { label: t.groupHR, items: hrItems },
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



