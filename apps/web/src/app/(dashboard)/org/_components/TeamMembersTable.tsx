'use client'

import { useState } from 'react'
import { RoleSelect } from './RoleSelect'
import { RoleBadge } from './RoleBadge'
import { cn } from '@/lib/utils'
import type { OrgMember } from '@/app/actions/org'
import type { OrgRole } from '@prisma/client'

interface Props {
  members: OrgMember[]
  currentUserId: string
  actorRole: OrgRole
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora mismo'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `hace ${days}d`
  return formatDate(iso)
}

const OWNER_COUNT = (members: OrgMember[]) => members.filter((m) => m.role === 'OWNER').length

export function TeamMembersTable({ members: initialMembers, currentUserId, actorRole }: Props) {
  const [members, setMembers] = useState<OrgMember[]>(initialMembers)
  const ownerCount = OWNER_COUNT(members)

  function handleRoleChange(memberId: string, newRole: OrgRole) {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, role: newRole, roleLabel: newRole }
          : m,
      ),
    )
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Miembro</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Rol</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Alta</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Última actividad</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((member) => {
              const isMe = member.id === currentUserId
              return (
                <tr
                  key={member.id}
                  className={cn('hover:bg-muted/20 transition-colors', isMe && 'bg-primary/3')}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0 uppercase">
                        {(member.name ?? member.email).charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-1.5">
                          {member.name ?? member.email}
                          {isMe && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                              Tú
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <RoleSelect
                      memberId={member.id}
                      currentRole={member.role}
                      actorRole={actorRole}
                      isOwnProfile={isMe}
                      ownerCount={ownerCount}
                      onSuccess={(newRole) => handleRoleChange(member.id, newRole)}
                    />
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(member.createdAt)}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                    {member.lastActivityAt ? formatRelative(member.lastActivityAt) : (
                      <span className="text-muted-foreground/50 italic">Sin actividad</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y">
        {members.map((member) => {
          const isMe = member.id === currentUserId
          return (
            <div key={member.id} className={cn('px-4 py-4 space-y-2', isMe && 'bg-primary/5')}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0 uppercase">
                    {(member.name ?? member.email).charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-sm flex items-center gap-1.5">
                      {member.name ?? member.email}
                      {isMe && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          Tú
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{member.email}</div>
                  </div>
                </div>
                <RoleSelect
                  memberId={member.id}
                  currentRole={member.role}
                  actorRole={actorRole}
                  isOwnProfile={isMe}
                  ownerCount={ownerCount}
                  onSuccess={(newRole) => handleRoleChange(member.id, newRole)}
                />
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground pl-10">
                <span>Alta: {formatDate(member.createdAt)}</span>
                <span>{member.lastActivityAt ? formatRelative(member.lastActivityAt) : 'Sin actividad'}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
