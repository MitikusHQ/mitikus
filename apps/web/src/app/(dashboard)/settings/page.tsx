import { requireUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import Link from 'next/link'

export default async function SettingsPage() {
  const user = await requireUser()

  const sections = [
    {
      href: '/settings/team',
      title: 'Equipo',
      description: 'Gestiona los miembros de tu organización e invita nuevos colaboradores.',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      visible: can(user, 'manage_members'),
    },
    {
      href: '/settings/categories',
      title: 'Categorías',
      description: 'Activa o desactiva los tipos de herramientas disponibles en tu organización.',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      ),
      visible: user.role === 'OWNER',
    },
  ].filter((s) => s.visible)

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Ajustes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configura tu organización y equipo.</p>
      </div>

      <div className="space-y-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-start gap-4 rounded-xl border bg-card p-5 hover:bg-muted/30 transition-colors group"
          >
            <div className="mt-0.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
              {s.icon}
            </div>
            <div>
              <div className="font-medium text-sm">{s.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.description}</div>
            </div>
            <svg
              className="ml-auto mt-0.5 w-4 h-4 text-muted-foreground/50 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ))}

        {sections.length === 0 && (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <p className="text-sm text-muted-foreground">No tienes acceso a ninguna sección de ajustes.</p>
          </div>
        )}
      </div>
    </div>
  )
}
