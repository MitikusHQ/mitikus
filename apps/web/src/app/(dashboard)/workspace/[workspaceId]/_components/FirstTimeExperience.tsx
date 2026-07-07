'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  workspaceId: string
  userName:    string
}

export function FirstTimeExperience({ workspaceId, userName }: Props) {
  const [input, setInput]     = useState('')
  const [visible, setVisible] = useState(false)
  const inputRef              = useRef<HTMLTextAreaElement>(null)
  const router                = useRouter()

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (visible) inputRef.current?.focus()
  }, [visible])

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
      {/* Logo */}
      <p className="absolute top-7 left-8 text-sm font-semibold tracking-widest text-muted-foreground/50 uppercase">
        mitikus
      </p>

      <div className="w-full max-w-lg space-y-10">
        {/* Saludo */}
        <div className="space-y-2">
          <p className="text-muted-foreground text-base">Hola, {userName}.</p>
          <h1 className="text-3xl font-semibold leading-snug">
            ¿A qué se dedica<br />tu empresa?
          </h1>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Somos una consultora de ciberseguridad para pymes…"
            rows={3}
            className="
              w-full resize-none rounded-xl border bg-card px-4 py-3
              text-base placeholder:text-muted-foreground/40
              focus:outline-none focus:ring-2 focus:ring-primary/40
              transition
            "
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Enter para continuar · Shift+Enter para nueva línea
            </p>
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

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => router.push(`/workspace/${workspaceId}/copilot`)}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition underline-offset-4 hover:underline"
            >
              Saltar por ahora
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
