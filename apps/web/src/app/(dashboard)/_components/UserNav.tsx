'use client'

import { useClerk, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

interface UserNavProps {
  signOutLabel?: string
}

export function UserNav({ signOutLabel = 'Cerrar sesión' }: UserNavProps) {
  const { signOut } = useClerk()
  const { user } = useUser()
  const displayName =
    user?.firstName
      ? [user.firstName, user.lastName].filter(Boolean).join(' ')
      : (user?.emailAddresses?.[0]?.emailAddress ?? '...')

  const initial = displayName[0]?.toUpperCase() ?? '?'

  function handleSignOut() {
    signOut({ redirectUrl: '/' })
  }

  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />
      <Link
        href="/profile"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        title="Profile"
      >
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary select-none">
          {initial}
        </div>
        <span className="text-sm text-muted-foreground hidden sm:block max-w-[160px] truncate">
          {displayName}
        </span>
      </Link>
      <button
        onClick={handleSignOut}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {signOutLabel}
      </button>
    </div>
  )
}
