'use client'

import { useEffect, useRef, useState } from 'react'

type IncomingCall = {
  fromUserId: string
  fromUserName: string | null
  offer: RTCSessionDescriptionInit
  mode: 'audio' | 'video'
}

interface Props {
  teamPanelOpen: boolean
  onOpenTeamPanel: () => void
  onUnreadChange: (count: number) => void
}

export function TeamEventWatcher({ teamPanelOpen, onOpenTeamPanel, onUnreadChange }: Props) {
  const lastEventTime = useRef(new Date().toISOString())
  const unreadRef = useRef(0)
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)

  useEffect(() => {
    if (teamPanelOpen) {
      // Panel is open and manages its own polling — reset unread
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
    window.dispatchEvent(new CustomEvent('incomingCallAccept', { detail: incomingCall }))
    onOpenTeamPanel()
    setIncomingCall(null)
  }

  if (!incomingCall) return null

  const isVideo = incomingCall.mode === 'video'
  const callerInitial = (incomingCall.fromUserName?.[0] ?? '?').toUpperCase()

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 bg-card border border-border rounded-2xl shadow-2xl px-4 py-3 min-w-[300px] max-w-[360px]">
        {/* Pulsing ring around avatar */}
        <div className="relative shrink-0">
          <span className="absolute inset-0 rounded-full bg-green-500/30 animate-ping" />
          <div className="relative w-11 h-11 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-lg">
            {callerInitial}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {incomingCall.fromUserName ?? 'Compañero'}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {isVideo ? (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
                </svg>
                Videollamada entrante
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3-8.63A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Llamada entrante
              </>
            )}
          </p>
        </div>

        {/* Reject */}
        <button
          onClick={rejectCall}
          className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-colors shrink-0"
          title="Rechazar"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Accept */}
        <button
          onClick={acceptCall}
          className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center transition-colors shrink-0"
          title="Aceptar"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3-8.63A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6.29 6.29l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
