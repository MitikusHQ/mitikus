'use client'

import { UserProfile } from '@clerk/nextjs'
import Link from 'next/link'

interface Props {
  base: string
  workspaceId: string
  userName: string | null
  userEmail: string | null
  userRole: string
}

export function UserProfileClient({ base, userRole }: Props) {
  const initial = '?'
  void initial

  return (
    <div className="space-y-6">
      {/* Badge rol */}
      <div className="flex items-center gap-2">
        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize font-medium">
          {userRole.toLowerCase()}
        </span>
      </div>

      {/* Clerk UserProfile embebido — gestión completa de nombre, email, contraseña, 2FA */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <UserProfile routing="hash" />
      </div>

      {/* Herramientas personales */}
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
