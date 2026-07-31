import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { listOrgMembers, listPendingInvitations } from '@/app/actions/org'
import { TeamMembersTable } from '@/app/(dashboard)/org/_components/TeamMembersTable'
import { InviteModal } from './_components/InviteModal'
import { PendingInvitationsTable } from './_components/PendingInvitationsTable'

interface Props {
  searchParams: Promise<{ invite?: string }>
}

export default async function SettingsTeamPage({ searchParams }: Props) {
  const [user, sp] = await Promise.all([requireUser(), searchParams])
  if (!can(user, 'manage_members')) redirect('/dashboard')
  const autoOpen = sp.invite === 'email' // valor emitido por OnboardingWizard paso 3

  const [membersResult, invitationsResult] = await Promise.all([
    listOrgMembers(),
    listPendingInvitations(),
  ])

  const members = 'error' in membersResult ? [] : membersResult
  const invitations = 'error' in invitationsResult ? [] : invitationsResult
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.mitikus.com'

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
      <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        Ajustes
      </Link>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Equipo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {members.length} {members.length === 1 ? 'miembro' : 'miembros'} en la organización
          </p>
        </div>
        <InviteModal actorRole={user.role} autoOpen={autoOpen} />
      </div>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Miembros actuales
        </h2>
        {members.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">No hay miembros en la organización.</p>
          </div>
        ) : (
          <TeamMembersTable
            members={members}
            currentUserId={user.id}
            actorRole={user.role}
            showRemove
          />
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Invitaciones pendientes
        </h2>
        <PendingInvitationsTable invitations={invitations} appUrl={appUrl} />
      </section>
    </div>
  )
}
