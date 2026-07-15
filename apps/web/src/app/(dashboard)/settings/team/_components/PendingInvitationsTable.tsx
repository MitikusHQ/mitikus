'use client'

import { useState } from 'react'
import type { PendingInvitation } from '@/app/actions/org'

interface Props {
  invitations: PendingInvitation[]
  appUrl: string
}

export function PendingInvitationsTable({ invitations: initial, appUrl }: Props) {
  const [invitations, setInvitations] = useState<PendingInvitation[]>(initial)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  async function handleRevoke(token: string) {
    setRevoking(token)
    const res = await fetch(`/api/invitations/${token}`, { method: 'DELETE' })
    if (res.ok) {
      setInvitations((prev) => prev.filter((i) => i.token !== token))
    }
    setRevoking(null)
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${appUrl}/invite/${token}`)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  if (invitations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No hay invitaciones pendientes.</p>
    )
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Email / Rol</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Caduca</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {invitations.map((inv) => (
              <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium">{inv.email ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">{inv.roleLabel}</div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(
                    new Date(inv.expiresAt),
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      inv.isExpired
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-green-500/10 text-green-600 dark:text-green-400'
                    }`}
                  >
                    {inv.isExpired ? 'Caducada' : 'Activa'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 justify-end">
                    {!inv.isExpired && (
                      <button
                        onClick={() => copyLink(inv.token)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copied === inv.token ? 'Copiado ✓' : 'Copiar link'}
                      </button>
                    )}
                    <button
                      onClick={() => handleRevoke(inv.token)}
                      disabled={revoking === inv.token}
                      className="text-xs text-destructive hover:underline disabled:opacity-50"
                    >
                      {revoking === inv.token ? '...' : 'Revocar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
