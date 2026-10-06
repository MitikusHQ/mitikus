'use client'

import { useState } from 'react'
import type { Locale } from '@/i18n/config'

interface GuestRoom {
  id: string
  token: string
  label: string | null
  expiresAt: Date | string
  createdAt: Date | string
}

interface Props {
  workspaceId: string
  userId: string
  initialRooms: GuestRoom[]
  baseUrl: string
  locale: Locale
}

export function MeetingsClient({ workspaceId, initialRooms, baseUrl }: Props) {
  const [rooms, setRooms] = useState<GuestRoom[]>(initialRooms)
  const [creating, setCreating] = useState(false)
  const [label, setLabel] = useState('')
  const [hours, setHours] = useState(24)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  async function createRoom() {
    if (creating) return
    setCreating(true)
    try {
      const r = await fetch(`/api/workspace/${workspaceId}/guest-rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim() || null, expiresInHours: hours }),
      })
      const data = await r.json() as { room: GuestRoom }
      setRooms(prev => [data.room, ...prev])
      setLabel('')
    } finally {
      setCreating(false)
    }
  }

  async function revokeRoom(token: string) {
    await fetch(`/api/workspace/${workspaceId}/guest-rooms?token=${encodeURIComponent(token)}`, { method: 'DELETE' })
    setRooms(prev => prev.filter(r => r.token !== token))
  }

  async function copyLink(token: string) {
    await navigator.clipboard.writeText(`${baseUrl}/meet/${token}`)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Salas de reunión</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Genera un enlace temporal para que tus clientes se unan a una llamada o videollamada sin necesidad de cuenta.
        </p>
      </div>

      {/* Create room */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Nueva sala</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Nombre descriptivo (opcional)"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
          <select
            value={hours}
            onChange={e => setHours(Number(e.target.value))}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value={1}>1 hora</option>
            <option value={6}>6 horas</option>
            <option value={24}>24 horas</option>
            <option value={72}>3 días</option>
            <option value={168}>1 semana</option>
          </select>
          <button
            onClick={createRoom}
            disabled={creating}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {creating ? 'Creando…' : 'Crear sala'}
          </button>
        </div>
      </div>

      {/* Room list */}
      {rooms.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No hay salas activas.</p>
      ) : (
        <div className="space-y-3">
          {rooms.map(room => (
            <div key={room.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{room.label ?? 'Sala sin nombre'}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground font-mono break-all">
                    {baseUrl}/meet/{room.token}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Expira {new Date(room.expiresAt).toLocaleString('es-ES')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => void copyLink(room.token)}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {copiedToken === room.token ? '¡Copiado!' : 'Copiar enlace'}
                  </button>
                  <button
                    onClick={() => void revokeRoom(room.token)}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive"
                  >
                    Revocar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
