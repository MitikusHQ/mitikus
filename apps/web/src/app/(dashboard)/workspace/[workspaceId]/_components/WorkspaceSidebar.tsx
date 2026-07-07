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
  navGroups: NavGroup[]
  collapsed?: boolean
}

export function WorkspaceSidebar({ workspaceId, workspaceName, navGroups, collapsed = false }: Props) {
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
        {/* Brand mark */}
        <div className="shrink-0 w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm select-none">
          P
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
      {!collapsed && (
        <div className="px-4 py-3 border-t border-border shrink-0">
          <p className="text-[10px] text-muted-foreground/50 truncate">MITIKUS</p>
        </div>
      )}
    </aside>
  )
}
