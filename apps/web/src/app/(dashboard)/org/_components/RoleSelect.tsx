'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { RoleBadge } from './RoleBadge'
import { updateMemberRole } from '@/app/actions/org'
import type { OrgRole } from '@prisma/client'

const ROLES: OrgRole[] = ['OWNER', 'ADMIN', 'EDITOR', 'OPERATOR', 'VIEWER']

const ROLE_LABELS: Record<OrgRole, string> = {
  OWNER:    'Propietario',
  ADMIN:    'Administrador',
  EDITOR:   'Editor',
  MEMBER:   'Miembro',
  OPERATOR: 'Operador',
  VIEWER:   'Lector',
}

const ROLE_DESCRIPTIONS: Record<OrgRole, string> = {
  OWNER:    'Control total, puede eliminar la org',
  ADMIN:    'Gestiona equipo y configuración',
  EDITOR:   'Crea y edita herramientas y workflows',
  MEMBER:   'Igual que Editor (rol heredado)',
  OPERATOR: 'Ejecuta herramientas y crea registros',
  VIEWER:   'Solo lectura',
}

interface Props {
  memberId: string
  currentRole: OrgRole
  actorRole: OrgRole
  isOwnProfile: boolean
  ownerCount: number
  onSuccess?: (newRole: OrgRole) => void
}

export function RoleSelect({ memberId, currentRole, actorRole, isOwnProfile, ownerCount, onSuccess }: Props) {
  const [open, setOpen] = useState(false)
  const [localRole, setLocalRole] = useState<OrgRole>(currentRole)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const actorLevel = ROLE_LEVEL[actorRole] ?? 0
  const isOwner = actorRole === 'OWNER'

  function canChangeToRole(role: OrgRole): boolean {
    if (localRole === 'OWNER' && !isOwner) return false
    if (role === 'OWNER' && !isOwner) return false
    if (localRole === 'OWNER' && role !== 'OWNER' && ownerCount <= 1) return false
    if (isOwnProfile && role !== localRole) return false
    return actorLevel >= ROLE_LEVEL[role]!
  }

  function handleSelect(newRole: OrgRole) {
    if (newRole === localRole) { setOpen(false); return }
    setError(null)
    startTransition(async () => {
      const result = await updateMemberRole(memberId, newRole)
      if ('error' in result) {
        setError(result.error)
      } else {
        setLocalRole(newRole)
        onSuccess?.(newRole)
      }
      setOpen(false)
    })
  }

  const canEdit = !isOwnProfile && (isOwner || (can(actorRole, 'manage_members') && localRole !== 'OWNER'))

  if (!canEdit) {
    return <RoleBadge role={localRole} />
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        disabled={isPending}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all',
          'hover:opacity-80 cursor-pointer',
          isPending && 'opacity-50 cursor-not-allowed',
        )}
        title="Cambiar rol"
      >
        <RoleBadge role={localRole} />
        <svg className="w-3 h-3 ml-0.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {error && (
        <p className="absolute top-full left-0 mt-1 text-xs text-destructive bg-card border border-destructive/30 rounded p-1 whitespace-nowrap z-10 shadow">
          {error}
        </p>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute top-full left-0 mt-1 w-56 rounded-lg border bg-popover shadow-lg z-20 py-1 overflow-hidden">
            {ROLES.map((role) => {
              const disabled = !canChangeToRole(role)
              return (
                <button
                  key={role}
                  type="button"
                  disabled={disabled || role === localRole}
                  onClick={() => handleSelect(role)}
                  className={cn(
                    'w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors',
                    role === localRole ? 'bg-muted/60' : 'hover:bg-muted',
                    disabled && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  <RoleBadge role={role} className="mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground">{ROLE_LABELS[role]}</div>
                    <div className="text-[10px] text-muted-foreground leading-snug">{ROLE_DESCRIPTIONS[role]}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// Importar desde permissions sería un import circular aquí (client component → server lib is fine, but let's keep the level inline)
const ROLE_LEVEL: Record<OrgRole, number> = {
  OWNER: 50, ADMIN: 40, EDITOR: 30, MEMBER: 30, OPERATOR: 20, VIEWER: 10,
}

function can(role: OrgRole, _action: 'manage_members'): boolean {
  return ROLE_LEVEL[role] >= 40
}
