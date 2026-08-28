'use client'

import { useEffect, useRef, useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SESSION_KEY = (wsId: string) => `support-chat-${wsId}`
const MAX_MESSAGES = 20

function useSessionMessages(workspaceId: string) {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY(workspaceId))
      if (stored) setMessages(JSON.parse(stored))
    } catch {}
  }, [workspaceId])

  function persist(msgs: Message[]) {
    setMessages(msgs)
    try {
      sessionStorage.setItem(SESSION_KEY(workspaceId), JSON.stringify(msgs))
    } catch {}
  }

  return { messages, persist }
}

function ContactModal({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return
    setSending(true)
    // Abre el cliente de correo con los datos prellenados
    const mailto = `mailto:hola@mitikus.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailto, '_blank')
    setSent(true)
    setSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
        {sent ? (
          <div className="text-center py-6 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p className="font-semibold text-sm">Mensaje preparado</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Se ha abierto tu cliente de correo con el mensaje listo para enviar a <strong>hola@mitikus.com</strong>. Te responderemos en menos de 24h.
            </p>
            <button
              onClick={onClose}
              className="mt-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Contactar con soporte</h3>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Cerrar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <p className="text-xs text-muted-foreground -mt-1">
              Te prepararemos un borrador listo para enviar a <strong>hola@mitikus.com</strong>
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium">Asunto</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                  placeholder="Ej. Problema con las facturas"
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium">Mensaje</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  required
                  rows={5}
                  placeholder="Descríbenos tu problema con el mayor detalle posible…"
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={!subject.trim() || !body.trim() || sending}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Abrir en mi correo →
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export function SupportChatClient({ workspaceId }: { workspaceId: string }) {
  const { messages, persist } = useSessionMessages(workspaceId)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showContact, setShowContact] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const atLimit = messages.length >= MAX_MESSAGES

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || streaming || atLimit) return

    setInput('')
    setError(null)

    const next: Message[] = [...messages, { role: 'user', content: text }]
    persist(next)
    setStreaming(true)

    try {
      const res = await fetch(`/api/workspace/${workspaceId}/support/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'No se pudo conectar con el asistente. Inténtalo de nuevo.')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let reply = ''

      const withPlaceholder: Message[] = [...next, { role: 'assistant', content: '' }]
      persist(withPlaceholder)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        reply += decoder.decode(value, { stream: true })
        persist([...next, { role: 'assistant', content: reply }])
      }
    } catch (err) {
      setError('No se pudo enviar el mensaje. Inténtalo de nuevo.')
      persist(messages)
    } finally {
      setStreaming(false)
      textareaRef.current?.focus()
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function clearSession() {
    try { sessionStorage.removeItem(SESSION_KEY(workspaceId)) } catch {}
    persist([])
  }

  return (
    <>
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h2 className="font-semibold text-sm">Soporte MITIKUS</h2>
            <p className="text-xs text-muted-foreground">Asistente automático</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowContact(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Contactar
            </button>
            {messages.length > 0 && (
              <button onClick={clearSession} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Nueva sesión
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm">¿En qué puedo ayudarte?</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Pregúntame sobre las funcionalidades de MITIKUS, tu plan, o cualquier duda técnica.
                </p>
              </div>
              <div className="flex flex-col gap-2 mt-2 w-full max-w-xs">
                {[
                  '¿Cómo añado un cliente?',
                  '¿Qué incluye mi plan?',
                  '¿Cómo firmo un contrato?',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); textareaRef.current?.focus() }}
                    className="text-left text-xs rounded-lg border border-border px-3 py-2 hover:bg-muted/50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowContact(true)}
                className="mt-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
              >
                ¿Prefieres escribirnos directamente?
              </button>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-primary">M</span>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted rounded-tl-sm'
                  } ${msg.content === '' && msg.role === 'assistant' ? 'animate-pulse w-16 h-8' : ''}`}
                >
                  {msg.content || (msg.role === 'assistant' && streaming ? '…' : '')}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Limit notice */}
        {atLimit && (
          <div className="mx-4 mb-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-2">
            <span>Límite de sesión alcanzado.</span>
            <div className="flex gap-2 shrink-0">
              <button onClick={clearSession} className="underline font-medium">Nueva sesión</button>
              <span>·</span>
              <button onClick={() => setShowContact(true)} className="underline font-medium">Escribirnos</button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-border">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={streaming || atLimit}
              placeholder={atLimit ? 'Sesión finalizada' : 'Escribe tu pregunta…'}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 max-h-32"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
            <button
              onClick={send}
              disabled={!input.trim() || streaming || atLimit}
              className="rounded-xl bg-primary p-2 text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              aria-label="Enviar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            {messages.filter(m => m.role === 'user').length}/{MAX_MESSAGES / 2} preguntas ·{' '}
            <button onClick={() => setShowContact(true)} className="underline hover:text-foreground transition-colors">
              ¿No encuentras respuesta? Escríbenos
            </button>
          </p>
        </div>
      </div>
    </>
  )
}
