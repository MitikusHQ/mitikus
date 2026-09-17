'use client'

import { useState, useEffect, useRef } from 'react'

type Status = 'OFFLINE' | 'AVAILABLE' | 'BUSY' | 'IN_MEETING'

interface Member {
  id: string
  name: string | null
  email: string
  avatarUrl: string | null
  isMe: boolean
  status: Status
}

interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
  sender: { id: string; name: string | null; email: string }
}

interface ChatWindow {
  member: Member
  convId: string
  messages: Message[]
  unread: number
  minimized: boolean
  draft: string
  sending: boolean
}

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-sky-500', 'bg-teal-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-orange-500', 'bg-rose-500',
]

function avatarColor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length] ?? 'bg-violet-500'
}

function initials(name: string | null, email: string) {
  if (name) {
    const p = name.trim().split(/\s+/)
    if (p.length >= 2) return ((p[0]?.[0] ?? '') + (p[p.length - 1]?.[0] ?? '')).toUpperCase()
    return (p[0]?.[0] ?? '?').toUpperCase()
  }
  return (email[0] ?? '?').toUpperCase()
}

function createAudioCtx(): AudioContext | null {
  try { return new AudioContext() } catch { return null }
}

function playMsgSound(ctx: AudioContext) {
  const t = ctx.currentTime
  const freqs = [1318.5, 1568]
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.connect(g); g.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = freq
    g.gain.setValueAtTime(0, t + i * 0.12)
    g.gain.linearRampToValueAtTime(0.14, t + i * 0.12 + 0.015)
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.35)
    osc.start(t + i * 0.12)
    osc.stop(t + i * 0.12 + 0.35)
  })
}

