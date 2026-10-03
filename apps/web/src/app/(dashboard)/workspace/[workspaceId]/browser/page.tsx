'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from 'react'
import { isDesktopApp } from '@/lib/desktop-bridge'

// Declaración de tipos para el elemento <webview> de Tauri/Electron
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      webview: {
        src?: string
        ref?: React.Ref<HTMLElement>
        className?: string
        style?: React.CSSProperties
        allowpopups?: string
        [key: string]: unknown
      }
    }
  }
}

export default function BrowserPage() {
  const [url, setUrl] = useState('https://www.google.com')
  const [inputUrl, setInputUrl] = useState('https://www.google.com')
  const [isDesktop, setIsDesktop] = useState(false)
  const webviewRef = useRef<HTMLElement | null>(null)

  useEffect(() => { setIsDesktop(isDesktopApp()) }, [])

  function navigate() {
    let target = inputUrl.trim()
    if (!target) return
    if (!/^https?:\/\//i.test(target)) {
      target = target.includes('.') ? `https://${target}` : `https://www.google.com/search?q=${encodeURIComponent(target)}`
    }
    setUrl(target)
    setInputUrl(target)
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
          onClick={() => (webviewRef.current as any)?.goBack?.()}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Atrás"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </button>
        <button
          type="button"
          onClick={() => (webviewRef.current as any)?.goForward?.()}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Adelante"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
        </button>
        <button
          type="button"
          onClick={() => (webviewRef.current as any)?.reload?.()}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Recargar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
        </button>
        <form
          onSubmit={(e) => { e.preventDefault(); navigate() }}
          className="flex-1 flex"
        >
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Introduce una URL o busca en Google..."
            className="flex-1 px-3 py-1.5 text-sm rounded-md border border-border bg-muted/50 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </form>
      </div>

      {/* WebView — solo funciona dentro de Tauri */}
      <webview
        ref={webviewRef as any}
        src={url}
        className="flex-1 w-full min-h-0"
        style={{ flexGrow: 1 }}
        {...({ allowpopups: 'true' } as Record<string, unknown>)}
      />
    </div>
  )
}
