import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { listOrgMembers, listPendingInvitations } from '@/app/actions/org'
import { TeamMembersTable } from '@/app/(dashboard)/org/_components/TeamMembersTable'
import { InviteModal } from './_components/InviteModal'
import { PendingInvitationsTable } from './_components/PendingInvitationsTable'

export default async function SettingsTeamPage() {
  const user = await requireUser()
  if (!can(user, 'manage_members')) redirect('/dashboard')

  const [membersResult, invitationsResult] = await Promise.all([
    listOrgMembers(),
    listPendingInvitations(),
  ])

  const members = 'error' in membersResult ? [] : membersResult
  const invitations = 'error' in invitationsResult ? [] : invitationsResult
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.mitikus.com'

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Equipo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {members.length} {members.length === 1 ? 'miembro' : 'miembros'} en la organización
          </p>
        </div>
        <InviteModal actorRole={user.role} onInviteCreated={() => {}} />
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
