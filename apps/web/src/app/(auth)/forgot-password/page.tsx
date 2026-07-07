'use client'

import { useSignIn } from '@clerk/nextjs'
import { useState } from 'react'
import Link from 'next/link'
import { PasswordInput } from '../_components/PasswordInput'
import { mapClerkError } from '@/lib/auth-errors'

type Stage = 'email' | 'code' | 'newPassword' | 'done'

export default function ForgotPasswordPage() {
  const { isLoaded, signIn, setActive } = useSignIn()

  const [stage, setStage] = useState<Stage>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isLoaded) {
    return (
      <div className="flex justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      })
      setStage('code')
    } catch (err) {
      setError(mapClerkError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleResendCode() {
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      })
    } catch (err) {
      setError(mapClerkError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
      })
      if (result.status === 'needs_new_password') {
        setStage('newPassword')
      } else if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        setStage('done')
      } else {
        setError('Estado inesperado. Inténtalo de nuevo.')
      }
    } catch (err) {
      setError(mapClerkError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await signIn.resetPassword({ password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        setStage('done')
      } else {
        setError('Estado inesperado. Inténtalo de nuevo.')
      }
    } catch (err) {
      setError(mapClerkError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">

      {/* ── Stage: email ── */}
      {stage === 'email' && (
        <>
          <div>
            <h1 className="text-2xl font-bold">Restablece tu contraseña</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Introduce tu email y te enviaremos un código para restablecerla.
            </p>
          </div>

          <form onSubmit={handleSendCode} className="space-y-4">
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

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/sign-in" className="text-primary hover:underline">
              ← Volver a iniciar sesión
            </Link>
          </p>
        </>
      )}

      {/* ── Stage: code ── */}
      {stage === 'code' && (
        <>
          <div>
            <h1 className="text-2xl font-bold">Revisa tu email</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Te hemos enviado un código de 6 dígitos a{' '}
              <span className="font-medium text-foreground">{email}</span>.
            </p>
          </div>

          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="code" className="text-sm font-medium">
                Código de verificación
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                required
                autoFocus
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring tracking-widest text-center text-lg"
                aria-describedby="code-hint"
              />
              <p id="code-hint" className="text-xs text-muted-foreground">
                Introduce el código de 6 dígitos que te hemos enviado.
              </p>
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verificando...' : 'Verificar código'}
            </button>
          </form>

          <div className="text-center text-sm text-muted-foreground space-y-2">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading}
              className="text-primary hover:underline disabled:opacity-50"
            >
              Reenviar código
            </button>
            <span className="mx-2">·</span>
            <button
              type="button"
              onClick={() => { setStage('email'); setCode(''); setError('') }}
              className="hover:underline"
            >
              Cambiar email
            </button>
          </div>
        </>
      )}

      {/* ── Stage: newPassword ── */}
      {stage === 'newPassword' && (
        <>
          <div>
            <h1 className="text-2xl font-bold">Crea una nueva contraseña</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Elige una contraseña segura para tu cuenta.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium">
                Nueva contraseña
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                required
                showStrength
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="confirm" className="text-sm font-medium">
                Confirmar nueva contraseña
              </label>
              <PasswordInput
                id="confirm"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">Las contraseñas no coinciden.</p>
              )}
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password || password !== confirmPassword}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </form>
        </>
      )}

      {/* ── Stage: done ── */}
      {stage === 'done' && (
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">¡Contraseña restablecida!</h1>
          <p className="text-sm text-muted-foreground">
            Tu contraseña ha sido cambiada. Ya has iniciado sesión.
          </p>
          <Link
            href="/onboarding"
            className="inline-block rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Ir al panel
          </Link>
        </div>
      )}
    </div>
  )
}
