'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Locale } from '@/i18n/config'

interface GuestRoom {
  id: string
  token: string
  label: string | null
  expiresAt: Date | string
  createdAt: Date | string
}

interface Props {
  workspaceId: string
  userId: string
  initialRooms: GuestRoom[]
  baseUrl: string
  locale: Locale
}

interface HostEvent {
  id: string
  type: string
  payload: Record<string, unknown>
  createdAt: string
}

interface IncomingCall {
  token: string
  senderName: string
  offer: RTCSessionDescriptionInit
  mode: 'audio' | 'video'
}

const STUN_FALLBACK: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'turn:a.relay.metered.ca:80',                username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:a.relay.metered.ca:80?transport=tcp',  username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:a.relay.metered.ca:443',               username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:a.relay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turns:a.relay.metered.ca:443',              username: 'openrelayproject', credential: 'openrelayproject' },
]

async function fetchIceServers(): Promise<RTCIceServer[]> {
  try {
    const r = await fetch('/api/ice-servers')
    if (r.ok) {
      const data = await r.json() as { iceServers: RTCIceServer[] }
      return data.iceServers
    }
  } catch { /* fall through */ }
  return STUN_FALLBACK
}

export function MeetingsClient({ workspaceId, userId, initialRooms, baseUrl }: Props) {
  const [rooms, setRooms] = useState<GuestRoom[]>(initialRooms)
  const [creating, setCreating] = useState(false)
  const [label, setLabel] = useState('')
  const [hours, setHours] = useState(24)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [sendModal, setSendModal] = useState<{ token: string; url: string } | null>(null)
  const [sendEmail, setSendEmail] = useState('')
  const [clientSuggestions, setClientSuggestions] = useState<{ id: string; name: string; email: string; contactName: string | null }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // ── Call state ────────────────────────────────────────────────
  const [incoming, setIncoming] = useState<IncomingCall | null>(null)
  const [callState, setCallState] = useState<'idle' | 'ringing' | 'connected'>('idle')
  const [activeToken, setActiveToken] = useState<string | null>(null)
  const [activeGuestName, setActiveGuestName] = useState<string>('')
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [pcState, setPcState] = useState<string>('—')
  const [iceState, setIceState] = useState<string>('—')
  const [gatherState, setGatherState] = useState<string>('—')
  const [iceSent, setIceSent] = useState(0)
  const [trackCount, setTrackCount] = useState(0)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([])
  const lastEventTime = useRef(new Date().toISOString())
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  function assignRemoteStream(s: MediaStream) {
    remoteStreamRef.current = s
    setRemoteStream(s)
    setTrackCount(s.getTracks().length)
    const el = remoteVideoRef.current
    if (el) { el.srcObject = s; void el.play().catch(() => {}) }
  }

  // Inline ref callback — runs on every render so it always has the current stream ref
  const remoteVideoCallback = (el: HTMLVideoElement | null) => {
    remoteVideoRef.current = el
    if (el && remoteStreamRef.current) {
      el.srcObject = remoteStreamRef.current
      void el.play().catch(() => {})
    }
  }

  // ── Host signal helper ────────────────────────────────────────
  async function hostSignal(token: string, type: string, payload: Record<string, unknown>) {
    await fetch('/api/guest/host-signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, type, payload }),
    })
  }

  // ── Poll host events ──────────────────────────────────────────
  const pollHostEvents = useCallback(async () => {
    try {
      const r = await fetch(`/api/guest/host-events?since=${encodeURIComponent(lastEventTime.current)}`)
      if (!r.ok) return
      const data = await r.json() as { events: HostEvent[]; serverTime: string }
      lastEventTime.current = data.serverTime

      for (const ev of data.events) {
        const p = ev.payload as Record<string, unknown>

        if (ev.type === 'guest_offer' && callState === 'idle') {
          setIncoming({
            token: (p['guestToken'] ?? p['token']) as string,
            senderName: (p['fromUserName'] ?? p['senderName'] ?? 'Invitado') as string,
            offer: p['offer'] as RTCSessionDescriptionInit,
            mode: (p['mode'] as 'audio' | 'video') ?? 'video',
          })
          setCallState('ringing')
        } else if (ev.type === 'guest_answer' && pcRef.current) {
          await pcRef.current.setRemoteDescription(p['answer'] as RTCSessionDescriptionInit)
          const queue = iceCandidateQueueRef.current.splice(0)
          for (const c of queue) {
            try { await pcRef.current.addIceCandidate(c) } catch { /* ignore */ }
          }
        } else if (ev.type === 'guest_ice') {
          const candidate = p['candidate'] as RTCIceCandidateInit
          if (pcRef.current?.remoteDescription) {
            try { await pcRef.current.addIceCandidate(candidate) } catch { /* ignore */ }
          } else {
            // Queue even if PC not created yet (getUserMedia is async)
            iceCandidateQueueRef.current.push(candidate)
          }
        } else if (ev.type === 'guest_hangup') {
          hangUp()
        }
      }
    } catch { /* ignore */ }
  }, [callState])

  useEffect(() => {
    const interval = setInterval(pollHostEvents, 1500)
    return () => clearInterval(interval)
  }, [pollHostEvents])

  // ── Accept call ───────────────────────────────────────────────
  async function acceptCall() {
    if (!incoming) return
    const { token, senderName, offer, mode } = incoming
    setActiveToken(token)
    setActiveGuestName(senderName)
    setIncoming(null)
    setCallState('connected')

    let stream: MediaStream | null = null
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === 'video' })
    } catch {
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }) } catch { /* no mic */ }
    }
    if (stream) {
      localStreamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
    }

    const iceServers = await fetchIceServers()
    const pc = new RTCPeerConnection({ iceServers })
    pc.onicecandidate = e => {
      if (e.candidate) { setIceSent(n => n + 1); void hostSignal(token, 'host_ice', { candidate: e.candidate.toJSON() }) }
    }
    pc.ontrack = e => {
      const s = e.streams[0] ?? new MediaStream([e.track])
      assignRemoteStream(s)
    }
    pc.onconnectionstatechange = () => { setPcState(pc.connectionState); if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) hangUp() }
    pc.oniceconnectionstatechange = () => { setIceState(pc.iceConnectionState) }
    pc.onicegatheringstatechange = () => { setGatherState(pc.iceGatheringState) }
    pcRef.current = pc

    if (stream) stream.getTracks().forEach(t => pc.addTrack(t, stream!))
    await pc.setRemoteDescription(offer)

    // drain queued ICE candidates
    const queue = iceCandidateQueueRef.current.splice(0)
    for (const c of queue) {
      try { await pc.addIceCandidate(c) } catch { /* ignore */ }
    }

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await hostSignal(token, 'host_answer', { answer })
  }

  // ── Host initiates call ───────────────────────────────────────
  async function callGuest(token: string, roomLabel: string | null, mode: 'audio' | 'video' = 'video') {
    if (callState !== 'idle') return
    setActiveToken(token)
    setActiveGuestName(roomLabel ?? 'Invitado')
    setCallState('connected')

    let stream: MediaStream | null = null
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === 'video' })
    } catch {
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }) } catch { /* no mic */ }
    }
    if (stream) {
      localStreamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
    }

    const iceServers = await fetchIceServers()
    const pc = new RTCPeerConnection({ iceServers })
    pc.onicecandidate = e => {
      if (e.candidate) { setIceSent(n => n + 1); void hostSignal(token, 'host_ice', { candidate: e.candidate.toJSON() }) }
    }
    pc.ontrack = e => {
      const s = e.streams[0] ?? new MediaStream([e.track])
      assignRemoteStream(s)
    }
    pc.onconnectionstatechange = () => { setPcState(pc.connectionState); if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) hangUp() }
    pc.oniceconnectionstatechange = () => { setIceState(pc.iceConnectionState) }
    pc.onicegatheringstatechange = () => { setGatherState(pc.iceGatheringState) }
    pcRef.current = pc

    if (stream) stream.getTracks().forEach(t => pc.addTrack(t, stream!))
    else {
      pc.addTransceiver('audio', { direction: 'recvonly' })
      pc.addTransceiver('video', { direction: 'recvonly' })
    }

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await hostSignal(token, 'host_offer', { offer, mode })
  }

  // ── Reject / hang up ──────────────────────────────────────────
  async function rejectCall() {
    if (incoming) await hostSignal(incoming.token, 'host_hangup', {})
    setIncoming(null)
    setCallState('idle')
  }

  function hangUp() {
    if (activeToken) void hostSignal(activeToken, 'host_hangup', {})
    pcRef.current?.close()
    pcRef.current = null
    iceCandidateQueueRef.current = []
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = null
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    setRemoteStream(null)
    setCallState('idle')
    setActiveToken(null)
    setActiveGuestName('')
  }

  // ── Room management ───────────────────────────────────────────
  async function createRoom() {
    if (creating) return
    setCreating(true)
    try {
      const r = await fetch(`/api/workspace/${workspaceId}/guest-rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim() || null, expiresInHours: hours }),
      })
      const data = await r.json() as { room: GuestRoom }
      setRooms(prev => [data.room, ...prev])
      setLabel('')
    } finally {
      setCreating(false)
    }
  }

  async function revokeRoom(token: string) {
    await fetch(`/api/workspace/${workspaceId}/guest-rooms?token=${encodeURIComponent(token)}`, { method: 'DELETE' })
    setRooms(prev => prev.filter(r => r.token !== token))
  }

  async function copyLink(token: string) {
    await navigator.clipboard.writeText(`${baseUrl}/meet/${token}`)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  function openSendModal(token: string) {
    setSendEmail('')
    setClientSuggestions([])
    setShowSuggestions(false)
    setSendModal({ token, url: `${baseUrl}/meet/${token}` })
  }

  async function searchClients(q: string) {
    setSendEmail(q)
    if (q.length < 1) { setClientSuggestions([]); setShowSuggestions(false); return }
    try {
      const r = await fetch(`/api/workspace/${workspaceId}/clients-search?q=${encodeURIComponent(q)}`)
      if (r.ok) {
        const data = await r.json() as { clients: { id: string; name: string; email: string; contactName: string | null }[] }
        setClientSuggestions(data.clients)
        setShowSuggestions(data.clients.length > 0)
      }
    } catch { /* ignore */ }
  }

  function sendViaEmail() {
    if (!sendModal || !sendEmail.trim()) return
    const subject = encodeURIComponent('Enlace para nuestra videollamada')
    const body = encodeURIComponent(`Hola,\n\nTe comparto el enlace para unirte a nuestra reunión:\n\n${sendModal.url}\n\nNo necesitas crear ninguna cuenta.\n\nHasta pronto.`)
    window.open(`mailto:${sendEmail.trim()}?subject=${subject}&body=${body}`)
    setSendModal(null)
  }

  // ── Render ────────────────────────────────────────────────────

  // Active call screen
  if (callState === 'connected') {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-zinc-400 text-sm">Conectado con <span className="text-white font-medium">{activeGuestName}</span></p>

        <div className="relative w-full max-w-2xl aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
          <video ref={remoteVideoCallback} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* placeholder while video loads */}
          </div>
          {/* PiP local */}
          <video ref={localVideoRef} autoPlay playsInline muted
            className="absolute bottom-3 right-3 w-28 h-20 rounded-lg object-cover bg-zinc-800 border border-zinc-700" />
        </div>


        <button
          onClick={hangUp}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.73 19.73 0 0 1-6.91-6.91 2 2 0 0 1 .48-2.34"/>
            <line x1="23" y1="1" x2="1" y2="23"/>
          </svg>
          Colgar
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Incoming call banner */}
      {callState === 'ringing' && incoming && (
        <div className="rounded-xl border border-violet-500 bg-violet-500/10 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                {incoming.senderName[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{incoming.senderName} está llamando</p>
                <p className="text-xs text-zinc-400">{incoming.mode === 'video' ? 'Videollamada' : 'Solo audio'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => void acceptCall()}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors"
              >
                Aceptar
              </button>
              <button
                onClick={() => void rejectCall()}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-xl font-semibold">Salas de reunión</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Genera un enlace temporal para que tus clientes se unan a una llamada o videollamada sin necesidad de cuenta.
        </p>
      </div>

      {/* Create room */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Nueva sala</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Nombre descriptivo (opcional)"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
          <select
            value={hours}
            onChange={e => setHours(Number(e.target.value))}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value={1}>1 hora</option>
            <option value={6}>6 horas</option>
            <option value={24}>24 horas</option>
            <option value={72}>3 días</option>
            <option value={168}>1 semana</option>
          </select>
          <button
            onClick={createRoom}
            disabled={creating}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {creating ? 'Creando…' : 'Crear sala'}
          </button>
        </div>
      </div>

      {/* Room list */}
      {rooms.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No hay salas activas.</p>
      ) : (
        <div className="space-y-3">
          {rooms.map(room => (
            <div key={room.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{room.label ?? 'Sala sin nombre'}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground font-mono break-all">
                    {baseUrl}/meet/{room.token}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground" suppressHydrationWarning>
                    Expira {new Date(room.expiresAt).toLocaleString('es-ES')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => void callGuest(room.token, room.label, 'audio')}
                    disabled={callState !== 'idle'}
                    className="rounded-md bg-green-600 hover:bg-green-500 disabled:opacity-40 px-3 py-1.5 text-xs font-medium text-white"
                  >
                    Llamar
                  </button>
                  <button
                    onClick={() => void callGuest(room.token, room.label, 'video')}
                    disabled={callState !== 'idle'}
                    className="rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-3 py-1.5 text-xs font-medium text-white"
                  >
                    Vídeo
                  </button>
                  <button
                    onClick={() => void copyLink(room.token)}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {copiedToken === room.token ? '¡Copiado!' : 'Copiar enlace'}
                  </button>
                  <button
                    onClick={() => openSendModal(room.token)}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground"
                  >
                    Enviar
                  </button>
                  <button
                    onClick={() => void revokeRoom(room.token)}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive"
                  >
                    Revocar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Send link modal */}
    {sendModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSendModal(null)}>
        <div className="w-full max-w-sm bg-background border border-border rounded-2xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
          <h3 className="text-sm font-semibold mb-1">Enviar enlace por email</h3>
          <p className="text-xs text-muted-foreground mb-4 break-all">{sendModal.url}</p>

          <div className="relative">
            <input
              type="email"
              value={sendEmail}
              onChange={e => void searchClients(e.target.value)}
              onFocus={() => { if (clientSuggestions.length > 0) setShowSuggestions(true) }}
              placeholder="Email del destinatario…"
              autoFocus
              className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
            {showSuggestions && (
              <div className="absolute top-full mt-1 w-full bg-background border border-border rounded-xl shadow-lg overflow-hidden z-10">
                {clientSuggestions.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSendEmail(c.email); setShowSuggestions(false) }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex flex-col"
                  >
                    <span className="font-medium">{c.name}{c.contactName ? ` · ${c.contactName}` : ''}</span>
                    <span className="text-xs text-muted-foreground">{c.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setSendModal(null)}
              className="flex-1 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={sendViaEmail}
              disabled={!sendEmail.trim()}
              className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:bg-primary/90"
            >
              Abrir correo
            </button>
          </div>
        </div>
      </div>
    )}
  )
}
