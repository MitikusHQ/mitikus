'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'

// ─── Types ────────────────────────────────────────────────────────────────────

type PresenceStatus = 'OFFLINE' | 'AVAILABLE' | 'BUSY' | 'IN_MEETING'

interface Member {
  id: string
  name: string | null
  email: string
  avatarUrl: string | null
  jobTitle: string | null
  department: string | null
  isMe: boolean
  status: PresenceStatus
}

interface OrgMsg {
  id: string
  content: string
  createdAt: string
  sender: { id: string; name: string | null; email: string; avatarUrl: string | null }
}

interface TeamEvent {
  id: string
  type: string
  payload: Record<string, unknown>
  createdAt: string
}

type PendingCall = {
  fromUserId: string
  fromUserName: string | null
  offer: RTCSessionDescriptionInit
  mode: 'audio' | 'video'
  localStream?: MediaStream | null
}

interface Props {
  onClose: () => void
  myId: string
  locale: Locale
  pendingCall?: PendingCall | null
  onPendingCallHandled?: () => void
  bubbleCallRequest?: { peerId: string; mode: 'audio' | 'video' } | null
  onBubbleCallHandled?: () => void
}

// ─── ICE config ──────────────────────────────────────────────────────────────

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
]

// ─── Avatar helpers ───────────────────────────────────────────────────────────

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

function Avatar({ id, name, email, avatarUrl, status, size = 'md' }: {
  id: string; name: string | null; email: string; avatarUrl?: string | null
  status: PresenceStatus; size?: 'sm' | 'md'
}) {
  const sz = size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-9 h-9 text-sm'
  const dot = size === 'sm' ? 'w-2 h-2 border' : 'w-2.5 h-2.5 border'
  return (
    <span className="relative shrink-0 inline-block" title={PRESENCE_LABEL[status]}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name ?? email} className={`${sz} rounded-full object-cover`} />
      ) : (
        <span className={`${sz} ${avatarColor(id)} rounded-full flex items-center justify-center font-semibold text-white select-none`}>
          {initials(name, email)}
        </span>
      )}
      <span className={`absolute bottom-0 right-0 ${dot} ${PRESENCE_DOT[status]} rounded-full border-card`} />
    </span>
  )
}

// ─── Group call modal ─────────────────────────────────────────────────────────

interface GroupCallModalProps {
  members: Member[]
  myId: string
  onClose: () => void
  onCall: (selectedIds: string[], mode: 'audio' | 'video') => void
}

