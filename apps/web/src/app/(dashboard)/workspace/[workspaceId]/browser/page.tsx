'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { isDesktopApp } from '@/lib/desktop-bridge'

async function invoke(cmd: string, args?: Record<string, unknown>) {
  const t = (window as unknown as { __TAURI__?: { core?: { invoke?: Function } } }).__TAURI__
  if (!t?.core?.invoke) return
  return t.core.invoke(cmd, args)
}

export default function BrowserPage() {
  const [inputUrl, setInputUrl] = useState('https://www.google.com')
  const [currentUrl, setCurrentUrl] = useState('https://www.google.com')
  const [isDesktop, setIsDesktop] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => { setIsDesktop(isDesktopApp()) }, [])

  const openBrowserAt = useCallback(async (url: string) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    await invoke('open_browser', {
      url,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    })
  }, [])

  // Abrir child webview cuando el componente monta (solo desktop)
  useEffect(() => {
    if (!isDesktop) return
    openBrowserAt(currentUrl)
    return () => {
      // Cerrar el child webview cuando se navega fuera
      invoke('browser_close').catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop])

  // Reposicionar si el contenedor cambia de tamaño
  useEffect(() => {
    if (!isDesktop || !containerRef.current) return
    const observer = new ResizeObserver(() => openBrowserAt(currentUrl))
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [isDesktop, currentUrl, openBrowserAt])

  function navigate(url?: string) {
    const target = normalizeUrl(url ?? inputUrl)
    if (!target) return
    setCurrentUrl(target)
    setInputUrl(target)
    invoke('browser_navigate', {
      url: target,
      x: containerRef.current?.getBoundingClientRect().left,
      y: containerRef.current?.getBoundingClientRect().top,
      width: containerRef.current?.getBoundingClientRect().width,
      height: containerRef.current?.getBoundingClientRect().height,
    }).catch(() => {})
  }

  if (!isDesktop) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
        <p className="text-sm">El navegador integrado solo está disponible en la app de escritorio.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Barra de navegación */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-background shrink-0">
        <button
          type="button"
          onClick={() => invoke('browser_back').catch(() => {})}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Atrás"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </button>
        <button
          type="button"
          onClick={() => invoke('browser_forward').catch(() => {})}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Adelante"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
        </button>
        <button
          type="button"
          onClick={() => invoke('browser_reload').catch(() => {})}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Recargar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
        </button>
        <form onSubmit={(e) => { e.preventDefault(); navigate() }} className="flex-1 flex">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Introduce una URL o busca en Google..."
            className="flex-1 px-3 py-1.5 text-sm rounded-md border border-border bg-muted/50 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </form>
      </div>

      {/* Área donde se superpone el child webview de Tauri */}
      <div ref={containerRef} className="flex-1 w-full min-h-0" />
    </div>
  )
}

function normalizeUrl(raw: string): string {
  const s = raw.trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  if (s.includes('.')) return `https://${s}`
  return `https://www.google.com/search?q=${encodeURIComponent(s)}`
}
