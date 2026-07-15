'use client'

import { useState } from 'react'
import type { OrgRole } from '@prisma/client'

const INVITE_ROLES: { value: OrgRole; label: string; description: string }[] = [
  { value: 'EDITOR', label: 'Consultor', description: 'Ejecuta herramientas, crea registros, exporta' },
  { value: 'VIEWER', label: 'Lector', description: 'Solo lectura y exportación' },
  { value: 'ADMIN', label: 'Administrador', description: 'Gestiona el equipo y las herramientas' },
]

interface Props {
  actorRole: OrgRole
}

export function InviteModal({ actorRole }: Props) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<OrgRole>('EDITOR')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const availableRoles =
    actorRole === 'OWNER' ? INVITE_ROLES : INVITE_ROLES.filter((r) => r.value !== 'ADMIN')

  async function handleCreate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, email: email || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al generar la invitación')
        return
      }
      setLink(data.link)
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setLink(null)
    setError(null)
    setEmail('')
    setRole('EDITOR')
    setCopied(false)
  }

  function copyLink() {
    if (!link) return
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Invitar miembro
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Invitar nuevo miembro</h2>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {!link ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@empresa.com"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">
                    Si lo dejas vacío, cualquier persona con el link puede unirse.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Rol
                  </label>
                  <div className="space-y-2">
                    {availableRoles.map((r) => (
                      <label
                        key={r.value}
                        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                          role === r.value ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={r.value}
                          checked={role === r.value}
                          onChange={() => setRole(r.value)}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="text-sm font-medium">{r.label}</div>
                          <div className="text-xs text-muted-foreground">{r.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {error && <p className="text-xs text-destructive">{error}</p>}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleClose}
                    className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-muted/30 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
                  >
                    {loading ? 'Generando...' : 'Generar link'}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    ✓ Link generado
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Caduca en 7 días</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={link}
                    className="flex-1 rounded-lg border bg-muted/30 px-3 py-2 text-xs font-mono truncate"
                  />
                  <button
                    onClick={copyLink}
                    className="shrink-0 rounded-lg border px-3 py-2 text-xs hover:bg-muted/30 transition-colors whitespace-nowrap"
                  >
                    {copied ? 'Copiado ✓' : 'Copiar'}
                  </button>
                </div>
                <button
                  onClick={handleClose}
                  className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Hecho
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