function GroupCallModal({ members, myId, onClose, onCall }: GroupCallModalProps) {
  const others = members.filter(m => !m.isMe)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set(['__all__']))

  // Group by department
  const groups = others.reduce<Record<string, Member[]>>((acc, m) => {
    const key = m.department ?? m.jobTitle ?? 'Sin departamento'
    ;(acc[key] ??= []).push(m)
    return acc
  }, {})
  const deptKeys = Object.keys(groups).sort()

  function toggleAll() {
    if (selected.size === others.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(others.map(m => m.id)))
    }
  }

  function toggleDept(dept: string) {
    const deptMembers = groups[dept] ?? []
    const allSelected = deptMembers.every(m => selected.has(m.id))
    setSelected(prev => {
      const next = new Set(prev)
      if (allSelected) {
        deptMembers.forEach(m => next.delete(m.id))
      } else {
        deptMembers.forEach(m => next.add(m.id))
      }
      return next
    })
  }

  function toggleMember(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleDeptExpand(dept: string) {
    setExpandedDepts(prev => {
      const next = new Set(prev)
      if (next.has(dept)) next.delete(dept); else next.add(dept)
      return next
    })
  }

  const allSelected = others.length > 0 && selected.size === others.length
  const someSelected = selected.size > 0 && selected.size < others.length

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-[360px] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <p className="text-sm font-bold text-foreground">Llamada grupal</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selected.size === 0 ? 'Selecciona participantes' : `${selected.size} participante${selected.size !== 1 ? 's' : ''} seleccionado${selected.size !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Select all */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border hover:bg-muted/30 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={allSelected}
              ref={el => { if (el) el.indeterminate = someSelected }}
              onChange={toggleAll}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-sm font-medium">Seleccionar todos ({others.length})</span>
          </label>
        </div>

        {/* Department groups */}
        <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-1.5">
          {deptKeys.map(dept => {
            const deptMembers = groups[dept] ?? []
            const deptAll = deptMembers.every(m => selected.has(m.id))
            const deptSome = deptMembers.some(m => selected.has(m.id)) && !deptAll
            const isExpanded = expandedDepts.has(dept)

            return (
              <div key={dept} className="rounded-xl border border-border overflow-hidden">
                {/* Dept header */}
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/20">
                  <input
                    type="checkbox"
                    checked={deptAll}
                    ref={el => { if (el) el.indeterminate = deptSome }}
                    onChange={() => toggleDept(dept)}
                    onClick={e => e.stopPropagation()}
                    className="w-3.5 h-3.5 rounded accent-primary shrink-0"
                  />
                  <button
                    type="button"
                    onClick={() => toggleDeptExpand(dept)}
                    className="flex-1 flex items-center justify-between text-left"
                  >
                    <span className="text-xs font-semibold text-foreground truncate">{dept}</span>
                    <span className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[10px] text-muted-foreground">{deptMembers.length}</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </span>
                  </button>
                </div>

                {/* Members */}
                {isExpanded && deptMembers.map(m => (
                  <label key={m.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/20 cursor-pointer transition-colors border-t border-border/50">
                    <input
                      type="checkbox"
                      checked={selected.has(m.id)}
                      onChange={() => toggleMember(m.id)}
                      className="w-3.5 h-3.5 rounded accent-primary shrink-0"
                    />
                    <Avatar id={m.id} name={m.name} email={m.email} avatarUrl={m.avatarUrl} status={m.status} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{m.name ?? m.email}</p>
                      {m.jobTitle && <p className="text-[10px] text-muted-foreground truncate">{m.jobTitle}</p>}
                    </div>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${PRESENCE_DOT[m.status]}`} />
                  </label>
                ))}
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-4 py-4 border-t border-border shrink-0">
          <button
            onClick={() => onCall([...selected], 'audio')}
            disabled={selected.size === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3-8.63A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            Llamada de voz
          </button>
          <button
            onClick={() => onCall([...selected], 'video')}
            disabled={selected.size === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground text-sm font-medium transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
            </svg>
            Videollamada
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TeamPanel({ onClose, myId, locale, pendingCall, onPendingCallHandled, bubbleCallRequest, onBubbleCallHandled }: Props) {
  const t = getDashboardTranslations(locale)
  const [members, setMembers] = useState<Member[]>([])
  const [myStatus, setMyStatus] = useState<PresenceStatus>('AVAILABLE')
  const [activeTab, setActiveTab] = useState<'general' | 'team'>('team')
  const [showGroupCall, setShowGroupCall] = useState(false)

  // General channel state
  const [orgMessages, setOrgMessages] = useState<OrgMsg[]>([])
  const [orgDraft, setOrgDraft] = useState('')
  const [orgSending, setOrgSending] = useState(false)
  const orgFeedRef = useRef<HTMLDivElement>(null)

  // Collapsed departments
  const [collapsedDepts, setCollapsedDepts] = useState<Set<string>>(new Set())

  // WebRTC call state
  const [callState, setCallState] = useState<'idle' | 'incoming' | 'calling' | 'connected'>('idle')
  const [callPeer, setCallPeer] = useState<{ id: string; name: string | null } | null>(null)
  const [callMode, setCallMode] = useState<'audio' | 'video'>('audio')
  const [incomingOffer, setIncomingOffer] = useState<RTCSessionDescriptionInit | null>(null)
  const [callError, setCallError] = useState<string | null>(null)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([])
  const lastEventTime = useRef(new Date().toISOString())

  function presenceLabel(status: PresenceStatus) {
    if (status === 'OFFLINE') return t.teamStatusOffline
    if (status === 'AVAILABLE') return t.teamStatusAvailable
    if (status === 'BUSY') return t.teamStatusBusy
    return t.teamStatusInMeeting
  }

  // ─── Stream assignment after DOM renders ──────────────────────────────────
  useEffect(() => {
    if (callState === 'idle') return
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current
    }
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current
      void remoteVideoRef.current.play().catch(() => {})
    }
  }, [callState, callMode])

  // ─── Start call from ChatBubbleBar ────────────────────────────────────────
  useEffect(() => {
    if (!bubbleCallRequest || members.length === 0) return
    const peer = members.find(m => m.id === bubbleCallRequest.peerId)
    if (!peer || peer.isMe) return
    onBubbleCallHandled?.()
    void startCall(peer, bubbleCallRequest.mode)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bubbleCallRequest, members])

  // ─── Accept incoming call from TeamEventWatcher ───────────────────────────
  useEffect(() => {
    if (!pendingCall) return
    onPendingCallHandled?.()
    setCallPeer({ id: pendingCall.fromUserId, name: pendingCall.fromUserName })
    setCallMode(pendingCall.mode)
    setIncomingOffer(pendingCall.offer)
    void acceptCallWith(pendingCall)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCall])

  // ─── Presence change sync ─────────────────────────────────────────────────
  useEffect(() => {
    function onPresenceChange(e: Event) {
      const ev = e as CustomEvent<{ status: PresenceStatus }>
      setMyStatus(ev.detail.status)
    }
    window.addEventListener('presenceChange', onPresenceChange)
    return () => window.removeEventListener('presenceChange', onPresenceChange)
  }, [])

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
    const res = await fetch(`/api/team/events?since=${encodeURIComponent(lastEventTime.current)}`)
    if (!res.ok) return
    const data = await res.json() as { events: TeamEvent[]; serverTime: string }
    lastEventTime.current = data.serverTime
    for (const ev of data.events) {
      await handleTeamEvent(ev)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callState])

  useEffect(() => {
    const interval = setInterval(pollEvents, 1000)
    return () => clearInterval(interval)
  }, [pollEvents])

  async function handleTeamEvent(ev: TeamEvent) {
    const p = ev.payload as Record<string, unknown>

    if (ev.type === 'call_answer' && pcRef.current) {
      await pcRef.current.setRemoteDescription(p['answer'] as RTCSessionDescriptionInit)
      await drainIceCandidates()
      return
    }
    if (ev.type === 'call_ice') {
      const candidate = p['candidate'] as RTCIceCandidateInit
      if (pcRef.current?.remoteDescription) {
        try { await pcRef.current.addIceCandidate(candidate) } catch { /* ignore */ }
      } else {
        iceCandidateQueueRef.current.push(candidate)
      }
      return
    }
    if (ev.type === 'call_hangup' || ev.type === 'call_reject') {
      endCall()
      return
    }
  }

  // ─── General channel ───────────────────────────────────────────────────────
  const loadOrgFeed = useCallback(async () => {
    const res = await fetch('/api/org/feed')
    if (!res.ok) return
    const data = await res.json() as { messages: OrgMsg[] }
    setOrgMessages(data.messages)
  }, [])

  useEffect(() => {
    if (activeTab !== 'general') return
    void loadOrgFeed()
    const interval = setInterval(loadOrgFeed, 10000)
    return () => clearInterval(interval)
  }, [activeTab, loadOrgFeed])

  async function sendOrgMessage() {
    if (!orgDraft.trim() || orgSending) return
    setOrgSending(true)
    const content = orgDraft.trim()
    setOrgDraft('')
    const res = await fetch('/api/org/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (res.ok) {
      const data = await res.json() as { message: OrgMsg }
      setOrgMessages(prev => [...prev, data.message])
      setTimeout(() => orgFeedRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
    setOrgSending(false)
  }

  // ─── WebRTC helpers ────────────────────────────────────────────────────────

  async function signal(targetUserId: string, type: string, payload: Record<string, unknown>) {
    await fetch('/api/team/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId, type, payload }),
    })
  }

  async function drainIceCandidates() {
    if (!pcRef.current) return
    const queue = iceCandidateQueueRef.current.splice(0)
    for (const candidate of queue) {
      try { await pcRef.current.addIceCandidate(candidate) } catch { /* ignore */ }
    }
  }

  function createPeerConnection(targetUserId: string) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    pc.onicecandidate = (e) => {
      if (e.candidate) void signal(targetUserId, 'call_ice', { candidate: e.candidate.toJSON() })
    }
    pc.ontrack = (e) => {
      console.log('[WebRTC] ontrack:', e.track.kind)
      if (e.streams[0]) {
        remoteStreamRef.current = e.streams[0]
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0]
          void remoteVideoRef.current.play().catch(() => {})
        }
      }
    }
    pc.oniceconnectionstatechange = () => console.log('[WebRTC] ICE:', pc.iceConnectionState)
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] connection:', pc.connectionState)
      if (pc.connectionState === 'connected') setCallState('connected')
      if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) endCall()
    }
    pcRef.current = pc
    return pc
  }

  async function startCall(peer: Member, mode: 'audio' | 'video') {
    if (callState !== 'idle') return
    setCallError(null)
    let stream: MediaStream | null = null
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === 'video' })
    } catch (err1) {
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }) } catch {
        try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false } }) } catch (err3) {
          setCallError(`Sin micrófono (${(err3 as DOMException).name}) — modo escucha`)
        }
      }
    }
    if (stream) localStreamRef.current = stream
    setCallPeer(peer)
    setCallMode(mode)
    setCallState('calling')
    const pc = createPeerConnection(peer.id)
    if (stream) {
      stream.getTracks().forEach(t => pc.addTrack(t, stream!))
    } else {
      pc.addTransceiver('audio', { direction: 'recvonly' })
      if (mode === 'video') pc.addTransceiver('video', { direction: 'recvonly' })
    }
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await signal(peer.id, 'call_offer', { offer, mode })
  }

  async function acceptCall() {
    if (!callPeer || !incomingOffer) return
    setCallError(null)
    let stream: MediaStream | null = null
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callMode === 'video' })
    } catch {
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }) } catch (err2) {
        setCallError(`Sin micrófono (${(err2 as DOMException).name}) — modo escucha`)
      }
    }
    if (stream) localStreamRef.current = stream
    setCallState('connected')
    const savedOffer = incomingOffer
    const savedPeerId = callPeer.id
    const pc = createPeerConnection(savedPeerId)
    if (stream) stream.getTracks().forEach(t => pc.addTrack(t, stream!))
    await pc.setRemoteDescription(savedOffer)
    await drainIceCandidates()
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await signal(savedPeerId, 'call_answer', { answer })
    setIncomingOffer(null)
  }

  async function acceptCallWith(call: PendingCall) {
    setCallError(null)
    let stream: MediaStream | null = null
    if (call.localStream !== undefined) {
      stream = call.localStream
    } else {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: call.mode === 'video' })
      } catch (err) {
        setCallError(`Sin micrófono (${(err as DOMException).name}) — modo escucha`)
      }
    }
    if (stream) localStreamRef.current = stream
    setCallState('connected')
    const pc = createPeerConnection(call.fromUserId)
    if (stream) stream.getTracks().forEach(t => pc.addTrack(t, stream!))
    await pc.setRemoteDescription(call.offer)
    await drainIceCandidates()
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await signal(call.fromUserId, 'call_answer', { answer })
    setIncomingOffer(null)
  }

  function rejectCall() {
    if (callPeer) void signal(callPeer.id, 'call_reject', {})
    setCallState('idle')
    setCallPeer(null)
    setIncomingOffer(null)
  }

  function endCall() {
    if (callPeer && callState !== 'idle') void signal(callPeer.id, 'call_hangup', {})
    pcRef.current?.close()
    pcRef.current = null
    iceCandidateQueueRef.current = []
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = null
    remoteStreamRef.current = null
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    setCallState('idle')
    setCallPeer(null)
    setIncomingOffer(null)
  }

  // Group call: for now starts 1-on-1 with first participant; group WebRTC is roadmap
  function handleGroupCall(selectedIds: string[], mode: 'audio' | 'video') {
    setShowGroupCall(false)
    const firstId = selectedIds[0]
    if (!firstId) return
    const peer = members.find(m => m.id === firstId)
    if (peer) void startCall(peer, mode)
  }

  // Open DM via ChatBubbleBar
  function openDm(member: Member) {
    window.dispatchEvent(new CustomEvent('mitikus:open-dm', { detail: { member } }))
  }

  // Department grouping for Equipo tab
  const others = members.filter(m => !m.isMe)
  const deptGroups = others.reduce<Record<string, Member[]>>((acc, m) => {
    const key = m.department ?? m.jobTitle ?? 'Sin departamento'
    ;(acc[key] ??= []).push(m)
    return acc
  }, {})
  const deptKeys = Object.keys(deptGroups).sort()

  function toggleDeptCollapse(dept: string) {
    setCollapsedDepts(prev => {
      const next = new Set(prev)
      if (next.has(dept)) next.delete(dept); else next.add(dept)
      return next
    })
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Group call modal */}
      {showGroupCall && (
        <GroupCallModal
          members={members}
          myId={myId}
          onClose={() => setShowGroupCall(false)}
          onCall={handleGroupCall}
        />
      )}

      {/* Call error toast */}
      {callError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-destructive text-destructive-foreground text-sm px-4 py-3 rounded-xl shadow-lg max-w-sm text-center flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
          {callError}
          <button onClick={() => setCallError(null)} className="ml-2 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Call overlay */}
      {callState !== 'idle' && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center gap-4">
          <video ref={remoteVideoRef} autoPlay playsInline className="rounded-xl max-h-[60vh] max-w-full bg-zinc-900" />
          {callMode === 'video' && (
            <video ref={localVideoRef} autoPlay playsInline muted
              className="absolute bottom-24 right-8 w-36 h-24 rounded-lg object-cover bg-zinc-800 border border-zinc-700" />
          )}
          <div className="flex flex-col items-center gap-3">
            {callPeer && callMode === 'audio' && (
              <span className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white ${avatarColor(callPeer.id)}`}>
                {initials(callPeer.name, callPeer.id)}
              </span>
            )}
            <p className="text-white text-lg font-medium">{callPeer?.name ?? callPeer?.id}</p>
            <p className="text-zinc-400 text-sm">
              {callState === 'calling' ? 'Llamando…' : callState === 'incoming' ? 'Llamada entrante' : 'Conectado'}
            </p>
          </div>
          <div className="flex items-center gap-4 mt-2">
            {callState === 'incoming' ? (
              <>
                <button onClick={acceptCall}
                  className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center text-2xl" title="Aceptar">✓</button>
                <button onClick={rejectCall}
                  className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-2xl" title="Rechazar">✕</button>
              </>
            ) : (
              <button onClick={endCall}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-2xl" title="Colgar">✕</button>
            )}
          </div>
        </div>
      )}

      {/* Panel lateral */}
      <div className="flex flex-col h-full w-72 shrink-0 border-l border-border bg-sidebar text-sidebar-foreground">
        {/* Header tabs */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors font-medium ${activeTab === 'general' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors font-medium ${activeTab === 'team' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Equipo
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Tab: General ── */}
        {activeTab === 'general' && (
          <>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {orgMessages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Canal general de la organización. ¡Sé el primero en escribir!
                </p>
              )}
              {orgMessages.map((msg) => {
                const isMe = msg.sender.id === myId
                return (
                  <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMe && (
                      msg.sender.avatarUrl ? (
                        <img src={msg.sender.avatarUrl} alt={msg.sender.name ?? msg.sender.email} className="w-7 h-7 rounded-full object-cover shrink-0" />
                      ) : (
                        <span className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-semibold text-white ${avatarColor(msg.sender.id)}`}>
                          {initials(msg.sender.name, msg.sender.email)}
                        </span>
                      )
                    )}
                    <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                      {!isMe && <span className="text-[10px] text-muted-foreground px-1">{msg.sender.name ?? msg.sender.email}</span>}
                      <div className={`rounded-2xl px-3 py-2 text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                        <p className="break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={orgFeedRef} />
            </div>
            <div className="shrink-0 border-t px-3 py-2 flex items-end gap-2">
              <textarea
                value={orgDraft}
                onChange={e => setOrgDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendOrgMessage() } }}
                placeholder="Escribe en General… (Enter)"
                rows={1}
                className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                style={{ minHeight: '36px', maxHeight: '120px' }}
              />
              <button onClick={() => void sendOrgMessage()} disabled={!orgDraft.trim() || orgSending}
                className="shrink-0 p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* ── Tab: Equipo ── */}
        {activeTab === 'team' && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Group call button */}
            <div className="px-3 pt-3 pb-2 shrink-0">
              <button
                onClick={() => setShowGroupCall(true)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-colors text-xs font-medium"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Llamada grupal
              </button>
            </div>

            {/* Members by department */}
            <div className="flex-1 overflow-y-auto">
              {members.length === 0 && (
                <p className="text-xs text-muted-foreground px-4 py-6 text-center">Cargando equipo…</p>
              )}

              {deptKeys.map(dept => {
                const deptMembers = deptGroups[dept] ?? []
                const collapsed = collapsedDepts.has(dept)
                return (
                  <div key={dept}>
                    {/* Dept header */}
                    <button
                      type="button"
                      onClick={() => toggleDeptCollapse(dept)}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted/20 transition-colors"
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                        className={`text-muted-foreground transition-transform shrink-0 ${collapsed ? '-rotate-90' : ''}`}>
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate flex-1 text-left">
                        {dept}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{deptMembers.length}</span>
                    </button>

                    {/* Members in dept */}
                    {!collapsed && deptMembers.map(m => (
                      <div key={m.id} className="flex items-center gap-3 px-4 py-2 hover:bg-muted/10 transition-colors group">
                        <Avatar id={m.id} name={m.name} email={m.email} avatarUrl={m.avatarUrl} status={m.status} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {m.name ?? m.email}
                            {m.isMe && <span className="ml-1 text-xs text-muted-foreground">(Tú)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {m.jobTitle ?? PRESENCE_LABEL[m.status]}
                          </p>
                        </div>
                        {!m.isMe && (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {/* Chat → opens ChatBubble */}
                            <button
                              onClick={() => openDm(m)}
                              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Chat"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                              </svg>
                            </button>
                            {/* Audio call */}
                            <button
                              onClick={() => void startCall(m, 'audio')}
                              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Llamada de audio"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3-8.63A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                              </svg>
                            </button>
                            {/* Video call */}
                            <button
                              onClick={() => void startCall(m, 'video')}
                              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Videollamada"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })}

              {/* My own entry at the bottom */}
              {members.filter(m => m.isMe).map(me => (
                <div key={me.id} className="flex items-center gap-3 px-4 py-2.5 border-t border-border mt-1">
                  <Avatar id={me.id} name={me.name} email={me.email} avatarUrl={me.avatarUrl} status={myStatus} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{me.name ?? me.email} <span className="text-xs text-muted-foreground">(Tú)</span></p>
                    <p className="text-xs text-muted-foreground">{presenceLabel(myStatus)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
