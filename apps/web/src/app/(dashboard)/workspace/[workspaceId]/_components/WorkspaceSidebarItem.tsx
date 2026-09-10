'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  description?: string
  badge?: string
  comingSoon?: boolean
  disabled?: boolean
  children?: NavItem[]  // si tiene hijos, se renderiza como acordeón
}

interface Props {
  item: NavItem
  collapsed?: boolean
}

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    className={cn('transition-transform duration-150 shrink-0', open && 'rotate-180')}
    aria-hidden
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

export function WorkspaceSidebarItem({ item, collapsed = false }: Props) {
  const pathname = usePathname()

  const isActive = item.href.endsWith(pathname)
    ? true
    : pathname.startsWith(item.href) && item.href.split('/').length > 4

  const hasChildren = (item.children?.length ?? 0) > 0
  const anyChildActive = item.children?.some(
    (c) => pathname === c.href || (pathname.startsWith(c.href) && c.href.split('/').length > 4)
  ) ?? false

  const [open, setOpen] = useState(anyChildActive)

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

  // Acordeón — ítem con hijos
  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          title={collapsed ? item.label : item.description}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            collapsed && 'justify-center px-2',
            anyChildActive
              ? 'text-primary font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
          )}
        >
          <span className={cn('shrink-0', anyChildActive ? 'text-primary' : 'text-muted-foreground')}>
            {item.icon}
          </span>
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-left">{item.label}</span>
              <ChevronIcon open={open} />
            </>
          )}
        </button>

        {open && !collapsed && (
          <ul className="mt-0.5 ml-3 pl-3 border-l border-border space-y-0.5">
            {item.children!.map((child) => (
              <li key={child.href}>
                <WorkspaceSidebarItem item={child} collapsed={false} />
              </li>
            ))}
          </ul>
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
