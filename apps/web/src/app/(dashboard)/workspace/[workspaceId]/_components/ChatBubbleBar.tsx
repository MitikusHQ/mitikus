'use client'

import React, { useState, useEffect, useRef } from 'react'

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

// ─── WebRTC call overlay ──────────────────────────────────────────────────────

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  // OpenRelay free TURN — UDP + TCP + TLS variants for maximum NAT penetration
  { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:80?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turns:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turns:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
]


interface WebRTCCall {
  peer: { id: string; name: string | null }
  mode: 'audio' | 'video'
  incoming: boolean
  offer?: RTCSessionDescriptionInit
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

// Classic double-ring pattern for incoming calls
function playRing(ctx: AudioContext, stopped: { current: boolean }) {
  function tone(freq: number, start: number, dur: number, vol = 0.22) {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.connect(g); g.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = freq
    g.gain.setValueAtTime(0, ctx.currentTime + start)
    g.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.02)
    g.gain.setValueAtTime(vol, ctx.currentTime + start + dur - 0.03)
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur)
    osc.start(ctx.currentTime + start)
    osc.stop(ctx.currentTime + start + dur)
  }
  function ring() {
    if (stopped.current) return
    tone(480, 0, 0.4); tone(620, 0, 0.4)
    tone(480, 0.5, 0.4); tone(620, 0.5, 0.4)
    setTimeout(() => { if (!stopped.current) ring() }, 3000)
  }
  ring()
}

// Slow beeping ringback tone for the caller while waiting
function playRingback(ctx: AudioContext, stopped: { current: boolean }) {
  function beep() {
    if (stopped.current) return
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.connect(g); g.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 440
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02)
    g.gain.setValueAtTime(0.15, ctx.currentTime + 1.0)
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.1)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 1.2)
    setTimeout(() => { if (!stopped.current) beep() }, 3500)
  }
  beep()
}

// ─── WebRTC call overlay ───────────────────────────────────────────────────────

type SignalHandler = (type: string, payload: Record<string, unknown>) => void

