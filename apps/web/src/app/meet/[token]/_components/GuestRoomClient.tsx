'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface RoomInfo {
  token: string
  label: string | null
  expiresAt: string
  hostUserId: string
}

interface GuestEvent {
  id: string
  type: string
  payload: Record<string, unknown>
  createdAt: string
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

export function GuestRoomClient({ token }: { token: string }) {
  const [room, setRoom] = useState<RoomInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guestName, setGuestName] = useState('')
  const [nameConfirmed, setNameConfirmed] = useState(false)
  const [callState, setCallState] = useState<'idle' | 'waiting' | 'calling' | 'connected'>('idle')
  const [callMode, setCallMode] = useState<'audio' | 'video'>('video')

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([])
  const lastEventTime = useRef(new Date().toISOString())
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
      void remoteVideoRef.current.play().catch(() => {})
    }
  }, [remoteStream, callState])

  // Load room info
  useEffect(() => {
    fetch(`/api/guest/room?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then((data: { room?: RoomInfo; error?: string }) => {
        if (data.error) { setError(data.error); return }
        setRoom(data.room ?? null)
      })
      .catch(() => setError('No se pudo cargar la sala.'))
  }, [token])

  // Fetch ICE servers
  const fetchIceServers = useCallback(async (): Promise<RTCIceServer[]> => {
    try {
      const r = await fetch(`/api/guest/ice-servers?token=${encodeURIComponent(token)}`)
      if (!r.ok) return ICE_SERVERS
      const data = await r.json() as { iceServers: RTCIceServer[] }
      return data.iceServers ?? ICE_SERVERS
    } catch {
      return ICE_SERVERS
    }
  }, [token])

  // Signal to host
  async function signal(type: 'guest_offer' | 'guest_answer' | 'guest_ice' | 'guest_hangup', payload: Record<string, unknown>) {
    if (!room) return
    await fetch('/api/guest/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, targetUserId: room.hostUserId, senderName: guestName, type, payload }),
    })
  }

  async function drainIceCandidates() {
    if (!pcRef.current) return
    const queue = iceCandidateQueueRef.current.splice(0)
    for (const c of queue) {
      try { await pcRef.current.addIceCandidate(c) } catch { /* ignore */ }
    }
  }

  function createPeerConnection(iceServers: RTCIceServer[]) {
    const pc = new RTCPeerConnection({ iceServers })
    pc.onicecandidate = e => {
      if (e.candidate) void signal('guest_ice', { candidate: e.candidate.toJSON() })
    }
    pc.ontrack = e => {
      if (e.streams[0]) setRemoteStream(e.streams[0])
    }
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setCallState('connected')
      if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) endCall()
    }
    pcRef.current = pc
    return pc
  }

  async function startCall(mode: 'audio' | 'video') {
    if (!room || callState !== 'idle') return
    setCallMode(mode)
    setCallState('waiting')

    const iceServers = await fetchIceServers()
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

    const pc = createPeerConnection(iceServers)
    if (stream) stream.getTracks().forEach(t => pc.addTrack(t, stream!))
    else {
      pc.addTransceiver('audio', { direction: 'recvonly' })
      if (mode === 'video') pc.addTransceiver('video', { direction: 'recvonly' })
    }
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await signal('guest_offer', { offer, mode })
    setCallState('calling')
  }

  // Poll host events (host_answer, host_ice, host_hangup)
  const pollEvents = useCallback(async () => {
    if (!nameConfirmed) return
    try {
      const r = await fetch(`/api/guest/events?token=${encodeURIComponent(token)}&since=${encodeURIComponent(lastEventTime.current)}`)
      if (!r.ok) return
      const data = await r.json() as { events: GuestEvent[]; serverTime: string }
      lastEventTime.current = data.serverTime
      for (const ev of data.events) {
        const p = ev.payload as Record<string, unknown>
        if (ev.type === 'host_answer' && pcRef.current) {
          await pcRef.current.setRemoteDescription(p['answer'] as RTCSessionDescriptionInit)
          await drainIceCandidates()
          setCallState('connected')
        } else if (ev.type === 'host_ice') {
          const candidate = p['candidate'] as RTCIceCandidateInit
          if (pcRef.current?.remoteDescription) {
            try { await pcRef.current.addIceCandidate(candidate) } catch { /* ignore */ }
          } else {
            iceCandidateQueueRef.current.push(candidate)
          }
        } else if (ev.type === 'host_hangup') {
          endCall()
        } else if (ev.type === 'host_offer') {
          // Host initiated — guest answers
          await handleHostOffer(p['offer'] as RTCSessionDescriptionInit, p['mode'] as 'audio' | 'video')
        }
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, nameConfirmed, callState])

  useEffect(() => {
    const interval = setInterval(pollEvents, 1500)
    return () => clearInterval(interval)
  }, [pollEvents])

  async function handleHostOffer(offer: RTCSessionDescriptionInit, mode: 'audio' | 'video') {
    if (callState !== 'idle') return
    setCallMode(mode)
    const iceServers = await fetchIceServers()
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
    const pc = createPeerConnection(iceServers)
    if (stream) stream.getTracks().forEach(t => pc.addTrack(t, stream!))
    await pc.setRemoteDescription(offer)
    await drainIceCandidates()
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await signal('guest_answer', { answer })
    setCallState('connected')
  }

  function endCall() {
    void signal('guest_hangup', {})
    pcRef.current?.close()
    pcRef.current = null
    iceCandidateQueueRef.current = []
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = null
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    setRemoteStream(null)
    setCallState('idle')
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-white text-lg font-medium mb-2">Sala no disponible</p>
          <p className="text-zinc-400 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!nameConfirmed) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
              </svg>
            </div>
            <h1 className="text-white text-xl font-bold">{room.label ?? 'Sala de reunión'}</h1>
            <p className="text-zinc-400 text-sm mt-1">Powered by MITIKUS</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <label className="block text-sm text-zinc-300 mb-2">Tu nombre</label>
            <input
              type="text"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && guestName.trim()) setNameConfirmed(true) }}
              placeholder="Introduce tu nombre…"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-zinc-500"
              autoFocus
            />
            <button
              onClick={() => { if (guestName.trim()) setNameConfirmed(true) }}
              disabled={!guestName.trim()}
              className="mt-4 w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-medium text-sm transition-colors"
            >
              Entrar a la sala
            </button>
          </div>
          <p className="text-zinc-600 text-xs text-center mt-4">
            Expira {new Date(room.expiresAt).toLocaleString('es-ES')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 gap-4">
      {/* Remote video */}
      <div className="relative w-full max-w-2xl aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        {callState !== 'connected' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-2xl font-bold text-white">
              {room.label?.[0]?.toUpperCase() ?? 'M'}
            </div>
            <p className="text-zinc-300 text-sm">
              {callState === 'idle' ? 'Elige cómo conectarte' : callState === 'waiting' ? 'Iniciando…' : 'Llamando… esperando al anfitrión'}
            </p>
            {callState === 'calling' && (
              <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        )}
        {/* Local video PiP */}
        {callMode === 'video' && (callState === 'calling' || callState === 'connected') && (
          <video ref={localVideoRef} autoPlay playsInline muted
            className="absolute bottom-3 right-3 w-28 h-20 rounded-lg object-cover bg-zinc-800 border border-zinc-700" />
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {callState === 'idle' && (
          <>
            <button
              onClick={() => void startCall('audio')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium text-sm transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3-8.63A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Solo audio
            </button>
            <button
              onClick={() => void startCall('video')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
              </svg>
              Videollamada
            </button>
          </>
        )}
        {(callState === 'calling' || callState === 'connected' || callState === 'waiting') && (
          <button
            onClick={endCall}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.73 19.73 0 0 1 4.69 12 2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.69"/>
              <line x1="23" y1="1" x2="1" y2="23"/>
            </svg>
            Colgar
          </button>
        )}
      </div>

      <p className="text-zinc-600 text-xs">{room.label ?? 'Sala de reunión'} · {guestName}</p>
    </div>
  )
}
