'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { NotificationData } from '@/app/actions/tasks'
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '@/app/actions/tasks'
import { sendDesktopNotification } from '@/lib/desktop-bridge'

interface Props {
  workspaceId: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  return `hace ${Math.floor(hours / 24)}d`
}

export function NotificationBell({ workspaceId }: Props) {
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [pushStatus, setPushStatus] = useState<'idle' | 'unsupported' | 'disabled' | 'saving' | 'enabled' | 'error'>('idle')
  const panelRef = useRef<HTMLDivElement>(null)
  const webPushPublicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY

  useEffect(() => {
    loadCount()
    const interval = setInterval(loadCount, 60000)
    return () => clearInterval(interval)
  }, [])

  async function loadCount() {
    try {
      const n = await getUnreadCount(workspaceId)
      setCount(n)
    } catch {}
  }

  async function handleOpen() {
    if (open) { setOpen(false); return }
    setOpen(true)
    const list = await getNotifications(workspaceId)
    setNotifications(list)
    // En app de escritorio: enviar notificación nativa para la más reciente no leída
    const latest = list.find((n) => !n.readAt)
    if (latest) {
      void sendDesktopNotification('MITIKUS', latest.message ?? 'Tienes notificaciones nuevas')
    }
  }

  async function handleMarkRead(id: string) {
    await markNotificationRead(id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    setCount((c) => Math.max(0, c - 1))
  }

  async function handleMarkAll() {
    await markAllNotificationsRead(workspaceId)
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
    setCount(0)
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; i += 1) outputArray[i] = rawData.charCodeAt(i)
    return outputArray
  }

  async function enablePushNotifications() {
    if (!webPushPublicKey) {
      setPushStatus('disabled')
      return
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setPushStatus('unsupported')
      return
    }

    setPushStatus('saving')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setPushStatus('disabled')
        return
      }

      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(webPushPublicKey),
      })

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      if (!response.ok) {
        setPushStatus('error')
        return
      }
      setPushStatus('enabled')
    } catch {
      setPushStatus('error')
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        aria-label={`Notificaciones${count > 0 ? ` (${count} sin leer)` : ''}`}
        className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-3 right-3 top-32 z-50 max-h-[calc(100vh-9rem)] overflow-hidden rounded-xl border border-border bg-card shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-1 sm:w-80 sm:max-h-none">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
            <span className="text-sm font-medium">Notificaciones</span>
            {count > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-muted-foreground hover:text-foreground">
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="border-b border-border px-3 py-2.5">
            <button
              type="button"
              onClick={enablePushNotifications}
              disabled={pushStatus === 'saving' || pushStatus === 'enabled'}
              className="w-full rounded-md border border-border px-3 py-2 text-left text-xs font-medium hover:bg-muted disabled:opacity-60"
            >
              {pushStatus === 'saving'
                ? 'Activando notificaciones...'
                : pushStatus === 'enabled'
                  ? 'Notificaciones del dispositivo activadas'
                  : 'Activar notificaciones en este dispositivo'}
            </button>
            {pushStatus === 'unsupported' && (
              <p className="mt-1.5 text-[10px] text-muted-foreground">Este navegador no soporta notificaciones push.</p>
            )}
            {pushStatus === 'disabled' && (
              <p className="mt-1.5 text-[10px] text-muted-foreground">Las notificaciones no están permitidas o falta configuración Web Push.</p>
            )}
            {pushStatus === 'error' && (
              <p className="mt-1.5 text-[10px] text-red-500">No se pudo activar este dispositivo.</p>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Sin notificaciones</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-3 py-2.5 border-b border-border last:border-0 ${n.readAt ? 'opacity-60' : 'bg-primary/5'}`}
                >
                  <div className="flex gap-2 items-start">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.readAt ? 'bg-transparent' : 'bg-primary'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                        {(n.link ?? (n.taskId ? `/workspace/${workspaceId}/tasks?task=${n.taskId}` : null)) && (
                          <Link
                            href={n.link ?? `/workspace/${workspaceId}/tasks?task=${n.taskId}`}
                            onClick={() => { handleMarkRead(n.id); setOpen(false) }}
                            className="text-[10px] text-primary hover:underline"
                          >
                            {n.taskId ? 'Ver tarea →' : 'Ver →'}
                          </Link>
                        )}
                      </div>
                    </div>
                    {!n.readAt && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        aria-label="Marcar como leída"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
