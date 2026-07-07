'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface Props {
  orgName: string
  canManageMembers: boolean
  canViewAdmin: boolean
  workspaceId?: string
  children: React.ReactNode
}

const Icons = {
  org: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M3 21h18M9 8h1m-1 4h1m-1 4h1m4-8h1m-1 4h1m-1 4h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" />
    </svg>
  ),
  team: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  back: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  menu: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
}

export function OrgShell({ orgName, canManageMembers, canViewAdmin, workspaceId, children }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const betaIcon = (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )

  const billingIcon = (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  )

  const navItems: NavItem[] = [
    { label: 'Organización', href: '/org', icon: Icons.org },
    ...(canManageMembers ? [{ label: 'Equipo', href: '/org/team', icon: Icons.team }] : []),
    ...(canViewAdmin ? [{ label: 'Beta Dashboard', href: '/org/beta', icon: betaIcon }] : []),
    { label: 'Actualizar plan', href: '/pricing', icon: billingIcon },
  ]

  const sidebar = (
    <nav className="flex flex-col h-full w-56 border-r bg-card text-sm">
      {/* Header */}
      <div className="px-4 py-4 border-b">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          Admin
        </div>
        <div className="font-semibold truncate text-foreground">{orgName}</div>
      </div>

      {/* Nav items */}
      <div className="flex-1 py-3 space-y-0.5 px-2">
        {navItems.map((item) => {
          const isActive = item.href === '/org' ? pathname === '/org' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Back to workspace */}
      <div className="px-2 pb-4 border-t pt-3">
        <Link
          href={workspaceId ? `/workspace/${workspaceId}` : '/'}
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {Icons.back}
          Volver al workspace
        </Link>
      </div>
    </nav>
  )

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">{sidebar}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="relative z-50 h-full shadow-2xl">{sidebar}</div>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center h-14 px-4 border-b bg-card gap-3">
          <button type="button" onClick={() => setMobileOpen(true)} className="text-muted-foreground" aria-label="Abrir menú">
            {Icons.menu}
          </button>
          <span className="font-semibold text-sm">{orgName} — Admin</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
