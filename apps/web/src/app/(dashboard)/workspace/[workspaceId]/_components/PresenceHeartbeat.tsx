'use client'

import { useEffect, useRef, useState } from 'react'

type PresenceStatus = 'OFFLINE' | 'AVAILABLE' | 'BUSY' | 'IN_MEETING'

const STATUS_OPTIONS: { value: PresenceStatus; label: string; dot: string }[] = [
  { value: 'AVAILABLE', label: 'Disponible',  dot: 'bg-green-500' },
  { value: 'BUSY',      label: 'Ocupado',     dot: 'bg-yellow-400' },
  { value: 'IN_MEETING',label: 'En reunión',  dot: 'bg-red-500' },
]

async function patchPresence(status: PresenceStatus) {
  await fetch('/api/team/presence', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
}

export function PresenceHeartbeat() {
  const [status, setStatus] = useState<PresenceStatus>('AVAILABLE')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Marcar AVAILABLE al entrar, OFFLINE al salir
  useEffect(() => {
    void patchPresence('AVAILABLE')
    return () => { void patchPresence('OFFLINE') }
  }, [])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function changeStatus(s: PresenceStatus) {
    setStatus(s)
    setOpen(false)
    window.dispatchEvent(new CustomEvent('presenceChange', { detail: { status: s } }))
    await patchPresence(s)
  }

  const current = STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0]!

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted/40 transition-colors text-xs text-muted-foreground"
        title="Mi estado"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${current.dot}`} />
        <span className="hidden sm:inline">{current.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-36 rounded-lg border border-border bg-card shadow-lg py-1">
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => void changeStatus(o.value)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted/40 transition-colors ${status === o.value ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${o.dot}`} />
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
