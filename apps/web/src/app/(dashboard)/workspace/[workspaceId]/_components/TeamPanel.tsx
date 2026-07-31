'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type PresenceStatus = 'OFFLINE' | 'AVAILABLE' | 'BUSY' | 'IN_MEETING'

interface Member {
  id: string
  name: string | null
  email: string
  isMe: boolean
  status: PresenceStatus
}

interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
  sender: { id: string; name: string | null; email: string }
}

interface TeamEvent {
  id: string
  type: string
  payload: Record<string, unknown>
  createdAt: string
}

interface Props {
  onClose: () => void
  myId: string
}

// ─── ICE config ──────────────────────────────────────────────────────────────

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
]

// ─── Avatar + presence badge ──────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-sky-500', 'bg-teal-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-orange-500', 'bg-rose-500',
  'bg-pink-500', 'bg-indigo-500',
]

function avatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? 'bg-violet-500'
}

function initials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
    return (parts[0]?.[0] ?? '?').toUpperCase()
  }
  return (email[0] ?? '?').toUpperCase()
}

const PRESENCE_DOT: Record<PresenceStatus, string> = {
  OFFLINE: 'bg-zinc-400',
  AVAILABLE: 'bg-green-500',
  BUSY: 'bg-yellow-400',
  IN_MEETING: 'bg-red-500',
}

const PRESENCE_LABEL: Record<PresenceStatus, string> = {
  OFFLINE: 'Desconectado',
  AVAILABLE: 'Disponible',
  BUSY: 'Ocupado',
  IN_MEETING: 'En reunión',
}

function Avatar({ id, name, email, status, size = 'md' }: {
  id: string
  name: string | null
  email: string
  status: PresenceStatus
  size?: 'sm' | 'md'
}) {
  const sz = size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-9 h-9 text-sm'
  const dot = size === 'sm' ? 'w-2 h-2 border' : 'w-2.5 h-2.5 border'
  return (
    <span className="relative shrink-0 inline-block" title={PRESENCE_LABEL[status]}>
      <span className={`${sz} ${avatarColor(id)} rounded-full flex items-center justify-center font-semibold text-white select-none`}>
        {initials(name, email)}
      </span>
      <span className={`absolute bottom-0 right-0 ${dot} ${PRESENCE_DOT[status]} rounded-full border-card`} />
    </span>
  )
}

