'use client'

import { useState, useRef, useEffect } from 'react'
import { saveMessage } from '@/app/actions/notebooks'
import { ChatMessage } from './ChatMessage'
import type { NotebookMessageData, NotebookSourceData } from '@/app/actions/notebooks'

interface Props {
  notebookId:              string
  initialMessages:         NotebookMessageData[]
  sources:                 NotebookSourceData[]
  suggestedQuestion?:      string
  onSuggestedQuestionUsed?: () => void
}

export function ChatPanel({
  notebookId,
  initialMessages,
  sources,
  suggestedQuestion,
  onSuggestedQuestionUsed,
}: Props) {
  const [messages,   setMessages]   = useState<NotebookMessageData[]>(initialMessages)
  const [input,      setInput]      = useState('')
  const [streaming,  setStreaming]  = useState(false)
  const [streamText, setStreamText] = useState('')
  const [chatError,  setChatError]  = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamText])

  useEffect(() => {
    if (suggestedQuestion) {
      setInput(suggestedQuestion)
      onSuggestedQuestionUsed?.()
    }
  }, [suggestedQuestion, onSuggestedQuestionUsed])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || streaming) return
    setInput('')

    const userMsg: NotebookMessageData = {
      id:        crypto.randomUUID(),
      role:      'user',
      content:   text,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    await saveMessage(notebookId, 'user', text, sources.map((s) => s.id))

    setStreaming(true)
    setStreamText('')
    setChatError('')

    try {
      const res = await fetch(`/api/notebooks/${notebookId}/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      if (!res.body) throw new Error('No stream body')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        full += chunk
        setStreamText(full)
      }
      const assistantMsg: NotebookMessageData = {
        id:        crypto.randomUUID(),
        role:      'assistant',
        content:   full,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
      await saveMessage(notebookId, 'assistant', full, sources.map((s) => s.id))
    } catch {
      setChatError('No se pudo obtener respuesta. Inténtalo de nuevo.')
    } finally {
      setStreaming(false)
      setStreamText('')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !streaming && (
          <p className="text-center text-xs text-muted-foreground py-8">
            Haz una pregunta sobre las fuentes del notebook.
          </p>
        )}
        {messages.map((m) => (
          <ChatMessage key={m.id} role={m.role as 'user' | 'assistant'} content={m.content} />
        ))}
        {streaming && streamText && (
          <ChatMessage role="assistant" content={streamText} />
        )}
        {streaming && !streamText && (
          <div className="flex gap-1 justify-start">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs shrink-0">✦</div>
            <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">Pensando...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {chatError && (
        <p className="px-4 pb-2 text-xs text-destructive">{chatError}</p>
      )}
      <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSubmit(e as unknown as React.FormEvent) }
          }}
          placeholder="Escribe tu pregunta... (Enter para enviar)"
          rows={2}
          disabled={streaming || sources.length === 0}
          className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim() || sources.length === 0}
          className="self-end rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {streaming ? '...' : 'Enviar'}
        </button>
      </form>
    </div>
  )
}
