'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  workspaceId: string
  brandColor?: string
}

export function LeadFormClient({ workspaceId, brandColor = '#3B82F6' }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setError('')

    const fd = new FormData(e.currentTarget)
    const body = {
      name:    fd.get('name') as string,
      email:   fd.get('email') as string,
      company: (fd.get('company') as string) || undefined,
      phone:   (fd.get('phone') as string) || undefined,
      message: (fd.get('message') as string) || undefined,
    }

    try {
      const res = await fetch(`/api/leads/${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Error al enviar')
      setStatus('success')
    } catch {
      setError('Ha ocurrido un error. Por favor, inténtalo de nuevo.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto text-2xl">
          ✅
        </div>
        <h2 className="text-lg font-semibold">¡Mensaje enviado!</h2>
        <p className="text-sm text-muted-foreground">
          Hemos recibido tu solicitud. Nos pondremos en contacto contigo lo antes posible.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-8 shadow-sm space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium" htmlFor="name">Nombre *</label>
          <input
            id="name" name="name" required
            placeholder="Tu nombre"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium" htmlFor="email">Email *</label>
          <input
            id="email" name="email" type="email" required
            placeholder="tu@email.com"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium" htmlFor="company">Empresa</label>
          <input
            id="company" name="company"
            placeholder="Nombre de tu empresa"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium" htmlFor="phone">Teléfono</label>
          <input
            id="phone" name="phone"
            placeholder="+34 600 000 000"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium" htmlFor="message">Mensaje</label>
        <textarea
          id="message" name="message" rows={4}
          placeholder="Cuéntanos en qué podemos ayudarte..."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        />
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        style={{ backgroundColor: brandColor }}
        className={cn(
          'w-full rounded-md px-4 py-2.5 text-sm font-medium text-white shadow transition-opacity',
          status === 'loading' && 'opacity-60 cursor-not-allowed',
        )}
      >
        {status === 'loading' ? 'Enviando...' : 'Enviar solicitud'}
      </button>

    </form>
  )
}
