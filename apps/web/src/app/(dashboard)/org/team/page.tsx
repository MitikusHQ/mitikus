import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { listOrgMembers } from '@/app/actions/org'
import { TeamMembersTable } from '../_components/TeamMembersTable'
import { RoleBadge } from '../_components/RoleBadge'
import { ROLE_DESCRIPTIONS } from '@/lib/permissions'
import type { OrgRole } from '@prisma/client'

const ROLES_HIERARCHY: OrgRole[] = ['OWNER', 'ADMIN', 'EDITOR', 'OPERATOR', 'VIEWER']

export default async function OrgTeamPage() {
  const user = await requireUser()

  if (!can(user, 'manage_members')) {
    redirect('/org')
  }

  const membersResult = await listOrgMembers()
  const members = 'error' in membersResult ? [] : membersResult
  const ownerCount = members.filter((m) => m.role === 'OWNER').length

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Gestión del equipo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {members.length} {members.length === 1 ? 'miembro' : 'miembros'} en la organización
          </p>
        </div>

        {/* Invite placeholder */}
        <button
          type="button"
          disabled
          title="Las invitaciones estarán disponibles próximamente"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-50 cursor-not-allowed"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Invitar miembro
          <span className="text-[10px] opacity-70">(próximamente)</span>
        </button>
      </div>

      {/* Members table */}
      {members.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center">
          <div className="text-4xl mb-4">👥</div>
          <h2 className="font-semibold mb-1">Sin miembros</h2>
          <p className="text-sm text-muted-foreground">No se encontraron miembros en esta organización.</p>
        </div>
      ) : (
        <TeamMembersTable
          members={members}
          currentUserId={user.id}
          actorRole={user.role}
        />
      )}

      {/* Role hierarchy legend */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Jerarquía de roles</h2>
        <div className="space-y-3">
          {ROLES_HIERARCHY.map((role) => (
            <div key={role} className="flex items-start gap-3">
              <RoleBadge role={role} className="shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">{ROLE_DESCRIPTIONS[role]}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/60 mt-4 border-t pt-3">
          Los roles determinan qué puede hacer cada miembro. Un propietario no puede ser degradado si es el único propietario de la organización.
        </p>
      </div>
    </div>
  )
}
