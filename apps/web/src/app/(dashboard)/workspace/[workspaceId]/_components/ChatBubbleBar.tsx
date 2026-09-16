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

const PRESENCE_DOT: Record<Status, string> = {
  OFFLINE: 'bg-zinc-400',
  AVAILABLE: 'bg-green-500',
  BUSY: 'bg-yellow-400',
  IN_MEETING: 'bg-red-500',
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

  // Poll for new message events
  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/team/events?since=${encodeURIComponent(lastEventTime.current)}`)
        if (!res.ok) return
        const data = await res.json() as { events: Array<{ type: string; payload: Record<string, unknown> }>; serverTime: string }
        lastEventTime.current = data.serverTime
        let played = false
        for (const ev of data.events) {
          if (ev.type !== 'new_message') continue
          const convId = String(ev.payload['conversationId'])
          setChats(prev => {
            const idx = prev.findIndex(c => c.convId === convId)
            if (idx === -1) return prev
            return prev.map(c =>
              c.convId === convId
                ? { ...c, unread: c.minimized ? c.unread + 1 : c.unread }
                : c
            )
          })
          // Reload messages for open chats
          const openChat = chats.find(c => c.convId === convId)
          if (openChat && !openChat.minimized) {
            void loadMessages(convId).then(msgs => {
              setChats(prev => prev.map(c => c.convId === convId ? { ...c, messages: msgs } : c))
              setTimeout(() => msgEndRefs.current[convId]?.scrollIntoView({ behavior: 'smooth' }), 50)
            })
          }
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
  }, [chats])

  async function loadMessages(convId: string): Promise<Message[]> {
    const res = await fetch(`/api/team/conversations/${convId}/messages`)
    if (!res.ok) return []
    const data = await res.json() as { messages: Message[] }
    return data.messages
  }

  async function openChat(member: Member) {
    const existing = chats.find(c => c.member.id === member.id)
    if (existing) {
      setChats(prev => prev.map(c =>
        c.member.id === member.id ? { ...c, minimized: !c.minimized, unread: 0 } : c
      ))
      return
    }
    const res = await fetch('/api/team/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ peerId: member.id }),
    })
    if (!res.ok) return
    const data = await res.json() as { conversationId: string }
    const convId = data.conversationId
    const messages = await loadMessages(convId)
    setChats(prev => {
      const kept = prev.slice(-2)
      return [...kept, { member, convId, messages, unread: 0, minimized: false, draft: '', sending: false }]
    })
    setTimeout(() => msgEndRefs.current[data.conversationId]?.scrollIntoView(), 80)
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

  if (members.length === 0) return null

  return (
    <div className="fixed bottom-0 right-3 z-[65] flex items-end gap-2">
      {/* Open chat windows */}
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
              <span className={`w-7 h-7 rounded-full ${avatarColor(chat.member.id)} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>
                {initials(chat.member.name, chat.member.email)}
              </span>
              <span className="text-sm font-semibold truncate flex-1 text-left">
                {chat.member.name ?? chat.member.email}
              </span>
              {chat.unread > 0 && (
                <span className="bg-white text-primary text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce shrink-0">
                  {chat.unread}
                </span>
              )}
              <span
                role="button"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); closeChat(chat.member.id) }}
                onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); closeChat(chat.member.id) } }}
                className="opacity-60 hover:opacity-100 text-xs ml-1 shrink-0"
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

      {/* Avatar bubbles row */}
      <div className="flex items-center gap-2 pb-1.5">
        {members.map(member => {
          const chat = chats.find(c => c.member.id === member.id)
          const hasUnread = (chat?.unread ?? 0) > 0
          const isOpen = !!chat && !chat.minimized

          return (
            <button
              key={member.id}
              type="button"
              onClick={() => void openChat(member)}
              title={member.name ?? member.email}
              aria-label={`Chat con ${member.name ?? member.email}`}
              className="relative group shrink-0"
            >
              {/* Outer pulse ring when unread */}
              {hasUnread && (
                <span className="absolute inset-[-3px] rounded-full border-2 border-primary animate-ping opacity-60" />
              )}
              {/* Active indicator */}
              {isOpen && !hasUnread && (
                <span className="absolute inset-[-2px] rounded-full border-2 border-primary opacity-70" />
              )}

              {/* Avatar */}
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={member.name ?? member.email}
                  className="w-11 h-11 rounded-full object-cover border-[3px] border-card shadow-lg group-hover:scale-105 transition-transform"
                />
              ) : (
                <span className={`w-11 h-11 rounded-full ${avatarColor(member.id)} flex items-center justify-center text-sm font-bold text-white border-[3px] border-card shadow-lg group-hover:scale-105 transition-transform`}>
                  {initials(member.name, member.email)}
                </span>
              )}

              {/* Presence dot */}
              <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-card ${PRESENCE_DOT[member.status]}`} />

              {/* Unread badge */}
              {hasUnread && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 animate-bounce shadow">
                  {chat!.unread > 9 ? '9+' : chat!.unread}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
