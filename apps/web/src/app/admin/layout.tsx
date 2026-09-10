import { requireUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'MITIKUS Admin' }

const SUPERADMIN_EMAILS = (process.env.SUPERADMIN_EMAILS ?? 'borjaprietomark82@gmail.com').split(',').map((e) => e.trim())

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/orgs', label: 'Organizaciones' },
  { href: '/admin/saas', label: 'SaaS Metrics' },
  { href: '/admin/pmf-funnel', label: 'PMF Funnel' },
  { href: '/admin/core-smoke', label: 'Smoke Tests' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  if (!SUPERADMIN_EMAILS.includes(user.email)) notFound()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-3 flex items-center gap-6">
        <span className="font-bold text-sm tracking-tight">MITIKUS <span className="text-primary">Admin</span></span>
        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto text-xs text-muted-foreground">{user.email}</div>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  )
}
