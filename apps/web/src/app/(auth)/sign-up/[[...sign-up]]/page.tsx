'use client'

import { useSignUp } from '@clerk/nextjs'
import { useState } from 'react'
import Link from 'next/link'
import { PasswordInput } from '../../_components/PasswordInput'
import { mapClerkError } from '@/lib/auth-errors'
import { useLocale } from '@/hooks/useLocale'

const translations = {
  es: {
    withGoogle: 'Continuar con Google',
    withGitHub: 'Continuar con GitHub',
    title: 'Crear cuenta',
    subtitle: 'Empieza gratis con MITIKUS',
    email: 'Correo electrónico',
    password: 'Contraseña',
    passwordHint: 'Mínimo 8 caracteres.',
    confirmPassword: 'Confirmar contraseña',
    passwordMismatch: 'Las contraseñas no coinciden.',
    submit: 'Crear cuenta',
    submitting: 'Creando cuenta...',
    alreadyHaveAccount: '¿Ya tienes una cuenta?',
    signIn: 'Iniciar sesión',
    verifyTitle: 'Verifica tu email',
    verifySubtitle: (email: string) => `Te hemos enviado un código de 6 dígitos a ${email}.`,
    verificationCode: 'Código de verificación',
    verify: 'Verificar email',
    verifying: 'Verificando...',
    resend: '¿No lo recibiste? Reenviar código de verificación',
    resending: 'Enviando...',
    resendSent: '¡Nuevo código enviado!',
    back: '← Volver',
    verifyIncomplete: 'Verificación incompleta. Inténtalo de nuevo.',
  },
  en: {
    withGoogle: 'Continue with Google',
    withGitHub: 'Continue with GitHub',
    title: 'Create account',
    subtitle: 'Start free with MITIKUS',
    email: 'Email address',
    password: 'Password',
    passwordHint: 'Minimum 8 characters.',
    confirmPassword: 'Confirm password',
    passwordMismatch: 'Passwords do not match.',
    submit: 'Create account',
    submitting: 'Creating account...',
    alreadyHaveAccount: 'Already have an account?',
    signIn: 'Sign in',
    verifyTitle: 'Verify your email',
    verifySubtitle: (email: string) => `We sent a 6-digit code to ${email}.`,
    verificationCode: 'Verification code',
    verify: 'Verify email',
    verifying: 'Verifying...',
    resend: "Didn't receive it? Resend verification code",
    resending: 'Sending...',
    resendSent: 'New code sent!',
    back: '← Back',
    verifyIncomplete: 'Verification incomplete. Please try again.',
  },
}

type OAuthProvider = 'oauth_google' | 'oauth_github'
type Stage = 'form' | 'verify'

function OAuthButton({
  provider,
  label,
  onClick,
  disabled,
}: {
  provider: OAuthProvider
  label: string
  onClick: () => void
  disabled: boolean
}) {
  const config = {
    oauth_google: {
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
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      ),
    },
  }

  const { icon } = config[provider]

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

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const locale = useLocale()
  const t = translations[locale]

  const [stage, setStage] = useState<Stage>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOAuthLoading] = useState<OAuthProvider | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    if (password !== confirmPassword) {
      setError(t.passwordMismatch)
      return
    }
    setLoading(true)
    setError('')
    try {
      await signUp.create({ emailAddress: email, password })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setStage('verify')
    } catch (err) {
      setError(mapClerkError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        window.location.href = '/onboarding'
      } else {
        setError(t.verifyIncomplete)
      }
    } catch (err) {
      setError(mapClerkError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!isLoaded) return
    setResendLoading(true)
    setError('')
    setResendSent(false)
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setResendSent(true)
    } catch (err) {
      setError(mapClerkError(err))
    } finally {
      setResendLoading(false)
    }
  }

  async function handleOAuth(provider: OAuthProvider) {
    if (!isLoaded) return
    setOAuthLoading(provider)
    setError('')
    try {
      await signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/onboarding',
      })
    } catch (err) {
      setError(mapClerkError(err))
      setOAuthLoading(null)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const anyLoading = loading || oauthLoading !== null

  /* ── Verify stage ── */
  if (stage === 'verify') {
    return (
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t.verifyTitle}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t.verifySubtitle(email)}
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="code" className="text-sm font-medium">
              {t.verificationCode}
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
            />
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
            {loading ? t.verifying : t.verify}
          </button>
        </form>

        <div className="text-center text-sm space-y-2">
          {resendSent && (
            <p className="text-green-600">{t.resendSent}</p>
          )}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="text-primary hover:underline disabled:opacity-50 text-sm"
          >
            {resendLoading ? t.resending : t.resend}
          </button>
        </div>

        <button
          type="button"
          onClick={() => { setStage('form'); setCode(''); setError('') }}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t.back}
        </button>
      </div>
    )
  }

  /* ── Registration form ── */
  return (
    <div className="w-full max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t.subtitle}
        </p>
      </div>

      {/* OAuth */}
      <div className="space-y-2">
        <OAuthButton
          provider="oauth_google"
          label={t.withGoogle}
          onClick={() => handleOAuth('oauth_google')}
          disabled={anyLoading}
        />
        <OAuthButton
          provider="oauth_github"
          label={t.withGitHub}
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

      <form onSubmit={handleRegister} className="space-y-4" noValidate>
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            {t.email}
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
          <label htmlFor="password" className="text-sm font-medium">
            {t.password}
          </label>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            required
            showStrength
          />
          <p className="text-xs text-muted-foreground">{t.passwordHint}</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="confirm" className="text-sm font-medium">
            {t.confirmPassword}
          </label>
          <PasswordInput
            id="confirm"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            required
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-destructive">{t.passwordMismatch}</p>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Clerk injects Cloudflare Turnstile here when Bot Protection is enabled */}
        <div id="clerk-captcha" />

        <button
          type="submit"
          disabled={anyLoading || !email || !password || password !== confirmPassword}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? t.submitting : t.submit}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t.alreadyHaveAccount}{' '}
        <Link href="/sign-in" className="text-primary hover:underline">
          {t.signIn}
        </Link>
      </p>
    </div>
  )
}