function PresenceDot({ status }: { status: PresenceStatus }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${PRESENCE_DOT[status]}`}
      title={PRESENCE_LABEL[status]}
    />
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TeamPanel({ onClose, myId }: Props) {
  const [members, setMembers] = useState<Member[]>([])
  const [myStatus, setMyStatus] = useState<PresenceStatus>('AVAILABLE')
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [activePeer, setActivePeer] = useState<Member | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // WebRTC call state
  const [callState, setCallState] = useState<'idle' | 'incoming' | 'calling' | 'connected'>('idle')
  const [callPeer, setCallPeer] = useState<{ id: string; name: string | null } | null>(null)
  const [callMode, setCallMode] = useState<'audio' | 'video'>('audio')
  const [incomingOffer, setIncomingOffer] = useState<RTCSessionDescriptionInit | null>(null)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  // Polling cursor
  const lastEventTime = useRef(new Date().toISOString())

  // ─── Presence: set AVAILABLE on mount, OFFLINE on unmount ─────────────────
  useEffect(() => {
    void patchPresence('AVAILABLE')
    return () => { void patchPresence('OFFLINE') }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function patchPresence(status: PresenceStatus) {
    await fetch('/api/team/presence', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  async function changeMyStatus(status: PresenceStatus) {
    setMyStatus(status)
    await patchPresence(status)
  }

  // ─── Fetch members ─────────────────────────────────────────────────────────
  const fetchMembers = useCallback(async () => {
    const res = await fetch('/api/team/members')
    if (!res.ok) return
    const data = await res.json() as { members: Member[] }
    setMembers(data.members)
  }, [])

  useEffect(() => {
    void fetchMembers()
    const interval = setInterval(fetchMembers, 5000)
    return () => clearInterval(interval)
  }, [fetchMembers])

  // ─── Events polling ────────────────────────────────────────────────────────
  const pollEvents = useCallback(async () => {
    const res = await fetch(`/api/team/events?since=${lastEventTime.current}`)
    if (!res.ok) return
    const data = await res.json() as { events: TeamEvent[]; serverTime: string }
    lastEventTime.current = data.serverTime
    for (const ev of data.events) {
      await handleTeamEvent(ev)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId, callState])

  useEffect(() => {
    const interval = setInterval(pollEvents, 1000)
    return () => clearInterval(interval)
  }, [pollEvents])

  async function handleTeamEvent(ev: TeamEvent) {
    const p = ev.payload as Record<string, unknown>

    if (ev.type === 'new_message') {
      if (activeConvId && p['conversationId'] === activeConvId) {
        await loadMessages(activeConvId)
      }
      return
    }

    if (ev.type === 'call_offer') {
      if (callState !== 'idle') return
      setCallPeer({ id: String(p['fromUserId']), name: p['fromUserName'] as string | null })
      setCallMode((p['mode'] as 'audio' | 'video') ?? 'audio')
      setIncomingOffer(p['offer'] as RTCSessionDescriptionInit)
      setCallState('incoming')
      return
    }

    if (ev.type === 'call_answer' && pcRef.current) {
      await pcRef.current.setRemoteDescription(p['answer'] as RTCSessionDescriptionInit)
      return
    }

    if (ev.type === 'call_ice' && pcRef.current) {
      try {
        await pcRef.current.addIceCandidate(p['candidate'] as RTCIceCandidateInit)
      } catch { /* ignore */ }
      return
    }

    if (ev.type === 'call_hangup' || ev.type === 'call_reject') {
      endCall()
      return
    }
  }

  // ─── Open conversation with peer ───────────────────────────────────────────
  async function openConversation(peer: Member) {
    setActivePeer(peer)
    const res = await fetch('/api/team/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ peerId: peer.id }),
    })
    const data = await res.json() as { conversationId: string }
    setActiveConvId(data.conversationId)
    await loadMessages(data.conversationId)
  }

  async function loadMessages(convId: string) {
    const res = await fetch(`/api/team/conversations/${convId}/messages`)
    if (!res.ok) return
    const data = await res.json() as { messages: Message[] }
    setMessages(data.messages)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function sendMessage() {
    if (!draft.trim() || !activeConvId) return
    setSending(true)
    const content = draft.trim()
    setDraft('')
    await fetch(`/api/team/conversations/${activeConvId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    await loadMessages(activeConvId)
    setSending(false)
  }

  // ─── WebRTC helpers ────────────────────────────────────────────────────────

  async function signal(targetUserId: string, type: string, payload: Record<string, unknown>) {
    await fetch('/api/team/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId, type, payload }),
    })
  }

  function createPeerConnection(targetUserId: string) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        void signal(targetUserId, 'call_ice', { candidate: e.candidate.toJSON() })
      }
    }
    pc.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0] ?? null
      }
    }
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setCallState('connected')
      if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) endCall()
    }
    pcRef.current = pc
    return pc
  }

  async function startCall(peer: Member, mode: 'audio' | 'video') {
    if (callState !== 'idle') return
    setCallPeer(peer)
    setCallMode(mode)
    setCallState('calling')

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: mode === 'video',
    })
    localStreamRef.current = stream
    if (localVideoRef.current) localVideoRef.current.srcObject = stream

    const pc = createPeerConnection(peer.id)
    stream.getTracks().forEach((t) => pc.addTrack(t, stream))

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await signal(peer.id, 'call_offer', { offer, mode })
  }

  async function acceptCall() {
    if (!callPeer || !incomingOffer) return
    setCallState('connected')

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callMode === 'video',
    })
    localStreamRef.current = stream
    if (localVideoRef.current) localVideoRef.current.srcObject = stream

    const pc = createPeerConnection(callPeer.id)
    stream.getTracks().forEach((t) => pc.addTrack(t, stream))

    await pc.setRemoteDescription(incomingOffer)
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await signal(callPeer.id, 'call_answer', { answer })
    setIncomingOffer(null)
  }

  function rejectCall() {
    if (callPeer) void signal(callPeer.id, 'call_reject', {})
    setCallState('idle')
    setCallPeer(null)
    setIncomingOffer(null)
  }

  function endCall() {
    if (callPeer && callState !== 'idle') {
      void signal(callPeer.id, 'call_hangup', {})
    }
    pcRef.current?.close()
    pcRef.current = null
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    setCallState('idle')
    setCallPeer(null)
    setIncomingOffer(null)
  }

  const STATUS_OPTIONS: Array<{ value: PresenceStatus; label: string }> = [
    { value: 'AVAILABLE', label: 'Disponible' },
    { value: 'BUSY', label: 'Ocupado' },
    { value: 'IN_MEETING', label: 'En reunión' },
  ]

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Overlay de videollamada (siempre renderizado, oculto si idle) */}
      {callState !== 'idle' && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center gap-4">
          {/* Remote video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="rounded-xl max-h-[60vh] max-w-full bg-zinc-900"
          />
          {/* Local video (PiP) */}
          {callMode === 'video' && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-24 right-8 w-36 h-24 rounded-lg object-cover bg-zinc-800 border border-zinc-700"
            />
          )}

          <div className="flex flex-col items-center gap-3">
            {callPeer && callMode === 'audio' && (
              <span className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white ${avatarColor(callPeer.id)}`}>
                {initials(callPeer.name, callPeer.id)}
              </span>
            )}
            <p className="text-white text-lg font-medium">
              {callPeer?.name ?? callPeer?.id}
            </p>
            <p className="text-zinc-400 text-sm">
              {callState === 'calling' ? 'Llamando…' : callState === 'incoming' ? 'Llamada entrante' : 'Conectado'}
            </p>
          </div>

          <div className="flex items-center gap-4 mt-2">
            {callState === 'incoming' ? (
              <>
                <button
                  onClick={acceptCall}
                  className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center text-2xl"
                  title="Aceptar"
                >
                  ✓
                </button>
                <button
                  onClick={rejectCall}
                  className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-2xl"
                  title="Rechazar"
                >
                  ✕
                </button>
              </>
            ) : (
              <button
                onClick={endCall}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-2xl"
                title="Colgar"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Panel lateral */}
      <div className="flex flex-col h-full w-80 border-l bg-card text-card-foreground">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <span className="font-semibold text-sm">Equipo</span>
          <div className="flex items-center gap-2">
            <select
              value={myStatus}
              onChange={(e) => void changeMyStatus(e.target.value as PresenceStatus)}
              className="text-xs rounded border border-input bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cerrar panel de equipo"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body: member list or chat */}
        {!activeConvId ? (
          <div className="flex-1 overflow-y-auto py-2">
            {members.length === 0 && (
              <p className="text-xs text-muted-foreground px-4 py-6 text-center">Cargando compañeros…</p>
            )}
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
              >
                <Avatar id={m.id} name={m.name} email={m.email} status={m.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {m.name ?? m.email}
                    {m.isMe && <span className="ml-1 text-xs text-muted-foreground">(Tú)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{PRESENCE_LABEL[m.status]}</p>
                </div>
                {!m.isMe && (
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Chat */}
                    <button
                      onClick={() => void openConversation(m)}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Chat"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                    {/* Audio call */}
                    <button
                      onClick={() => void startCall(m, 'audio')}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Llamada de audio"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3-8.63A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </button>
                    {/* Video call */}
                    <button
                      onClick={() => void startCall(m, 'video')}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Videollamada"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Chat view */
          <>
            {/* Chat header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0">
              <button
                onClick={() => { setActiveConvId(null); setActivePeer(null); setMessages([]) }}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
              </button>
              {activePeer && (
                <Avatar id={activePeer.id} name={activePeer.name} email={activePeer.email} status={activePeer.status} size="sm" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activePeer?.name ?? activePeer?.email}</p>
                {activePeer && <p className="text-[10px] text-muted-foreground">{PRESENCE_LABEL[activePeer.status]}</p>}
              </div>
              {activePeer && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => activePeer && void startCall(activePeer, 'audio')}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Llamada de audio"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3-8.63A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => activePeer && void startCall(activePeer, 'video')}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Videollamada"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Sin mensajes. ¡Sé el primero en escribir!
                </p>
              )}
              {messages.map((msg) => {
                const isMe = msg.senderId === myId
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted text-foreground rounded-bl-sm'
                      }`}
                    >
                      <p className="break-words">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 border-t px-3 py-2 flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void sendMessage()
                  }
                }}
                placeholder="Mensaje… (Enter para enviar)"
                rows={1}
                className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                style={{ minHeight: '36px', maxHeight: '120px' }}
              />
              <button
                onClick={() => void sendMessage()}
                disabled={!draft.trim() || sending}
                className="shrink-0 p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
