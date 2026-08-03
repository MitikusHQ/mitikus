'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { WorkspaceSidebarItem, type NavItem } from './WorkspaceSidebarItem'

interface NavGroup {
  label?: string
  items: NavItem[]
}

interface Props {
  workspaceId: string
  workspaceName: string
  workspaceLogoUrl?: string | null
  workspaceBrandColor?: string
  navGroups: NavGroup[]
  collapsed?: boolean
  onOpenOnboarding?: () => void
}

export function WorkspaceSidebar({ workspaceId, workspaceName, workspaceLogoUrl, workspaceBrandColor = '#3B82F6', navGroups, collapsed = false, onOpenOnboarding }: Props) {
  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-card border-r border-border transition-all duration-200 shrink-0',
        collapsed ? 'w-14' : 'w-60',
      )}
      aria-label="Navegación del workspace"
    >
      {/* Logo / Workspace name */}
      <div className={cn(
        'h-14 flex items-center border-b border-border shrink-0',
        collapsed ? 'justify-center px-2' : 'px-4 gap-3',
      )}>
        {/* Workspace logo / initial */}
        <div className="shrink-0 w-7 h-7 rounded-lg overflow-hidden">
          {workspaceLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={workspaceLogoUrl} alt={workspaceName} className="object-contain w-full h-full" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: workspaceBrandColor }}
            >
              {workspaceName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {!collapsed && (
          <Link
            href={`/workspace/${workspaceId}`}
            className="font-semibold text-sm text-foreground truncate hover:text-primary transition-colors"
            title={workspaceName}
          >
            {workspaceName}
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && !collapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <WorkspaceSidebarItem item={item} collapsed={collapsed} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn(
        'border-t border-border shrink-0',
        collapsed ? 'flex justify-center px-2 py-3' : 'px-3 py-3 space-y-2',
      )}>
        {onOpenOnboarding && (
          <button
            type="button"
            onClick={onOpenOnboarding}
            className={cn(
              'flex items-center gap-2 w-full rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
              collapsed ? 'justify-center p-2' : 'px-3 py-2',
            )}
            title="Tour de bienvenida"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <path d="M12 17h.01"/>
            </svg>
            {!collapsed && <span>Tour de bienvenida</span>}
          </button>
        )}
        {!collapsed && (
          <p className="px-3 text-[10px] text-muted-foreground/50 truncate">
            Powered by <span className="font-semibold">MITIKUS</span>
          </p>
        )}
      </div>
    </aside>
  )
}
