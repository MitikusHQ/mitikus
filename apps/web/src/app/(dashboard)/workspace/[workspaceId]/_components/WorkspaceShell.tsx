'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { WorkspaceSidebar } from './WorkspaceSidebar'
import { WorkspaceTopbar } from './WorkspaceTopbar'
import { TeamPanel } from './TeamPanel'
import { OnboardingModal, ONBOARDING_STORAGE_KEY } from './OnboardingModal'
import { Icons } from './WorkspaceIcons'
import { BrainOverlay } from '@/components/BrainOverlay'
import type { NavItem } from './WorkspaceSidebarItem'

interface NavGroup {
  label?: string
  items: NavItem[]
}

interface Props {
  workspaceId: string
  workspaceName: string
  workspaceLogoUrl?: string | null
  workspaceBrandColor?: string
  workspaceLogoShowName?: boolean
  workspaceLogoCrop?: { x: number; y: number; zoom: number }
  workspaceLogoText?: { x: number; y: number; size: number; color: string; font: string }
  userAvatarUrl?: string | null
  navGroups: NavGroup[]
  myId: string
  children: React.ReactNode
}

// The workflow editor is full-screen — sidebar stays but main doesn't scroll
function useIsFullscreen(workspaceId: string): boolean {
  const pathname = usePathname()
  const base = `/workspace/${workspaceId}/workflows/`
  // Editor page: /workspace/[id]/workflows/[wfId] (not /history or /new)
  if (!pathname.startsWith(base)) return false
  const sub = pathname.slice(base.length)
  const segments = sub.split('/').filter(Boolean)
  // If exactly 1 segment (the workflowId) → editor (fullscreen)
  return segments.length === 1
}

export function WorkspaceShell({ workspaceId, workspaceName, workspaceLogoUrl, workspaceBrandColor, workspaceLogoShowName = false, workspaceLogoCrop, workspaceLogoText, userAvatarUrl, navGroups, myId, children }: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [teamPanelOpen, setTeamPanelOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [onboardingIsFirstTime, setOnboardingIsFirstTime] = useState(false)
  const isFullscreen = useIsFullscreen(workspaceId)
  const router = useRouter()

  // Close mobile nav on route change
  const pathname = usePathname()
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Restore collapse preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored === 'true') setSidebarCollapsed(true)
  }, [])

  // Show onboarding on first visit
  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (!seen) {
      setOnboardingOpen(true)
      setOnboardingIsFirstTime(true)
    }
  }, [])

  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">
        <WorkspaceSidebar
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          workspaceLogoUrl={workspaceLogoUrl}
          workspaceBrandColor={workspaceBrandColor}
          workspaceLogoShowName={workspaceLogoShowName}
          workspaceLogoCrop={workspaceLogoCrop}
          workspaceLogoText={workspaceLogoText}
          navGroups={navGroups}
          collapsed={sidebarCollapsed}
          onOpenOnboarding={() => setOnboardingOpen(true)}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="relative z-50 h-full w-64 shadow-2xl">
            <WorkspaceSidebar
              workspaceId={workspaceId}
              workspaceName={workspaceName}
              workspaceLogoUrl={workspaceLogoUrl}
              workspaceBrandColor={workspaceBrandColor}
              workspaceLogoShowName={workspaceLogoShowName}
              workspaceLogoCrop={workspaceLogoCrop}
              workspaceLogoText={workspaceLogoText}
              navGroups={navGroups}
              collapsed={false}
              onOpenOnboarding={() => setOnboardingOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <WorkspaceTopbar
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          userAvatarUrl={userAvatarUrl}
          onToggleSidebar={() => {
            // On mobile: toggle drawer; on desktop: toggle collapse
            if (window.innerWidth < 768) {
              setMobileOpen((p) => !p)
            } else {
              toggleSidebar()
            }
          }}
          sidebarCollapsed={sidebarCollapsed}
          teamPanelOpen={teamPanelOpen}
          onToggleTeamPanel={() => setTeamPanelOpen((p) => !p)}
          onOpenOnboarding={() => setOnboardingOpen(true)}
        />

        {/* Mobile: hamburger alternative (small screens already use overlay above) */}
        <button
          type="button"
          aria-label="Abrir menú"
          onClick={() => setMobileOpen(true)}
          className={cn(
            'md:hidden fixed bottom-4 right-4 z-30 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center',
            mobileOpen && 'hidden',
          )}
        >
          {Icons.menu}
        </button>

        {/* Content area + team panel */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <main
            id="workspace-main"
            className={cn(
              'flex-1 min-w-0',
              isFullscreen
                ? 'overflow-hidden'     // workflow editor fills exactly
                : 'overflow-y-auto',    // normal pages scroll
            )}
            tabIndex={-1}
          >
            {children}
          </main>

          {/* Team panel — slides in from the right */}
          {teamPanelOpen && (
            <TeamPanel
              myId={myId}
              onClose={() => setTeamPanelOpen(false)}
            />
          )}
        </div>
      </div>

      <OnboardingModal
        open={onboardingOpen}
        onClose={() => {
          setOnboardingOpen(false)
          if (onboardingIsFirstTime) {
            setOnboardingIsFirstTime(false)
            router.push(`/workspace/${workspaceId}/today`)
          }
        }}
      />

      <BrainOverlay workspaceId={workspaceId} />
    </div>
  )
}
