import Link from 'next/link'
import { UserProfile } from '@clerk/nextjs'

export default function ProfilePage() {
  return (
    <div className="flex flex-col items-center min-h-screen py-8 px-4 bg-background">
      <div className="w-full max-w-2xl mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Volver a MITIKUS
        </Link>
      </div>
      <UserProfile
        path="/profile"
        routing="path"
      />
    </div>
  )
}
