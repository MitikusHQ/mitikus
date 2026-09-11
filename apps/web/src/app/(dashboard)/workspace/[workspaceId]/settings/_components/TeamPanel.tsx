'use client'

import { useState, useTransition, useEffect } from 'react'
import {
  listOrgMembers, listPendingInvitations, updateMemberRole, removeMember,
  type OrgMember, type PendingInvitation,
} from '@/app/actions/org'
import type { OrgRole } from '@prisma/client'
import type { DashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  currentUserId: string
  currentRole: OrgRole
  canManage: boolean
  t: Pick<DashboardTranslations,
    'teamMembersTitle' | 'teamPendingTitle' | 'teamInviteTitle' |
    'teamRoleOwner' | 'teamRoleAdmin' | 'teamRoleEditor' | 'teamRoleViewer' |
    'teamActionRemove' | 'teamActionCopyLink' | 'teamActionRevoke' | 'teamActionInvite' |
    'teamInvitePlaceholder' | 'teamExpired' | 'teamExpires' | 'teamOpenLink' | 'teamLoading' |
    'teamConfirmRemove' | 'teamInviteError' | 'teamConnError' | 'teamInviting'
  >
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

function RoleBadge({ role, t }: { role: string; t: Props['t'] }) {
  const cls = role === 'OWNER'
    ? 'bg-primary/10 text-primary'
    : role === 'ADMIN'
    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    : 'bg-muted text-muted-foreground'
  const label = role === 'OWNER' ? t.teamRoleOwner : role === 'ADMIN' ? t.teamRoleAdmin : role === 'EDITOR' ? t.teamRoleEditor : t.teamRoleViewer
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cls}`}>{label}</span>
}

export function TeamPanel({ currentUserId, currentRole, canManage, t }: Props) {
  const roleOptions: { value: OrgRole; label: string }[] = [
    { value: 'ADMIN',  label: t.teamRoleAdmin },
    { value: 'EDITOR', label: t.teamRoleEditor },
    { value: 'VIEWER', label: t.teamRoleViewer },
  ]

  const [members, setMembers]             = useState<OrgMember[]>([])
  const [invitations, setInvitations]     = useState<PendingInvitation[]>([])
  const [loading, setLoading]             = useState(true)
  const [, startTransition]               = useTransition()

  // Invite form
  const [inviteEmail, setInviteEmail]     = useState('')
  const [inviteRole, setInviteRole]       = useState<OrgRole>('EDITOR')
  const [inviteLink, setInviteLink]       = useState<string | null>(null)
  const [inviting, setInviting]           = useState(false)
  const [inviteError, setInviteError]     = useState<string | null>(null)

  // Remove / role change
  const [actionError, setActionError]     = useState<string | null>(null)

  async function reload() {
    setLoading(true)
    const [m, inv] = await Promise.all([listOrgMembers(), listPendingInvitations()])
    if (!('error' in m)) setMembers(m)
    if (!('error' in inv)) setInvitations(inv)
    setLoading(false)
  }

  useEffect(() => { void reload() }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteError(null)
    setInviteLink(null)
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail || undefined, role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) { setInviteError(data.error ?? t.teamInviteError); return }
      setInviteLink(data.link)
      setInviteEmail('')
      void reload()
    } catch {
      setInviteError(t.teamConnError)
    } finally {
      setInviting(false)
    }
  }

  async function handleRoleChange(memberId: string, role: OrgRole) {
    setActionError(null)
    startTransition(async () => {
      const result = await updateMemberRole(memberId, role)
      if ('error' in result) { setActionError(result.error); return }
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role, roleLabel: roleOptions.find((r) => r.value === role)?.label ?? role } : m))
    })
  }

  async function handleRemove(memberId: string) {
    if (!confirm(t.teamConfirmRemove)) return
    setActionError(null)
    startTransition(async () => {
      const result = await removeMember(memberId)
      if ('error' in result) { setActionError(result.error); return }
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    })
  }

  async function handleRevokeInvite(token: string) {
    setActionError(null)
    const res = await fetch(`/api/invitations/${token}`, { method: 'DELETE' })
    if (!res.ok) { const d = await res.json(); setActionError(d.error ?? 'Error al revocar'); return }
    void reload()
  }

  return (
    <div className="space-y-8">
      {/* Miembros actuales */}
      <section>
        <h3 className="text-sm font-semibold mb-3">{t.teamMembersTitle}</h3>
        {loading ? (
          <p className="text-xs text-muted-foreground">{t.teamLoading}</p>
        ) : (
          <div className="divide-y divide-border rounded-xl border bg-card overflow-hidden">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                  {(m.name ?? m.email).slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.name ?? m.email}</p>
                  {m.name && <p className="text-xs text-muted-foreground truncate">{m.email}</p>}
                </div>
                <RoleBadge role={m.role} t={t} />
                {canManage && m.id !== currentUserId && m.role !== 'OWNER' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value as OrgRole)}
                      className="text-xs rounded border border-input bg-card px-2 py-1"
                    >
                      {roleOptions.filter((r) => !(r.value === 'ADMIN' && currentRole !== 'OWNER')).map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRemove(m.id)}
                      className="text-xs text-destructive hover:underline"
                    >
                      {t.teamActionRemove}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {actionError && (
        <p className="text-xs text-destructive">{actionError}</p>
      )}

      {/* Invitaciones pendientes */}
      {invitations.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-3">{t.teamPendingTitle}</h3>
          <div className="divide-y divide-border rounded-xl border bg-card overflow-hidden">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{inv.email ?? <span className="text-muted-foreground italic">{t.teamOpenLink}</span>}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.isExpired ? t.teamExpired : `${t.teamExpires} ${fmtDate(inv.expiresAt)}`}
                    {' · '}{inv.roleLabel}
                  </p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/invite/${inv.token}`)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {t.teamActionCopyLink}
                </button>
                {canManage && (
                  <button
                    onClick={() => handleRevokeInvite(inv.token)}
                    className="text-xs text-destructive hover:underline"
                  >
                    {t.teamActionRevoke}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Formulario de invitación */}
      {canManage && (
        <section>
          <h3 className="text-sm font-semibold mb-3">{t.teamInviteTitle}</h3>
          <form onSubmit={handleInvite} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder={t.teamInvitePlaceholder}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                className="rounded-md border border-input bg-background px-2 py-2 text-sm"
              >
                {roleOptions.filter((r) => !(r.value === 'ADMIN' && currentRole !== 'OWNER')).map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={inviting}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {inviting ? t.teamInviting : t.teamActionInvite}
              </button>
            </div>
            {inviteError && <p className="text-xs text-destructive">{inviteError}</p>}
            {inviteLink && (
              <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs">
                <span className="flex-1 truncate font-mono">{inviteLink}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(inviteLink)}
                  className="shrink-0 text-primary hover:underline"
                >
                  {t.teamActionCopyLink}
                </button>
              </div>
            )}
          </form>
        </section>
      )}
    </div>
  )
}
