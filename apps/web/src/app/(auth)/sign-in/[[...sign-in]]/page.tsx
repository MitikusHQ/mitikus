'use client'

import { useSignIn, useAuth, useClerk } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PasswordInput } from '../../_components/PasswordInput'
import { mapClerkError } from '@/lib/auth-errors'

type OAuthProvider = 'oauth_google' | 'oauth_github'

function OAuthButton({
  provider,
  onClick,
  disabled,
}: {
  provider: OAuthProvider
  onClick: () => void
  disabled: boolean
}) {
  const config = {
    oauth_google: {
      label: 'Continuar con Google',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      ),
    },
    oauth_github: {
      label: 'Continuar con GitHub',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      ),
    },
  }

  const { label, icon } = config[provider]

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent disabled:opacity-50 transition-colors"
    >
      {icon}
      {label}
    </button>
  )
}

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const { isSignedIn, isLoaded: authLoaded } = useAuth()
  const clerk = useClerk()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOAuthLoading] = useState<OAuthProvider | null>(null)
  const [showSignOut, setShowSignOut] = useState(false)
  const [showTOTP, setShowTOTP] = useState(false)
  const [totpCode, setTotpCode] = useState('')

  // Redirect already authenticated users immediately
  useEffect(() => {
    if (authLoaded && isSignedIn) {
      window.location.href = '/onboarding'
    }
  }, [isSignedIn, authLoaded])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setError('')
    setShowSignOut(false)

    try {
      const result = await signIn.create({ identifier: email, password })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        window.location.href = '/onboarding'
        return
      }

      // Some Clerk instances require the password to be submitted
      // as an explicit first factor after the identifier is resolved.
      if (result.status === 'needs_first_factor') {
        const result2 = await signIn.attemptFirstFactor({
          strategy: 'password',
          password,
        })
        if (result2.status === 'complete') {
          await setActive({ session: result2.createdSessionId })
          window.location.href = '/onboarding'
          return
        }
        if (process.env.NODE_ENV === 'development') {
          console.warn('[SignIn] needs_first_factor → attemptFirstFactor status:', result2.status, {
            supportedSecondFactors: result2.supportedSecondFactors,
          })
        }
        if (result2.status === 'needs_second_factor') {
          await signIn.prepareSecondFactor({ strategy: 'email_code' })
          setShowTOTP(true)
          setError('')
        } else {
          setError('Se requiere verificación adicional.')
        }
        return
      }

      if (process.env.NODE_ENV === 'development') {
        console.warn('[SignIn] Unexpected status after create():', result.status, {
          supportedFirstFactors: result.supportedFirstFactors,
          supportedSecondFactors: result.supportedSecondFactors,
        })
      }

      const statusStr = result.status as string
      if (statusStr === 'needs_client_trust') {
        // Bot Protection is enabled in Clerk Dashboard but the CAPTCHA widget
        // did not complete. Ensure <div id="clerk-captcha"> is in the DOM
        // or disable Bot Protection in Clerk Dashboard → Configure → Attack Protection.
        setError('La verificación de seguridad ha fallado. Recarga la página e inténtalo de nuevo. Si el problema persiste, contacta con soporte.')
      } else if (result.status === 'needs_second_factor') {
        await signIn.prepareSecondFactor({ strategy: 'email_code' })
        setShowTOTP(true)
        setError('')
      } else {
        setError('Se requiere verificación adicional. Contacta con soporte si persiste.')
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ code?: string }> }
      const code = clerkErr.errors?.[0]?.code ?? ''
      if (code === 'session_exists') {
        // Si ya hay sesión activa, redirigir directamente
        if (isSignedIn) {
          window.location.href = '/onboarding'
          return
        }
        // Intentar activar la sesión existente
        const sessions = clerk.client?.activeSessions ?? []
        const matchingSession = sessions.find(
          (s) => s.publicUserData?.identifier === email,
        ) ?? sessions[0]

        if (matchingSession) {
          try {
            await setActive({ session: matchingSession.id })
            window.location.href = '/onboarding'
            return
          } catch {
            // La sesión existe en Clerk pero no se puede activar localmente
            // Hacer signOut completo y dejar que el usuario intente de nuevo
            await clerk.signOut()
            setError('Sesión anterior limpiada. Inicia sesión de nuevo.')
            return
          }
        }
        setShowSignOut(true)
        setError('Ya tienes una sesión activa.')
      } else {
        setError(mapClerkError(err))
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleTOTP(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      const result = await signIn.attemptSecondFactor({
        strategy: 'email_code',
        code: totpCode,
      })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        window.location.href = '/onboarding'
      } else {
        setError('Código incorrecto. Inténtalo de nuevo.')
      }
    } catch (err) {
      setError(mapClerkError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuth(provider: OAuthProvider) {
    if (!isLoaded) return
    setOAuthLoading(provider)
    setError('')
    try {
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/onboarding',
      })
    } catch (err) {
      setError(mapClerkError(err))
      setOAuthLoading(null)
    }
  }

  async function handleSignOut() {
    try {
      await clerk.signOut({ redirectUrl: '/sign-in' })
    } catch {
      window.location.href = '/sign-in'
    }
  }

  if (!isLoaded || (authLoaded && isSignedIn)) {
    return (
      <div className="flex justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (showTOTP) {
    return (
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Verificación en dos pasos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Introduce el código que hemos enviado a tu correo electrónico
          </p>
        </div>
        <form onSubmit={handleTOTP} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="totp" className="text-sm font-medium">
              Código de verificación
            </label>
            <input
              id="totp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              required
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring tracking-widest text-center text-lg"
              placeholder="000000"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || totpCode.length < 6}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
          <button
            type="button"
            onClick={() => { setShowTOTP(false); setTotpCode(''); setError('') }}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Volver al inicio de sesión
          </button>
        </form>
      </div>
    )
  }

  const anyLoading = loading || oauthLoading !== null

  return (
    <div className="w-full max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Iniciar sesión</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bienvenido de nuevo a MITIKUS
        </p>
      </div>

      {/* OAuth */}
      <div className="space-y-2">
        <OAuthButton
          provider="oauth_google"
          onClick={() => handleOAuth('oauth_google')}
          disabled={anyLoading}
        />
        <OAuthButton
          provider="oauth_github"
          onClick={() => handleOAuth('oauth_github')}
          disabled={anyLoading}
        />
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">o</span>
        </div>
      </div>

      {/* Email/password form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Clerk injects Cloudflare Turnstile here when Bot Protection is enabled */}
        <div id="clerk-captcha" />

        {showSignOut ? (
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-md border border-destructive text-destructive px-4 py-2 text-sm font-medium hover:bg-destructive/10 transition-colors"
          >
            Cerrar sesión e intentarlo de nuevo
          </button>
        ) : (
          <button
            type="submit"
            disabled={anyLoading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        )}

        <p className="text-xs text-center text-muted-foreground">
          Permanecerás conectado hasta que cierres sesión.
        </p>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{' '}
        <Link href="/sign-up" className="text-primary hover:underline">
          Crear cuenta
        </Link>
      </p>
    </div>
  )
}
