'use client'

import { useState } from 'react'

export function DemoRequestForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company, message }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg border bg-card p-6 text-center space-y-2">
        <p className="text-lg font-semibold">✓ Recibido</p>
        <p className="text-sm text-muted-foreground">
          Te escribimos en menos de 24h laborables para agendar tu demo de 20 minutos.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-6 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="lead-name" className="text-sm font-medium">Tu nombre</label>
          <input
            id="lead-name" type="text" required value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="lead-email" className="text-sm font-medium">Email de trabajo</label>
          <input
            id="lead-email" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="lead-company" className="text-sm font-medium">Nombre de tu consultora <span className="text-muted-foreground font-normal">(opcional)</span></label>
        <input
          id="lead-company" type="text" value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="lead-message" className="text-sm font-medium">Cuéntanos brevemente qué tipo de auditorías hacéis <span className="text-muted-foreground font-normal">(opcional)</span></label>
        <textarea
          id="lead-message" rows={3} value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      {status === 'error' && (
        <p className="text-sm text-destructive">No se pudo enviar. Inténtalo de nuevo o escríbenos directamente.</p>
      )}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? 'Enviando…' : 'Solicitar demo de 20 minutos'}
      </button>
      <p className="text-xs text-center text-muted-foreground">
        Sin compromiso. Sin tarjeta. Solo una conversación de 20 minutos.
      </p>
    </form>
  )
}
