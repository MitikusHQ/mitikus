'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export interface NavItem {
  label: string
  href: string        // absolute href
  icon: React.ReactNode
  description?: string // tooltip — una frase que explica qué hace esta sección
  badge?: string
  comingSoon?: boolean
  disabled?: boolean
}

interface Props {
  item: NavItem
  collapsed?: boolean
}

export function WorkspaceSidebarItem({ item, collapsed = false }: Props) {
  const pathname = usePathname()

  // Active: exact for dashboard (ends in workspaceId), prefix for others
  const isActive = item.href.endsWith(pathname)
    ? true
    : pathname.startsWith(item.href) && item.href.split('/').length > 4

  if (item.comingSoon || item.disabled) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm opacity-40 cursor-not-allowed select-none',
          collapsed && 'justify-center px-2',
        )}
        title={collapsed ? item.label : undefined}
      >
        <span className="shrink-0 text-muted-foreground">{item.icon}</span>
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-muted-foreground">{item.label}</span>
            {item.comingSoon && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                Pronto
              </span>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      title={collapsed ? item.label : item.description}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        collapsed && 'justify-center px-2',
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
      )}
    >
      <span className={cn('shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')}>
        {item.icon}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  )
}
