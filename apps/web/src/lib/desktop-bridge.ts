declare global {
  interface Window {
    __TAURI__?: {
      notification?: {
        sendNotification: (options: { title: string; body?: string }) => Promise<void>
      }
      core?: {
        invoke: <T = unknown>(cmd: string, args?: Record<string, unknown>) => Promise<T>
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

/**
 * Verdadero si corre dentro de la app de escritorio Tauri.
 * IMPORTANTE: no usar directamente en render condicional de componentes —
 * causa hydration mismatch (SSR → false, cliente → true).
 * Usa en su lugar: const [isDesktop, setIsDesktop] = useState(false)
 *                  useEffect(() => { setIsDesktop(isDesktopApp()) }, [])
 */
export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.__TAURI__)
}

// ── Licencia desktop ──────────────────────────────────────────────────────────

export interface LicenseStatus {
  valid: boolean
  tier?: string
  orgId?: string
  error?: string
}

/**
 * Obtiene el estado de la licencia desde el proceso Rust.
 * Solo disponible en la app de escritorio.
 */
export async function getLicenseStatus(): Promise<LicenseStatus | null> {
  if (!isDesktopApp()) return null
  try {
    return await window.__TAURI__!.core!.invoke<LicenseStatus>('get_license_status')
  } catch {
    return null
  }
}

/**
 * Guarda el token de licencia en el almacén local de Rust (verificado antes de guardar).
 * Llamar tras un login exitoso en la WebView de activación.
 */
export async function saveLicenseToken(token: string): Promise<boolean> {
  if (!isDesktopApp()) return false
  try {
    await window.__TAURI__!.core!.invoke('save_license_token', { token })
    return true
  } catch {
    return false
  }
}

/**
 * Redirige la ventana principal a la app tras activación exitosa.
 */
export async function activateApp(): Promise<void> {
  if (!isDesktopApp()) return
  await window.__TAURI__!.core!.invoke('activate_app')
}