function CallOverlay({ call, onSignal, onRegisterHandler, onHangup, sharedAudioCtx }: {
  call: WebRTCCall
  onSignal: (type: string, payload: Record<string, unknown>) => Promise<void>
  onRegisterHandler: (handler: SignalHandler) => void
  onHangup: () => void
  sharedAudioCtx: React.MutableRefObject<AudioContext | null>
}) {
  const [accepted, setAccepted] = useState(!call.incoming)
  const [status, setStatus] = useState<'ringing' | 'connecting' | 'connected' | 'failed'>(
    call.incoming ? 'ringing' : 'connecting'
  )
  const [iceState, setIceState] = useState<string>('new')
  const [sigLog, setSigLog] = useState<string[]>([])
  const [muted, setMuted] = useState(false)
  const [videoOff, setVideoOff] = useState(false)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const pendingIce = useRef<RTCIceCandidateInit[]>([])
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toneStoppedRef = useRef(true)

  function addLog(msg: string) {
    const ts = new Date().toISOString().slice(11, 19)
    setSigLog(prev => [...prev.slice(-4), `${ts} ${msg}`])
    console.log(`[MITIKUS-CALL] ${msg}`)
  }

  function stopTone() {
    toneStoppedRef.current = true
  }

  function cleanup() {
    stopTone()
    if (connectTimeoutRef.current) { clearTimeout(connectTimeoutRef.current); connectTimeoutRef.current = null }
    pcRef.current?.close()
    pcRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  // Ring / ringback tones using sharedAudioCtx (already initialized by parent)
  useEffect(() => {
    const playTone = async () => {
      let ctx = sharedAudioCtx.current
      if (!ctx) { ctx = createAudioCtx(); sharedAudioCtx.current = ctx }
      if (!ctx) return
      try { if (ctx.state === 'suspended') await ctx.resume() } catch { return }
      toneStoppedRef.current = false
      if (status === 'ringing') {
        playRing(ctx, toneStoppedRef)
      } else if (!call.incoming && status === 'connecting') {
        playRingback(ctx, toneStoppedRef)
      }
    }
    if (status === 'ringing' || (!call.incoming && status === 'connecting')) {
      void playTone()
    } else {
      stopTone()
    }
    return stopTone
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  function hangup() {
    cleanup()
    void onSignal('call_hangup', {})
    onHangup()
  }

  function buildPC(): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    pcRef.current = pc

    // Trickle ICE: send candidates as they arrive
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        addLog(`cand: ${candidate.type}/${candidate.protocol}`)
        void onSignal('call_ice', { candidate: candidate.toJSON() })
      }
    }
    pc.onicegatheringstatechange = () => {
      addLog(`gather: ${pc.iceGatheringState}`)
    }
    pc.oniceconnectionstatechange = () => {
      setIceState(pc.iceConnectionState)
      addLog(`ice: ${pc.iceConnectionState}`)
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        stopTone(); setStatus('connected')
      }
      if (pc.iceConnectionState === 'failed') setStatus('failed')
    }
    pc.onconnectionstatechange = () => {
      addLog(`conn: ${pc.connectionState}`)
      if (pc.connectionState === 'connected') { stopTone(); setStatus('connected') }
      if (pc.connectionState === 'failed') { cleanup(); onHangup() }
    }
    pc.ontrack = ev => {
      const stream = ev.streams[0] ?? new MediaStream([ev.track])
      if (remoteVideoRef.current) { remoteVideoRef.current.srcObject = stream; void remoteVideoRef.current.play().catch(() => {}) }
      if (remoteAudioRef.current) { remoteAudioRef.current.srcObject = stream; void remoteAudioRef.current.play().catch(() => {}) }
      addLog(`track: ${ev.track.kind}`)
      // Do NOT setStatus('connected') here — ontrack fires when SDP is parsed,
      // before ICE connects. Wait for oniceconnectionstatechange.
    }
    // Timeout: only mark failed if ICE was actually checking.
    // If ice === 'new', the remote description hasn't been set yet (callee still answering)
    // — don't show ❌, let the call stay in 'connecting' until ICE truly fails.
    connectTimeoutRef.current = setTimeout(() => {
      if (!pcRef.current) return
      const ice = pcRef.current.iceConnectionState
      addLog(`timeout — ice: ${ice}`)
      if (ice !== 'new' && ice !== 'connected' && ice !== 'completed') {
        setStatus('failed')
      }
    }, 60000)
    return pc
  }

  // Register signal handler — handles call_answer, call_ice, call_hangup
  useEffect(() => {
    onRegisterHandler(async (type, payload) => {
      addLog(`rcv: ${type}`)
      const pc = pcRef.current
      if (type === 'call_answer') {
        if (!pc) { addLog('ERR: pc null on answer'); return }
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload['answer'] as RTCSessionDescriptionInit))
          addLog(`setRemote OK — flush ${pendingIce.current.length} queued`)
          // Flush ICE candidates that arrived before setRemoteDescription
          for (const cand of pendingIce.current.splice(0)) {
            await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {})
          }
        } catch (e) {
          addLog(`setRemote ERR: ${e instanceof Error ? e.message : String(e)}`)
        }
      }
      if (type === 'call_ice') {
        const cand = payload['candidate'] as RTCIceCandidateInit
        // Buffer if pc is not built yet (null) OR remote description not set.
        // This handles the race where call_ice arrives before answer() builds the PC.
        if (pc?.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {})
        } else {
          pendingIce.current.push(cand)
        }
      }
      if (type === 'call_hangup' || type === 'call_reject') {
        cleanup(); onHangup()
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Outgoing: create offer immediately (trickle ICE — no wait for gathering)
  useEffect(() => {
    if (call.incoming) return
    async function start() {
      try {
        const pc = buildPC()
        addLog('start: getUserMedia')
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: call.mode === 'video' })
        streamRef.current = stream
        stream.getTracks().forEach(t => pc.addTrack(t, stream))
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        addLog('sending offer')
        // Send offer immediately — ICE candidates flow via call_ice (trickle)
        await onSignal('call_offer', { offer: pc.localDescription, mode: call.mode })
        addLog('offer sent')
      } catch (e) {
        addLog(`start ERR: ${e instanceof Error ? e.message : String(e)}`)
        setStatus('failed')
      }
    }
    void start()
    return cleanup
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Incoming: create answer when accepted
  useEffect(() => {
    if (!call.incoming || !accepted) return
    async function answer() {
      try {
        setStatus('connecting')
        const pc = buildPC()
        addLog('answer: getUserMedia')
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: call.mode === 'video' })
        streamRef.current = stream
        stream.getTracks().forEach(t => pc.addTrack(t, stream))
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
        addLog('setRemoteDesc (offer)')
        await pc.setRemoteDescription(new RTCSessionDescription(call.offer!))
        const ans = await pc.createAnswer()
        await pc.setLocalDescription(ans)
        // Flush any ICE candidates that arrived before setRemoteDescription
        addLog(`flush ${pendingIce.current.length} queued cands`)
        for (const cand of pendingIce.current.splice(0)) {
          await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {})
        }
        addLog('sending answer')
        await onSignal('call_answer', { answer: pc.localDescription })
        addLog('answer sent')
      } catch (e) {
        addLog(`answer ERR: ${e instanceof Error ? e.message : String(e)}`)
        setStatus('failed')
      }
    }
    void answer()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accepted])

  if (!accepted) {
    return (
      <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center">
        <div className="bg-card rounded-2xl p-8 flex flex-col items-center gap-6 shadow-2xl">
          <span className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white ${avatarColor(call.peer.id)}`}>
            {initials(call.peer.name, call.peer.id)}
          </span>
          <div className="text-center">
            <p className="text-lg font-semibold">{call.peer.name ?? call.peer.id}</p>
            <p className="text-sm text-muted-foreground mt-1 animate-pulse">
              {call.mode === 'video' ? 'Videollamada entrante' : 'Llamada de voz entrante'}
            </p>
          </div>
          <div className="flex gap-6">
            <button onClick={hangup}
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

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 shrink-0">
        <div className="flex items-center gap-3">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${avatarColor(call.peer.id)}`}>
            {initials(call.peer.name, call.peer.id)}
          </span>
          <div>
            <p className="text-white text-sm font-medium">{call.peer.name ?? call.peer.id}</p>
            <p className="text-zinc-400 text-xs">
              {status === 'connecting' ? `Conectando… [${iceState}]` : status === 'connected' ? 'En llamada' : status === 'failed' ? '❌ Sin conexión' : 'Llamando…'}
            </p>
            {sigLog.length > 0 && (
              <div className="text-zinc-600 text-[9px] leading-tight max-w-[220px]">
                {sigLog.map((l, i) => <div key={i}>{l}</div>)}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => {
            streamRef.current?.getAudioTracks().forEach(t => { t.enabled = muted })
            setMuted(m => !m)
          }}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors ${muted ? 'bg-red-600' : 'bg-zinc-700 hover:bg-zinc-600'} text-white`}
            title={muted ? 'Activar micro' : 'Silenciar'}>
            {muted ? '🔇' : '🎤'}
          </button>
          {call.mode === 'video' && (
            <button onClick={() => {
              streamRef.current?.getVideoTracks().forEach(t => { t.enabled = videoOff })
              setVideoOff(v => !v)
            }}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors ${videoOff ? 'bg-red-600' : 'bg-zinc-700 hover:bg-zinc-600'} text-white`}
              title={videoOff ? 'Activar cámara' : 'Apagar cámara'}>
              {videoOff ? '📷' : '📹'}
            </button>
          )}
          <button onClick={hangup}
            className="px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-sm font-medium">
            Colgar
          </button>
        </div>
      </div>

      {call.mode === 'video' ? (
        <div className="flex-1 relative bg-zinc-950">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <video ref={localVideoRef} autoPlay playsInline muted
            className="absolute bottom-4 right-4 w-36 h-24 rounded-xl object-cover border-2 border-zinc-700 bg-zinc-800" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-zinc-950">
          <span className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white ${avatarColor(call.peer.id)}`}>
            {initials(call.peer.name, call.peer.id)}
          </span>
          <p className="text-zinc-400 text-sm">
            {status === 'connecting' ? `Conectando… [${iceState}]` : status === 'connected' ? 'En llamada de voz' : status === 'failed' ? '❌ Sin conexión' : 'Llamando…'}
          </p>
          <audio ref={remoteAudioRef} autoPlay />
        </div>
      )}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ChatBubbleBar({ myId }: { myId: string }) {
  const [members, setMembers] = useState<Member[]>([])
  const [chats, setChats] = useState<ChatWindow[]>([])
  const [webrtcCall, setWebrtcCall] = useState<WebRTCCall | null>(null)
  const lastEventTime = useRef(new Date().toISOString())
  const audioCtxRef = useRef<AudioContext | null>(null)
  const msgEndRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const openingRef = useRef<Set<string>>(new Set())
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const callSignalHandlerRef = useRef<SignalHandler | null>(null)
  // Queue for signals that arrive before the handler is registered
  const callSignalQueueRef = useRef<Array<{ type: string; payload: Record<string, unknown> }>>([])
  const inCallRef = useRef(false)

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
          // WebRTC signaling
          if (ev.type === 'call_offer') {
            const { offer, fromUserId, fromUserName, mode } = ev.payload as {
              offer: RTCSessionDescriptionInit; fromUserId: string; fromUserName: string | null; mode: 'audio' | 'video'
            }
            inCallRef.current = true
            callSignalQueueRef.current = []
            callSignalHandlerRef.current = null
            setWebrtcCall({ peer: { id: fromUserId, name: fromUserName }, mode, incoming: true, offer })
            continue
          }
          if (ev.type === 'call_answer' || ev.type === 'call_ice' || ev.type === 'call_hangup' || ev.type === 'call_reject') {
            const ts = new Date().toISOString().slice(11, 19)
            const hasHandler = !!callSignalHandlerRef.current
            console.log(`[MITIKUS-POLL] ${ts} ev=${ev.type} handler=${hasHandler} inCall=${inCallRef.current}`)
            if (callSignalHandlerRef.current) {
              void callSignalHandlerRef.current(ev.type, ev.payload)
            } else if (ev.type === 'call_answer' || ev.type === 'call_ice') {
              // Handler not ready yet — queue and replay when it registers
              callSignalQueueRef.current.push({ type: ev.type, payload: ev.payload })
              console.log(`[MITIKUS-POLL] ${ts} queued ${ev.type} (queue len: ${callSignalQueueRef.current.length})`)
            }
            if (ev.type === 'call_hangup' || ev.type === 'call_reject') setWebrtcCall(null)
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
    let tid: ReturnType<typeof setTimeout>
    let active = true
    const schedule = () => {
      if (!active) return
      tid = setTimeout(async () => {
        await poll()
        schedule()
      }, inCallRef.current ? 500 : 2000)
    }
    schedule()
    return () => { active = false; clearTimeout(tid) }
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

  // ─── WebRTC call helpers ─────────────────────────────────────────────────────

  async function sendSignal(targetUserId: string, type: string, payload: Record<string, unknown> = {}) {
    await fetch('/api/team/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId, type, payload }),
    })
  }

  function startCall(peer: Member, mode: 'audio' | 'video') {
    inCallRef.current = true
    callSignalQueueRef.current = []
    callSignalHandlerRef.current = null
    setWebrtcCall({ peer: { id: peer.id, name: peer.name }, mode, incoming: false })
  }

  // Listen for call requests from ChatBubble buttons (mitikus:bubble-call)
  useEffect(() => {
    function onBubbleCall(e: Event) {
      const { peerId, mode } = (e as CustomEvent<{ peerId: string; mode: 'audio' | 'video' }>).detail
      const peer = members.find(m => m.id === peerId)
      if (peer) startCall(peer, mode)
    }
    window.addEventListener('mitikus:bubble-call', onBubbleCall)
    return () => window.removeEventListener('mitikus:bubble-call', onBubbleCall)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members])

  if (chats.length === 0 && !webrtcCall) return null

  return (
    <>
      {/* WebRTC call overlay */}
      {webrtcCall && (
        <CallOverlay
          call={webrtcCall}
          onSignal={(type, payload) => sendSignal(webrtcCall.peer.id, type, payload)}
          onRegisterHandler={handler => {
            callSignalHandlerRef.current = handler
            // Drain any signals that arrived before the handler was ready
            const queued = callSignalQueueRef.current.splice(0)
            for (const sig of queued) void handler(sig.type, sig.payload)
          }}
          onHangup={() => {
            inCallRef.current = false
            callSignalHandlerRef.current = null
            callSignalQueueRef.current = []
            setWebrtcCall(null)
          }}
          sharedAudioCtx={audioCtxRef}
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
                  onClick={() => startCall(chat.member, 'audio')}
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
                  onClick={() => startCall(chat.member, 'video')}
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
