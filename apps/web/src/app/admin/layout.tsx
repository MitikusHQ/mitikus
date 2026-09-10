import { requireUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { AdminNav } from './_components/AdminNav'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'MITIKUS Admin' }

const SUPERADMIN_EMAILS = (process.env.SUPERADMIN_EMAILS ?? 'borjaprietomark82@gmail.com').split(',').map((e) => e.trim())

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  if (!SUPERADMIN_EMAILS.includes(user.email)) notFound()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-3 flex items-center gap-6">
        <span className="font-bold text-sm tracking-tight">MITIKUS <span className="text-primary">Admin</span></span>
        <AdminNav />
        <div className="ml-auto text-xs text-muted-foreground">{user.email}</div>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  )
}
