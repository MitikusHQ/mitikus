declare global {
  interface Window {
    __TAURI__?: {
      notification?: {
        sendNotification: (options: { title: string; body?: string }) => Promise<void>
      }
    }
  }
}

/**
 * Envía notificación nativa del OS si corre en la app de escritorio Tauri.
 * Retorna true si se envió, false si no (navegador normal o SSR).
 */
export async function sendDesktopNotification(title: string, body?: string): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!window.__TAURI__?.notification?.sendNotification) return false

  try {
    await window.__TAURI__.notification.sendNotification({ title, body })
    return true
  } catch {
    return false
  }
}

/** Verdadero si corre dentro de la app de escritorio Tauri. */
export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.__TAURI__)
}
