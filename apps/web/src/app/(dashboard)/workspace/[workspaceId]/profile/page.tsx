import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
import { ProfileClient } from './_components/ProfileClient'

export const metadata: Metadata = { title: 'Mi perfil — MITIKUS' }

export default async function ProfilePage() {
  const user = await requireUser()
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-1">Mi perfil</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Tu foto de perfil y datos personales dentro de MITIKUS.
      </p>
      <ProfileClient
        userId={user.id}
        name={user.name ?? user.email}
        email={user.email}
        avatarUrl={user.avatarUrl ?? null}
        jobTitle={user.jobTitle ?? null}
        role={user.role}
      />
    </div>
  )
}
