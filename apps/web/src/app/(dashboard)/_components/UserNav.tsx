'use client'

import { useEffect, useRef, useState } from 'react'
import { useClerk, useUser } from '@clerk/nextjs'
import { Camera, ChevronDown, LogOut, UserRound } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

interface UserNavProps {
  signOutLabel?: string
  avatarUrl?: string | null
  workspaceId?: string
}

export function UserNav({ signOutLabel = 'Cerrar sesión', avatarUrl, workspaceId }: UserNavProps) {
  const { signOut } = useClerk()
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const displayName =
    user?.firstName
      ? [user.firstName, user.lastName].filter(Boolean).join(' ')
      : (user?.emailAddresses?.[0]?.emailAddress ?? '...')

  const initial = displayName[0]?.toUpperCase() ?? '?'
  const profileHref = workspaceId ? `/workspace/${workspaceId}/profile` : '/profile'
  const avatarHref = `${profileHref}#foto-de-perfil`
  const detailsHref = `${profileHref}#datos-personales`

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function handleSignOut() {
    setOpen(false)
    signOut({ redirectUrl: '/' })
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      <ThemeToggle />
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Abrir menú de cuenta"
          title="Mi cuenta"
          className="flex h-9 items-center gap-1 rounded-full px-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="h-7 w-7 rounded-full overflow-hidden flex-shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary select-none">
                {initial}
              </span>
            )}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        </button>

        {open && (
          <div
            role="menu"
            aria-label="Menú de cuenta"
            className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg"
          >
            <Link
              href={detailsHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              <UserRound className="h-4 w-4 text-muted-foreground" aria-hidden />
              <span>Datos personales</span>
            </Link>
            <Link
              href={avatarHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              <Camera className="h-4 w-4 text-muted-foreground" aria-hidden />
              <span>Foto de perfil</span>
            </Link>
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span>{signOutLabel}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
