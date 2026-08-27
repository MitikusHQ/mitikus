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
        <span className="text-sm text-muted-foreground hidden xl:block max-w-[150px] truncate">
          {displayName}
        </span>
      </Link>
      <button
        onClick={handleSignOut}
        className="hidden xl:inline text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
      >
        {signOutLabel}
      </button>
    </div>
  )
}
