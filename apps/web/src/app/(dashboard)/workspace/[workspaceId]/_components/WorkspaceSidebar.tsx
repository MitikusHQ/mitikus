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
        <div className="shrink-0 w-7 h-7">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-label="MITIKUS" width="28" height="28">
            <defs>
              <linearGradient id="mg" x1="10" y1="10" x2="190" y2="190" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#FFD040"/>
                <stop offset="28%"  stopColor="#FF7028"/>
                <stop offset="50%"  stopColor="#FF2878"/>
                <stop offset="72%"  stopColor="#8B28FF"/>
                <stop offset="100%" stopColor="#1820B8"/>
              </linearGradient>
              <clipPath id="mc"><circle cx="100" cy="100" r="87"/></clipPath>
            </defs>
            <circle cx="100" cy="100" r="90" fill="none" stroke="url(#mg)" strokeWidth="5.5"/>
            <g clipPath="url(#mc)">
              <polygon points="-10,0   192,95  192,100 -10,98"  fill="url(#mg)"/>
              <polygon points="-10,102 192,100 192,105 -10,200" fill="url(#mg)"/>
            </g>
          </svg>
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
