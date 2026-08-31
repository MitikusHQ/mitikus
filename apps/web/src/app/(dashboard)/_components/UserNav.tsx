'use client'

import { useClerk, useUser } from '@clerk/nextjs'
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
  const displayName =
    user?.firstName
      ? [user.firstName, user.lastName].filter(Boolean).join(' ')
      : (user?.emailAddresses?.[0]?.emailAddress ?? '...')

  const initial = displayName[0]?.toUpperCase() ?? '?'
  const profileHref = workspaceId ? `/workspace/${workspaceId}/profile` : '/profile'

  function handleSignOut() {
    signOut({ redirectUrl: '/' })
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      <ThemeToggle />
      <Link
        href={profileHref}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        title="Mi perfil"
      >
        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary select-none">
              {initial}
            </div>
          )}
        </div>
        <span className="hidden max-w-[150px] truncate text-sm text-muted-foreground min-[2000px]:block">
          {displayName}
        </span>
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        aria-label={signOutLabel}
        title={signOutLabel}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </div>
  )
}