export function ChatBubbleBar({ myId }: { myId: string }) {
  const [members, setMembers] = useState<Member[]>([])
  const [chats, setChats] = useState<ChatWindow[]>([])
  const lastEventTime = useRef(new Date().toISOString())
  const audioCtxRef = useRef<AudioContext | null>(null)
  const msgEndRefs = useRef<Record<string, HTMLDivElement | null>>({})
  // Track convIds we're currently auto-opening to avoid duplicates
  const openingRef = useRef<Set<string>>(new Set())

  // Load team members
  useEffect(() => {
    async function load() {
      const res = await fetch('/api/team/members')
      if (!res.ok) return
      const data = await res.json() as { members: Member[] }
      setMembers(data.members.filter(m => !m.isMe))
    }
    void load()
    const id = setInterval(load, 8000)
    return () => clearInterval(id)
  }, [])

  // Open DM from TeamPanel click (mitikus:open-dm event)
  useEffect(() => {
    async function onOpenDm(e: Event) {
      const member = (e as CustomEvent<{ member: Member }>).detail.member
      if (!member || member.isMe) return
      // Find existing open chat
      setChats(prev => {
        const existing = prev.find(c => c.member.id === member.id)
        if (existing) {
          // Restore if minimized
          return prev.map(c => c.member.id === member.id ? { ...c, minimized: false } : c)
        }
        return prev
      })
      // If no existing chat, open a new one — find or create conversation
      setChats(prev => {
        if (prev.find(c => c.member.id === member.id)) return prev
        // Trigger async open
        openDmAsync(member)
        return prev
      })
    }
    window.addEventListener('mitikus:open-dm', onOpenDm)
    return () => window.removeEventListener('mitikus:open-dm', onOpenDm)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function openDmAsync(member: Member) {
    // Create or find conversation
    const res = await fetch('/api/team/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: member.id }),
    })
    if (!res.ok) return
    const data = await res.json() as { conversationId: string }
    const convId = data.conversationId
    const messages = await loadMessages(convId)
    setChats(prev => {
      if (prev.find(c => c.member.id === member.id)) return prev
      const kept = prev.slice(-2)
      return [...kept, { member, convId, messages, unread: 0, minimized: false, draft: '', sending: false }]
    })
  }

  // Poll for new message events — auto-open chat window when message arrives
  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/team/events?since=${encodeURIComponent(lastEventTime.current)}`)
        if (!res.ok) return
        const data = await res.json() as {
          events: Array<{ type: string; payload: Record<string, unknown> }>
          serverTime: string
        }
        lastEventTime.current = data.serverTime
        let played = false

        for (const ev of data.events) {
          if (ev.type !== 'new_message') continue
          const convId = String(ev.payload['conversationId'])
          const senderId = String(ev.payload['senderId'] ?? '')

          setChats(prev => {
            const existing = prev.find(c => c.convId === convId)
            if (existing) {
              // Window already open — increment unread if minimized
              return prev.map(c =>
                c.convId === convId
                  ? { ...c, unread: c.minimized ? c.unread + 1 : c.unread }
                  : c
              )
            }
            // No window yet — auto-open will be triggered below (return unchanged for now)
            return prev
          })

          // Auto-open: find member and open chat window
          setChats(prev => {
            const existing = prev.find(c => c.convId === convId)
            if (existing || openingRef.current.has(convId)) return prev
            // Find the sender in members
            setMembers(currentMembers => {
              const sender = currentMembers.find(m => m.id === senderId)
              if (sender && !openingRef.current.has(convId)) {
                openingRef.current.add(convId)
                autoOpenChat(sender, convId).catch(() => {
                  openingRef.current.delete(convId)
                })
              }
              return currentMembers
            })
            return prev
          })

          if (!played) {
            played = true
            if (!audioCtxRef.current) audioCtxRef.current = createAudioCtx()
            if (audioCtxRef.current) {
              if (audioCtxRef.current.state === 'suspended') void audioCtxRef.current.resume()
              playMsgSound(audioCtxRef.current)
            }
          }
        }
      } catch { /* ignore */ }
    }
    const id = setInterval(poll, 2000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadMessages(convId: string): Promise<Message[]> {
    const res = await fetch(`/api/team/conversations/${convId}/messages`)
    if (!res.ok) return []
    const data = await res.json() as { messages: Message[] }
    return data.messages
  }

  async function autoOpenChat(member: Member, convId: string) {
    const messages = await loadMessages(convId)
    setChats(prev => {
      if (prev.find(c => c.convId === convId)) {
        openingRef.current.delete(convId)
        return prev
      }
      const kept = prev.slice(-2)
      openingRef.current.delete(convId)
      return [...kept, { member, convId, messages, unread: 1, minimized: false, draft: '', sending: false }]
    })
    setTimeout(() => msgEndRefs.current[convId]?.scrollIntoView(), 80)
  }

  function closeChat(memberId: string) {
    setChats(prev => prev.filter(c => c.member.id !== memberId))
  }

  async function sendMessage(chat: ChatWindow) {
    if (!chat.draft.trim() || chat.sending) return
    const content = chat.draft.trim()
    setChats(prev => prev.map(c => c.member.id === chat.member.id ? { ...c, draft: '', sending: true } : c))
    await fetch(`/api/team/conversations/${chat.convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    const msgs = await loadMessages(chat.convId)
    setChats(prev => prev.map(c => c.member.id === chat.member.id ? { ...c, messages: msgs, sending: false } : c))
    setTimeout(() => msgEndRefs.current[chat.convId]?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  function startCallFromBubble(peerId: string, mode: 'audio' | 'video') {
    window.dispatchEvent(new CustomEvent('mitikus:bubble-call', { detail: { peerId, mode } }))
  }

  if (chats.length === 0) return null

  return (
    <div className="fixed bottom-0 right-3 z-[65] flex items-end gap-2">
      {chats.map(chat => (
        <div key={chat.member.id} className="flex flex-col" style={{ width: 288 }}>
          <div className="rounded-t-xl overflow-hidden shadow-2xl border border-border bg-card">
            {/* Header */}
            <button
              type="button"
              onClick={() => setChats(prev => prev.map(c =>
                c.member.id === chat.member.id ? { ...c, minimized: !c.minimized, unread: 0 } : c
              ))}
              className="w-full flex items-center gap-2 px-3 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {/* Avatar */}
              {chat.member.avatarUrl ? (
                <img
                  src={chat.member.avatarUrl}
                  alt={chat.member.name ?? chat.member.email}
                  className="w-7 h-7 rounded-full object-cover shrink-0"
                />
              ) : (
                <span className={`w-7 h-7 rounded-full ${avatarColor(chat.member.id)} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>
                  {initials(chat.member.name, chat.member.email)}
                </span>
              )}
              <span className="text-sm font-semibold truncate flex-1 text-left">
                {chat.member.name ?? chat.member.email}
              </span>
              {chat.unread > 0 && (
                <span className="bg-white text-primary text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce shrink-0">
                  {chat.unread}
                </span>
              )}
              {/* Call buttons */}
              <span
                role="button"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); startCallFromBubble(chat.member.id, 'audio') }}
                onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); startCallFromBubble(chat.member.id, 'audio') } }}
                className="opacity-80 hover:opacity-100 p-0.5 shrink-0"
                aria-label="Llamada"
                title="Llamada de audio"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3-8.63A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); startCallFromBubble(chat.member.id, 'video') }}
                onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); startCallFromBubble(chat.member.id, 'video') } }}
                className="opacity-80 hover:opacity-100 p-0.5 shrink-0"
                aria-label="Videollamada"
                title="Videollamada"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
                </svg>
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); closeChat(chat.member.id) }}
                onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); closeChat(chat.member.id) } }}
                className="opacity-60 hover:opacity-100 text-xs ml-0.5 shrink-0"
                aria-label="Cerrar chat"
              >✕</span>
            </button>

            {!chat.minimized && (
              <>
                {/* Messages area */}
                <div className="h-60 overflow-y-auto p-3 flex flex-col gap-1.5 bg-background">
                  {chat.messages.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center mt-8">
                      Sin mensajes aún. ¡Di hola!
                    </p>
                  )}
                  {chat.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderId === myId ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] px-3 py-1.5 rounded-2xl text-sm leading-snug ${
                        msg.senderId === myId
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted text-foreground rounded-bl-sm'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={el => { msgEndRefs.current[chat.convId] = el }} />
                </div>

                {/* Input */}
                <div className="border-t border-border p-2 flex gap-1.5 bg-card">
                  <input
                    type="text"
                    value={chat.draft}
                    onChange={e => setChats(prev => prev.map(c =>
                      c.member.id === chat.member.id ? { ...c, draft: e.target.value } : c
                    ))}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(chat) }
                    }}
                    placeholder="Escribe…"
                    className="flex-1 text-sm bg-muted rounded-full px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => void sendMessage(chat)}
                    disabled={chat.sending || !chat.draft.trim()}
                    className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:bg-primary/90 disabled:opacity-40 transition-colors"
                    aria-label="Enviar"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
