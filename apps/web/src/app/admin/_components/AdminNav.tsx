'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin',            label: 'Overview',        icon: '🏠' },
  { href: '/admin/orgs',       label: 'Organizaciones',  icon: '🏢' },
  { href: '/admin/saas',       label: 'SaaS Metrics',    icon: '📊' },
  { href: '/admin/pmf-funnel', label: 'PMF Funnel',      icon: '🎯' },
  { href: '/admin/core-smoke', label: 'Smoke Tests',     icon: '🔥' },
]

export function AdminNav() {
  const path = usePathname()

  return (
    <nav className="flex items-center gap-1">
      {NAV.map((item) => {
        const active = item.href === '/admin' ? path === '/admin' : path.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              active
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
