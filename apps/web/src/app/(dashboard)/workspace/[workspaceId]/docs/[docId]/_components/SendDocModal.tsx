'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { sendDocumentToClient } from '@/app/actions/documents'

interface Props {
  docId:       string
  workspaceId: string
  docTitle:    string
  onClose:     () => void
}

export function SendDocModal({ docId, workspaceId, docTitle, onClose }: Props) {
  const [email,  setEmail]  = useState('')
  const [name,   setName]   = useState('')
  const [note,   setNote]   = useState('')
  const [sent,   setSent]   = useState(false)
  const [error,  setError]  = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    emailRef.current?.focus()
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await sendDocumentToClient(
        docId,
        workspaceId,
        email.trim(),
        name.trim() || null,
        note.trim() || null,
      )
      if ('error' in result) {
        setError(result.error)
      } else {
        setSent(true)
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl border bg-card shadow-xl p-7 space-y-5">
        {sent ? (
          <div className="text-center space-y-4 py-4">
            <div className="text-4xl">✉️</div>
            <div>
              <p className="font-semibold text-base">Enviado</p>
              <p className="text-sm text-muted-foreground mt-1">
                El documento llegará a <strong>{email}</strong> en unos segundos.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-primary text-primary-foreground font-medium py-2.5 text-sm hover:bg-primary/90 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-base font-semibold">Enviar al cliente</h2>
              <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                Se enviará el contenido de <span className="font-medium text-foreground">{docTitle}</span> por email.
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Email del cliente *</label>
                <input
                  ref={emailRef}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@empresa.com"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Nombre (opcional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ana García"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Nota para el cliente (opcional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Adjunto el informe de auditoría tal y como acordamos…"
                  rows={2}
                  className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !email.trim()}
                  className="flex-1 rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Enviando…' : 'Enviar →'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
