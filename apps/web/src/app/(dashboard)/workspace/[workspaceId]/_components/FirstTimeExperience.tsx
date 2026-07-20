'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  workspaceId: string
  userName:    string
}

const PILLARS = [
  { icon: '🔧', label: 'Herramientas', desc: 'Ejecuta auditorías, informes y checklists con un clic' },
  { icon: '🎯', label: 'Misiones', desc: 'Convierte objetivos en pasos concretos con Arkos' },
  { icon: '🏢', label: 'Clientes', desc: 'Todo el trabajo vinculado a cada cuenta' },
  { icon: '📊', label: 'Historial', desc: 'Cada ejecución guardada y exportable' },
]

export function FirstTimeExperience({ workspaceId, userName }: Props) {
  const [step, setStep]       = useState<'intro' | 'company'>('intro')
  const [input, setInput]     = useState('')
  const [visible, setVisible] = useState(false)
  const inputRef              = useRef<HTMLTextAreaElement>(null)
  const router                = useRouter()

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (step === 'company') setTimeout(() => inputRef.current?.focus(), 80)
  }, [step])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const msg = input.trim()
    if (!msg) return
    router.push(`/workspace/${workspaceId}/copilot?setup=${encodeURIComponent(msg)}`)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <div
      className={`
        fixed inset-0 z-50 flex flex-col items-center justify-center
        bg-background px-6
        transition-opacity duration-500
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <p className="absolute top-7 left-8 text-sm font-semibold tracking-widest text-muted-foreground/50 uppercase">
        mitikus
      </p>

      {/* ── Paso 1: intro ─────────────────────────────────────── */}
      {step === 'intro' && (
        <div className="w-full max-w-lg space-y-8">
          <div className="space-y-2">
            <p className="text-muted-foreground text-base">Hola, {userName}.</p>
            <h1 className="text-3xl font-semibold leading-snug">
              Bienvenido a MITIKUS.
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed pt-1">
              Tu sistema operativo empresarial. Todo el trabajo de tu empresa — herramientas, misiones, clientes e historial — en un solo lugar.
            </p>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-2 gap-3">
            {PILLARS.map((p) => (
              <div key={p.label} className="rounded-xl border bg-card p-4 space-y-1.5">
                <span className="text-xl">{p.icon}</span>
                <p className="text-sm font-semibold">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push(`/workspace/${workspaceId}`)}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition underline-offset-4 hover:underline"
            >
              Explorar por mi cuenta
            </button>
            <button
              type="button"
              onClick={() => setStep('company')}
              className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
            >
              Empezar →
            </button>
          </div>
        </div>
      )}

      {/* ── Paso 2: descripción empresa ───────────────────────── */}
      {step === 'company' && (
        <div className="w-full max-w-lg space-y-8">
          <div className="space-y-2">
            <p className="text-xs text-primary font-semibold uppercase tracking-widest">Paso 1 de 1</p>
            <h1 className="text-3xl font-semibold leading-snug">
              ¿A qué se dedica<br />tu empresa?
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Con esto Arkos aprende tu sector, tus servicios y tu contexto para personalizar todas las herramientas y misiones desde el primer momento.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Somos una consultoría de ciberseguridad para pymes industriales en España…"
              rows={4}
              className="
                w-full resize-none rounded-xl border bg-card px-4 py-3
                text-base placeholder:text-muted-foreground/40
                focus:outline-none focus:ring-2 focus:ring-primary/40
                transition
              "
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('intro')}
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition"
              >
                ← Volver
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push(`/workspace/${workspaceId}`)}
                  className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition underline-offset-4 hover:underline"
                >
                  Saltar por ahora
                </button>
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="
                    px-5 py-2.5 rounded-lg bg-primary text-primary-foreground
                    text-sm font-medium
                    disabled:opacity-40 disabled:cursor-not-allowed
                    hover:opacity-90 transition
                  "
                >
                  Continuar →
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
