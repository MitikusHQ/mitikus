'use client'

import { useEffect, useState } from 'react'
import { useUser, SignIn } from '@clerk/nextjs'
import { saveLicenseToken, activateApp } from '@/lib/desktop-bridge'

/**
 * Pantalla de activación mostrada por la app de escritorio cuando no hay
 * licencia válida en disco. Muestra el componente SignIn de Clerk; tras
 * autenticarse, obtiene el token de licencia del servidor y lo entrega
 * al proceso Rust para que lo persista.
 */
export default function DesktopActivatePage() {
  const { user, isLoaded } = useUser()
  const [status, setStatus] = useState<'idle' | 'activating' | 'ok' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Cuando el usuario se autentica, activar automáticamente
  useEffect(() => {
    if (isLoaded && user && status === 'idle') {
      handleActivate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.id])

  async function handleActivate() {
    setStatus('activating')
    setErrorMsg('')
    try {
      const res = await fetch('/api/desktop/license-token', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? 'No se pudo activar la licencia. Comprueba tu conexión e inténtalo de nuevo.')
      }
      const { token } = await res.json() as { token: string }
      const saved = await saveLicenseToken(token)
      if (!saved) throw new Error('No se pudo guardar el token en la app')
      setStatus('ok')
      setTimeout(() => activateApp(), 1200)
    } catch (err: unknown) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Título */}
        <div>
          <p className="text-3xl font-bold tracking-tight">MITIKUS</p>
          <p className="text-sm text-muted-foreground mt-1">Activación de escritorio</p>
        </div>

        {/* Estado de activación */}
        {status === 'activating' && (
          <div className="space-y-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Activando licencia…</p>
          </div>
        )}

        {status === 'ok' && (
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto text-xl font-bold">✓</div>
            <p className="text-sm font-medium">¡Licencia activada!</p>
            <p className="text-xs text-muted-foreground">Abriendo MITIKUS…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <p className="text-sm text-destructive font-medium">Error al activar</p>
            <p className="text-xs text-muted-foreground">{errorMsg}</p>
            <button
              onClick={handleActivate}
              className="text-xs text-primary underline-offset-2 hover:underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Formulario de login — solo cuando no hay sesión activa y no estamos activando */}
        {isLoaded && !user && status === 'idle' && (
          <div className="flex justify-center">
            <SignIn
              routing="hash"
              afterSignInUrl="/desktop/activate"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'shadow-none border rounded-xl',
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
