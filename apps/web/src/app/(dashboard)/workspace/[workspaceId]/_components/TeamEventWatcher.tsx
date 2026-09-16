'use client'

import { useEffect, useRef, useState } from 'react'

export type IncomingCall = {
  fromUserId: string
  fromUserName: string | null
  offer: RTCSessionDescriptionInit
  mode: 'audio' | 'video'
}

interface Props {
  teamPanelOpen: boolean
  onAcceptCall: (call: IncomingCall) => void
  onUnreadChange: (count: number) => void
}

// Web Audio API helpers
function createAudioCtx(): AudioContext | null {
  try { return new AudioContext() } catch { return null }
}

function playRing(ctx: AudioContext, stopped: { current: boolean }) {
  function beep(freq: number, start: number, duration: number) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.18, ctx.currentTime + start)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
    osc.start(ctx.currentTime + start)
    osc.stop(ctx.currentTime + start + duration)
  }
  function ring() {
    if (stopped.current) return
    beep(880, 0, 0.15)
    beep(880, 0.2, 0.15)
    setTimeout(() => { if (!stopped.current) ring() }, 1800)
  }
  ring()
}

function playMessageBeep(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.value = 660
  gain.gain.setValueAtTime(0.12, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.25)
}

export function TeamEventWatcher({ teamPanelOpen, onAcceptCall, onUnreadChange }: Props) {
  const lastEventTime = useRef(new Date().toISOString())
  const unreadRef = useRef(0)
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const ringStopped = useRef(false)

  // Start/stop ring sound when incomingCall changes
  useEffect(() => {
    if (!incomingCall) {
      ringStopped.current = true
      return
    }
    ringStopped.current = false
    if (!audioCtxRef.current) audioCtxRef.current = createAudioCtx()
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') void audioCtxRef.current.resume()
      playRing(audioCtxRef.current, ringStopped)
    }
    return () => { ringStopped.current = true }
  }, [incomingCall])

  useEffect(() => {
    if (teamPanelOpen) {
      unreadRef.current = 0
      onUnreadChange(0)
      return
    }

    async function poll() {
      try {
        const res = await fetch(`/api/team/events?since=${encodeURIComponent(lastEventTime.current)}`)
        if (!res.ok) return
        const data = await res.json() as {
          events: Array<{ type: string; payload: Record<string, unknown> }>
          serverTime: string
        }
        lastEventTime.current = data.serverTime

        let newMsgs = 0
        for (const ev of data.events) {
          if (ev.type === 'call_offer') {
            const p = ev.payload
            setIncomingCall({
              fromUserId: String(p['fromUserId']),
              fromUserName: p['fromUserName'] as string | null,
              offer: p['offer'] as RTCSessionDescriptionInit,
              mode: (p['mode'] as 'audio' | 'video') ?? 'audio',
            })
          }
          if (ev.type === 'new_message') newMsgs++
          if (ev.type === 'call_hangup' || ev.type === 'call_reject') {
            setIncomingCall(null)
          }
        }
        if (newMsgs > 0) {
          unreadRef.current += newMsgs
          onUnreadChange(unreadRef.current)
          // Play message sound
          if (!audioCtxRef.current) audioCtxRef.current = createAudioCtx()
          if (audioCtxRef.current) {
            if (audioCtxRef.current.state === 'suspended') void audioCtxRef.current.resume()
            playMessageBeep(audioCtxRef.current)
          }
        }
      } catch { /* ignore */ }
    }

    const interval = setInterval(() => void poll(), 2000)
    return () => clearInterval(interval)
  }, [teamPanelOpen, onUnreadChange])

  function rejectCall() {
    if (!incomingCall) return
    void fetch('/api/team/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: incomingCall.fromUserId, type: 'call_reject', payload: {} }),
    })
    setIncomingCall(null)
  }

  function acceptCall() {
    if (!incomingCall) return
    const call = incomingCall
    setIncomingCall(null)
    onAcceptCall(call)
  }

  if (!incomingCall) return null

  const isVideo = incomingCall.mode === 'video'
  const callerInitial = (incomingCall.fromUserName?.[0] ?? '?').toUpperCase()

  return (
    <>
      {/* Full-screen dim flash effect */}
      <div className="fixed inset-0 z-[75] pointer-events-none animate-pulse bg-primary/5" />

      {/* Floating call card */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[80]">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-3xl bg-green-500/20 animate-ping" style={{ animationDuration: '1.2s' }} />
        <div className="relative flex items-center gap-4 bg-card border-2 border-green-500/60 rounded-3xl shadow-[0_0_40px_rgba(34,197,94,0.35)] px-5 py-4 min-w-[320px] max-w-[400px]">

          {/* Avatar with pulsing ring */}
          <div className="relative shrink-0">
            <span className="absolute inset-[-4px] rounded-full border-2 border-green-400 animate-ping opacity-75" />
            <span className="absolute inset-[-8px] rounded-full border border-green-400/40 animate-ping opacity-40" style={{ animationDelay: '0.3s' }} />
            <div className="relative w-12 h-12 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-xl">
              {callerInitial}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              {incomingCall.fromUserName ?? 'Compañero'}
            </p>
            <p className="text-xs text-green-400 font-medium flex items-center gap-1 mt-0.5">
              {isVideo ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
                  </svg>
                  Videollamada entrante…
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3-8.63A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Llamada entrante…
                </>
              )}
            </p>
          </div>

          {/* Reject */}
          <button
            onClick={rejectCall}
            className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center transition-all shadow-lg shrink-0"
            title="Rechazar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Accept */}
          <button
            onClick={acceptCall}
            className="w-11 h-11 rounded-full bg-green-500 hover:bg-green-400 active:scale-95 text-white flex items-center justify-center transition-all shadow-lg shadow-green-500/40 shrink-0 animate-pulse"
            title="Aceptar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3-8.63A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
