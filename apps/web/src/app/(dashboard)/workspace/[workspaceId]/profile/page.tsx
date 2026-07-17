import Link from 'next/link'
import { requireUser } from '@/lib/auth'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function ProfilePage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const base = `/workspace/${workspaceId}`

  const initial = (user.name ?? user.email ?? '?')[0].toUpperCase()

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      {/* Volver */}
      <Link
        href={base}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Volver
      </Link>

      {/* Cabecera usuario */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-semibold shrink-0">
          {initial}
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">{user.name ?? '—'}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5 capitalize">{user.role.toLowerCase()}</p>
        </div>
      </div>

      {/* Secciones */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
          Herramientas personales
        </h2>

        <Link
          href={`${base}/timelog`}
          className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors group"
        >
          <div className="mt-0.5 text-muted-foreground group-hover:text-primary transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">Control horario</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Fichaje de entrada y salida, e imputación de horas por proyecto o cliente.
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-1 text-muted-foreground/40 shrink-0" aria-hidden>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </Link>
      </section>
    </div>
  )
}
