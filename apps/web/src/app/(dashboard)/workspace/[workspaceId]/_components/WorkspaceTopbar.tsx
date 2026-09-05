'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserNav } from '@/app/(dashboard)/_components/UserNav'
import { LocaleSelector } from '@/app/(dashboard)/_components/LocaleSelector'
import { Icons } from './WorkspaceIcons'
import { GlobalSearch } from './GlobalSearch'
import { NotificationBell } from './NotificationBell'
import type { Locale } from '@/i18n/config'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import type { DashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  workspaceId: string
  workspaceName: string
  userAvatarUrl?: string | null
  locale: Locale
  onToggleSidebar: () => void
  sidebarCollapsed: boolean
  teamPanelOpen: boolean
  onToggleTeamPanel: () => void
  onOpenOnboarding: () => void
}

function makeSectionLabels(t: DashboardTranslations): Array<{ segment: string; label: string }> {
  return [
    { segment: '/tools',         label: t.sectionTools },
    { segment: '/workflows',     label: t.sectionWorkflows },
    { segment: '/clients',       label: t.sectionClients },
    { segment: '/analytics',     label: t.sectionAnalytics },
    { segment: '/audit',         label: t.sectionAudit },
    { segment: '/usage',         label: t.sectionUsage },
    { segment: '/team',          label: t.sectionTeam },
    { segment: '/settings',      label: t.sectionSettings },
    { segment: '/generate',      label: t.sectionGenerate },
    { segment: '/import',        label: t.sectionImport },
    { segment: '/copilot',       label: t.sectionCopilot },
    { segment: '/brain',         label: t.sectionBrain },
    { segment: '/tasks',         label: t.sectionTasks },
    { segment: '/today',         label: t.sectionToday },
    { segment: '/timelog',       label: t.sectionTimelog },
    { segment: '/missions',      label: t.sectionMissions },
    { segment: '/profile',       label: t.sectionProfile },
    { segment: '/docs',          label: t.sectionDocs },
    { segment: '/sheets',        label: t.sectionSheets },
    { segment: '/pdfs',          label: t.sectionPdfs },
    { segment: '/contracts',     label: t.sectionContracts },
    { segment: '/presentations', label: t.sectionPresentations },
    { segment: '/notebooks',     label: t.sectionNotebooks },
    { segment: '/office',        label: t.sectionOffice },
    { segment: '/history',       label: t.sectionHistory },
    { segment: '/invoices',      label: t.sectionInvoices },
    { segment: '/receipts',      label: t.sectionReceipts },
  ]
}

function useBreadcrumb(workspaceId: string, workspaceName: string, t: DashboardTranslations) {
  const pathname = usePathname()
  const base = `/workspace/${workspaceId}`
  const SECTION_LABELS = makeSectionLabels(t)

  if (pathname === base || pathname === `${base}/`) {
    return [{ label: workspaceName, href: base }]
  }

  const match = SECTION_LABELS.find((s) => pathname.startsWith(`${base}${s.segment}`))
  const sectionLabel = match?.label

  if (!sectionLabel) {
    return [{ label: workspaceName, href: base }]
  }

  const sectionHref = `${base}${match!.segment}`
  const crumbs = [{ label: sectionLabel, href: sectionHref }]

  // Sub-level (e.g. tools/[id], workflows/[id]/history)
  const subPath = pathname.slice(sectionHref.length)
  if (subPath && subPath !== '/') {
    const subSegments = subPath.split('/').filter(Boolean)
    if (subSegments.length >= 2) {
      const subLabel = resolveSubLabel(subSegments, t)
      if (subLabel) {
        crumbs.push({ label: subLabel, href: pathname })
      }
    }
  }

  return crumbs
}

function resolveSubLabel(segments: string[], t: DashboardTranslations): string | null {
  const last = segments[segments.length - 1] ?? ''
  const labels: Record<string, string> = {
    history:   t.subHistory,
    run:       t.subRun,
    settings:  t.subSettings,
    records:   t.subRecords,
    checklist: t.subChecklist,
    scoring:   t.subScoring,
    edit:      t.subEdit,
    new:       t.subNew,
  }
  return labels[last] ?? null
}

export function WorkspaceTopbar({ workspaceId, workspaceName, userAvatarUrl, locale, onToggleSidebar, sidebarCollapsed, teamPanelOpen, onToggleTeamPanel, onOpenOnboarding }: Props) {
  const t = getDashboardTranslations(locale)
  const breadcrumbs = useBreadcrumb(workspaceId, workspaceName, t)

  return (
    <header
      className="h-14 shrink-0 border-b border-border bg-card flex items-center justify-between px-4 gap-4"
      role="banner"
    >
      {/* Left: sidebar toggle + breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? t.expandSidebar : t.collapseSidebar}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {Icons.menu}
        </button>

        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && (
                <span className="text-muted-foreground/40 shrink-0">{Icons.chevronRight}</span>
              )}
              {i === breadcrumbs.length - 1 ? (
                <span className="font-medium text-foreground truncate">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors truncate"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: search + quick actions + locale + user */}
      <div className="flex items-center gap-2 shrink-0">
        <GlobalSearch workspaceId={workspaceId} />
        <Link
          href={`/workspace/${workspaceId}/generate`}
          className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {Icons.plus}
          <span>{t.newMission}</span>
        </Link>
        <button
          type="button"
          onClick={onToggleTeamPanel}
          aria-label={teamPanelOpen ? t.closeTeamPanel : t.openTeamPanel}
          aria-pressed={teamPanelOpen}
          className={`p-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            teamPanelOpen
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          {Icons.team}
        </button>
        <button
          type="button"
          onClick={onOpenOnboarding}
          aria-label={t.welcomeTour}
          title={t.welcomeTour}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <path d="M12 17h.01"/>
          </svg>
        </button>
        <LocaleSelector currentLocale={locale} />
        <NotificationBell workspaceId={workspaceId} />
        <UserNav avatarUrl={userAvatarUrl} workspaceId={workspaceId} />
      </div>
    </header>
  )
}
