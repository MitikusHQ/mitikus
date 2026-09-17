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

interface FileAttachment {
  _type: 'file'
  url: string
  name: string
  size: number
  mime: string
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

// ─── Jitsi call overlay ───────────────────────────────────────────────────────

interface JitsiCall {
  roomName: string
  peer: { id: string; name: string | null }
  myName: string | null
  incoming: boolean
  mode: 'audio' | 'video'
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function parseMessage(content: string): { text?: string; file?: FileAttachment } {
  try {
    const parsed = JSON.parse(content) as FileAttachment
    if (parsed._type === 'file') return { file: parsed }
  } catch { /* plain text */ }
  return { text: content }
}

function FileIcon({ mime }: { mime: string }) {
  if (mime.startsWith('image/')) return <span>🖼️</span>
  if (mime.startsWith('video/')) return <span>🎥</span>
  if (mime.startsWith('audio/')) return <span>🎵</span>
  if (mime.includes('pdf')) return <span>📄</span>
  if (mime.includes('zip') || mime.includes('rar')) return <span>🗜️</span>
  return <span>📎</span>
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

// ─── Jitsi overlay ─────────────────────────────────────────────────────────────

function JitsiOverlay({ call, onHangup }: {
  call: JitsiCall
  onHangup: () => void
}) {
  const [accepted, setAccepted] = useState(!call.incoming)

  function accept() {
    setAccepted(true)
  }

  useEffect(() => {
    if (!accepted) return
    const params = new URLSearchParams({
      config: JSON.stringify({
        startWithAudioMuted: false,
        startWithVideoMuted: call.mode === 'audio',
        prejoinPageEnabled: false,
        disableDeepLinking: true,
      }),
    })
    const url = `https://meet.jit.si/${call.roomName}#userInfo.displayName="${encodeURIComponent(call.myName ?? 'Usuario MITIKUS')}"`
    const win = window.open(url, '_blank', 'noopener')
    if (!win) {
      // fallback if popup blocked
      window.location.href = url
    }
    onHangup()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accepted])

  // Incoming call — show accept/reject. Outgoing opens tab automatically via useEffect.
  if (!accepted) {
    return (
      <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center">
        <div className="bg-card rounded-2xl p-8 flex flex-col items-center gap-6 shadow-2xl">
          <span className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white ${avatarColor(call.peer.id)}`}>
            {initials(call.peer.name, call.peer.id)}
          </span>
          <div className="text-center">
            <p className="text-lg font-semibold">{call.peer.name ?? call.peer.id}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {call.mode === 'video' ? 'Videollamada entrante' : 'Llamada de voz entrante'}
            </p>
          </div>
          <div className="flex gap-6">
            <button onClick={onHangup}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-2xl"
              title="Rechazar">✕</button>
            <button onClick={() => setAccepted(true)}
              className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center text-2xl"
              title="Aceptar">✓</button>
          </div>
        </div>
      </div>
    )
  }

  // accepted=true → useEffect opens tab and calls onHangup → overlay unmounts
  return null
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ChatBubbleBar({ myId }: { myId: string }) {
  const [members, setMembers] = useState<Member[]>([])
  const [chats, setChats] = useState<ChatWindow[]>([])
  const [jitsiCall, setJitsiCall] = useState<JitsiCall | null>(null)
  const lastEventTime = useRef(new Date().toISOString())
  const audioCtxRef = useRef<AudioContext | null>(null)
  const msgEndRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const openingRef = useRef<Set<string>>(new Set())
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

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

  // Open DM from TeamPanel (mitikus:open-dm)
  useEffect(() => {
    async function onOpenDm(e: Event) {
      const member = (e as CustomEvent<{ member: Member }>).detail.member
      if (!member || member.isMe) return
      setChats(prev => {
        const existing = prev.find(c => c.member.id === member.id)
        if (existing) {
          return prev.map(c => c.member.id === member.id ? { ...c, minimized: false } : c)
        }
        return prev
      })
      setChats(prev => {
        if (prev.find(c => c.member.id === member.id)) return prev
        void openDmAsync(member)
        return prev
      })
    }
    window.addEventListener('mitikus:open-dm', onOpenDm)
    return () => window.removeEventListener('mitikus:open-dm', onOpenDm)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function openDmAsync(member: Member) {
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
      if (prev.find(c => c.member.id === member.id)) return prev
      const kept = prev.slice(-2)
      return [...kept, { member, convId, messages, unread: 0, minimized: false, draft: '', sending: false }]
    })
    setTimeout(() => msgEndRefs.current[convId]?.scrollIntoView(), 80)
  }

  // Poll for new message + jitsi_call events
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
          // Jitsi call invite
          if (ev.type === 'jitsi_call') {
            const { roomName, fromUserId, fromUserName, mode } = ev.payload as {
              roomName: string; fromUserId: string; fromUserName: string | null; mode: 'audio' | 'video'
            }
            setMembers(currentMembers => {
              const me = currentMembers.find(m => m.id === myId) ?? null
              setJitsiCall({
                roomName,
                peer: { id: fromUserId, name: fromUserName },
                myName: me?.name ?? null,
                incoming: true,
                mode,
              })
              return currentMembers
            })
            continue
          }
          if (ev.type === 'jitsi_hangup') {
            setJitsiCall(null)
            continue
          }

          if (ev.type !== 'new_message') continue
          const convId = String(ev.payload['conversationId'])
          const senderId = String(ev.payload['senderId'] ?? '')

          setChats(prev => {
            const existing = prev.find(c => c.convId === convId)
            if (existing) {
              return prev.map(c =>
                c.convId === convId
                  ? { ...c, unread: c.minimized ? c.unread + 1 : c.unread }
                  : c
              )
            }
            return prev
          })

          setChats(prev => {
            const existing = prev.find(c => c.convId === convId)
            if (existing || openingRef.current.has(convId)) return prev
            setMembers(currentMembers => {
              const sender = currentMembers.find(m => m.id === senderId)
              if (sender && !openingRef.current.has(convId)) {
                openingRef.current.add(convId)
                autoOpenChat(sender, convId).catch(() => { openingRef.current.delete(convId) })
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

  // Also refresh messages for open chats
  useEffect(() => {
    async function refreshChats() {
      setChats(prev => {
        prev.forEach(chat => {
          loadMessages(chat.convId).then(msgs => {
            setChats(p => p.map(c => c.convId === chat.convId ? { ...c, messages: msgs } : c))
          }).catch(() => {})
        })
        return prev
      })
    }
    const id = setInterval(refreshChats, 4000)
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

  async function sendFile(chat: ChatWindow, file: File) {
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo supera el límite de 10 MB')
      return
    }
    setChats(prev => prev.map(c => c.member.id === chat.member.id ? { ...c, sending: true } : c))
    const form = new FormData()
    form.append('file', file)
    await fetch(`/api/team/conversations/${chat.convId}/upload`, { method: 'POST', body: form })
    const msgs = await loadMessages(chat.convId)
    setChats(prev => prev.map(c => c.member.id === chat.member.id ? { ...c, messages: msgs, sending: false } : c))
    setTimeout(() => msgEndRefs.current[chat.convId]?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  // ─── Jitsi call helpers ──────────────────────────────────────────────────────

  async function signalJitsi(targetUserId: string, type: 'jitsi_call' | 'jitsi_hangup', payload: Record<string, unknown> = {}) {
    await fetch('/api/team/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId, type, payload }),
    })
  }

  function startJitsiCall(peer: Member, mode: 'audio' | 'video') {
    const roomName = `mitikus-${[myId, peer.id].sort().join('-')}-${Date.now()}`
    const myMember = members.find(m => m.id === myId) ?? null
    setJitsiCall({ roomName, peer: { id: peer.id, name: peer.name }, myName: myMember?.name ?? null, incoming: false, mode })
    void signalJitsi(peer.id, 'jitsi_call', { roomName, mode })
  }

  function hangupJitsi(peerId?: string) {
    if (peerId) void signalJitsi(peerId, 'jitsi_hangup', {})
    setJitsiCall(null)
  }

  // Listen for call requests from ChatBubble buttons (mitikus:bubble-call)
  useEffect(() => {
    function onBubbleCall(e: Event) {
      const { peerId, mode } = (e as CustomEvent<{ peerId: string; mode: 'audio' | 'video' }>).detail
      const peer = members.find(m => m.id === peerId)
      if (peer) startJitsiCall(peer, mode)
    }
    window.addEventListener('mitikus:bubble-call', onBubbleCall)
    return () => window.removeEventListener('mitikus:bubble-call', onBubbleCall)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members])

  if (chats.length === 0 && !jitsiCall) return null

  return (
    <>
      {/* Jitsi call overlay */}
      {jitsiCall && (
        <JitsiOverlay
          call={jitsiCall}
          onHangup={() => hangupJitsi(jitsiCall.peer.id)}
        />
      )}

      {/* Chat bubbles */}
      <div className="fixed bottom-0 right-3 z-[65] flex items-end gap-2">
        {chats.map(chat => (
          <div key={chat.member.id} className="flex flex-col" style={{ width: 288 }}>
            <div className="rounded-t-xl overflow-hidden shadow-2xl border border-border bg-card">
              {/* Header */}
              <div className="w-full flex items-center gap-2 px-3 py-2.5 bg-primary text-primary-foreground">
                {chat.member.avatarUrl ? (
                  <img src={chat.member.avatarUrl} alt={chat.member.name ?? chat.member.email}
                    className="w-7 h-7 rounded-full object-cover shrink-0" />
                ) : (
                  <span className={`w-7 h-7 rounded-full ${avatarColor(chat.member.id)} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>
                    {initials(chat.member.name, chat.member.email)}
                  </span>
                )}

                {/* Name — click to toggle minimize */}
                <button
                  type="button"
                  onClick={() => setChats(prev => prev.map(c =>
                    c.member.id === chat.member.id ? { ...c, minimized: !c.minimized, unread: 0 } : c
                  ))}
                  className="flex-1 text-sm font-semibold truncate text-left"
                >
                  {chat.member.name ?? chat.member.email}
                </button>

                {chat.unread > 0 && (
                  <span className="bg-white text-primary text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce shrink-0">
                    {chat.unread}
                  </span>
                )}

                {/* Audio call */}
                <button
                  type="button"
                  onClick={() => startJitsiCall(chat.member, 'audio')}
                  className="opacity-80 hover:opacity-100 p-0.5 shrink-0"
                  title="Llamada de voz"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3-8.63A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </button>

                {/* Video call */}
                <button
                  type="button"
                  onClick={() => startJitsiCall(chat.member, 'video')}
                  className="opacity-80 hover:opacity-100 p-0.5 shrink-0"
                  title="Videollamada"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
                  </svg>
                </button>

                {/* Minimize */}
                <button
                  type="button"
                  onClick={() => setChats(prev => prev.map(c =>
                    c.member.id === chat.member.id ? { ...c, minimized: !c.minimized, unread: 0 } : c
                  ))}
                  className="opacity-60 hover:opacity-100 px-1 text-sm shrink-0 leading-none"
                  title={chat.minimized ? 'Expandir' : 'Minimizar'}
                  aria-label={chat.minimized ? 'Expandir' : 'Minimizar'}
                >
                  {chat.minimized ? '▲' : '▼'}
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={() => closeChat(chat.member.id)}
                  className="opacity-60 hover:opacity-100 text-xs ml-0.5 shrink-0"
                  aria-label="Cerrar chat"
                >✕</button>
              </div>

              {!chat.minimized && (
                <>
                  {/* Messages */}
                  <div className="h-60 overflow-y-auto p-3 flex flex-col gap-1.5 bg-background">
                    {chat.messages.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center mt-8">Sin mensajes aún. ¡Di hola!</p>
                    )}
                    {chat.messages.map(msg => {
                      const { text, file } = parseMessage(msg.content)
                      const isMe = msg.senderId === myId
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {file ? (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 max-w-[82%] px-3 py-2 rounded-2xl text-sm border ${isMe ? 'bg-primary/10 border-primary/20 text-foreground rounded-br-sm' : 'bg-muted border-border text-foreground rounded-bl-sm'} hover:opacity-80 transition-opacity`}
                            >
                              <FileIcon mime={file.mime} />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-xs">{file.name}</p>
                                <p className="text-[10px] text-muted-foreground">{formatBytes(file.size)}</p>
                              </div>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted-foreground" aria-hidden>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                              </svg>
                            </a>
                          ) : (
                            <div className={`max-w-[82%] px-3 py-1.5 rounded-2xl text-sm leading-snug ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                              {text}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <div ref={el => { msgEndRefs.current[chat.convId] = el }} />
                  </div>

                  {/* Input area */}
                  <div className="border-t border-border p-2 flex gap-1.5 bg-card items-end">
                    {/* File attach */}
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[chat.convId]?.click()}
                      disabled={chat.sending}
                      className="w-8 h-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 transition-colors disabled:opacity-40"
                      title="Adjuntar archivo (máx. 10 MB)"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                      </svg>
                    </button>
                    <input
                      type="file"
                      className="hidden"
                      ref={el => { fileInputRefs.current[chat.convId] = el }}
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) void sendFile(chat, file)
                        if (e.target) e.target.value = ''
                      }}
                    />

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
    </>
  )
}
