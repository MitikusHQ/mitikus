'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Member {
  id:    string
  name:  string | null
  email: string
  role:  string
}

interface Props {
  stepId:           string
  objectiveId:      string
  workspaceId:      string
  assignedUserId:   string | null
  assignedUserName: string | null
}

function initials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(' ')
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
  }
  return (email[0] ?? '?').toUpperCase()
}

function displayName(name: string | null, email: string): string {
  return name ?? email.split('@')[0] ?? email
}

export function StepAssignee({ stepId, objectiveId, workspaceId, assignedUserId, assignedUserName }: Props) {
  const router  = useRouter()
  const [open, setOpen]       = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [busy, setBusy]       = useState(false)
  const [loaded, setLoaded]   = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function loadMembers() {
    if (loaded) return
    const res  = await fetch(`/api/workspace/${workspaceId}/members`)
    const data = await res.json()
    setMembers(data.members ?? [])
    setLoaded(true)
  }

  async function assign(userId: string | null) {
    setBusy(true)
    setOpen(false)
    try {
      await fetch(`/api/missions/${objectiveId}/steps/${stepId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ assignedUserId: userId }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  function handleToggle() {
    if (!open) void loadMembers()
    setOpen((v) => !v)
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={handleToggle}
        disabled={busy}
        title={assignedUserName ? `Asignado a ${assignedUserName}` : 'Asignar a…'}
        className={`
          w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
          border transition-colors
          ${assignedUserId
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-muted text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
          }
          disabled:opacity-40 cursor-pointer
        `}
      >
        {assignedUserId
          ? initials(assignedUserName, '')
          : <span className="text-[11px] leading-none">+</span>
        }
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-52 rounded-lg border bg-popover shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Asignar paso</p>
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {assignedUserId && (
              <button
                type="button"
                onClick={() => void assign(null)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-muted border flex items-center justify-center text-[11px]">✕</span>
                Sin asignar
              </button>
            )}
            {members.length === 0 && (
              <p className="px-3 py-3 text-xs text-muted-foreground text-center">Cargando…</p>
            )}
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => void assign(m.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                  m.id === assignedUserId ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  m.id === assignedUserId ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {initials(m.name, m.email)}
                </span>
                <span className="truncate">{displayName(m.name, m.email)}</span>
                {m.id === assignedUserId && <span className="ml-auto text-primary shrink-0">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
