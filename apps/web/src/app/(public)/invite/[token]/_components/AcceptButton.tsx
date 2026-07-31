'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AcceptButton({ token }: { token: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al aceptar la invitación')
        return
      }
      router.push(data.workspaceUrl ?? '/dashboard')
    } catch {
      setError('Error de red. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {loading ? 'Uniéndome...' : 'Aceptar invitación'}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
