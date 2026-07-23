'use client'

import { useState, useEffect, useRef } from 'react'
import { requestOtp, verifyOtp } from '@/app/actions/contracts'

interface Props {
  shareToken:  string
  clientEmail: string
  initialWait: number
  onVerified:  () => void
}

export function OtpVerifyClient({ shareToken, clientEmail, initialWait, onVerified }: Props) {
  const [code,        setCode]        = useState('')
  const [sending,     setSending]     = useState(false)
  const [verifying,   setVerifying]   = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [waitSeconds, setWaitSeconds] = useState(initialWait)
  const [sent,        setSent]        = useState(initialWait > 0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (waitSeconds <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setWaitSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [waitSeconds])

  useEffect(() => {
    if (initialWait <= 0) {
      void handleSend()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSend() {
    setSending(true)
    setError(null)
    const result = await requestOtp(shareToken)
    setSending(false)
    if (result.sent) {
      setSent(true)
      setWaitSeconds(60)
    } else if (result.waitSeconds) {
      setWaitSeconds(result.waitSeconds)
      setSent(true)
    } else {
      setError('No se pudo enviar el código. Inténtalo de nuevo.')
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) return
    setVerifying(true)
    setError(null)
    const result = await verifyOtp(shareToken, code)
    setVerifying(false)
    if (result.ok) {
      onVerified()
    } else {
      if (result.error === 'max_attempts') {
        setError('Has superado el máximo de intentos. Solicita un nuevo código.')
        setCode('')
      } else if (result.error === 'expired') {
        setError('El código ha caducado. Solicita uno nuevo.')
        setCode('')
      } else {
        setError('Código incorrecto. Inténtalo de nuevo.')
      }
    }
  }

  const maskedEmail = clientEmail.replace(/^(.)(.*)(@.*)$/, (_, a, _b, c) => `${a}***${c}`)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl mb-3">📨</div>
          <h1 className="text-xl font-semibold mb-2">Verifica tu identidad</h1>
          <p className="text-sm text-muted-foreground">
            {sent
              ? <><span>Hemos enviado un código de 6 dígitos a </span><strong>{maskedEmail}</strong></>
              : 'Enviando código...'}
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              disabled={verifying || sending}
              autoFocus
              className="w-full text-center text-2xl font-mono tracking-[0.5em] rounded-lg border border-input bg-background px-4 py-4 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={code.length !== 6 || verifying || sending}
            className="w-full rounded-lg bg-primary text-primary-foreground py-3 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {verifying ? 'Verificando...' : 'Verificar código'}
          </button>
        </form>

        <div className="mt-6 text-center">
          {waitSeconds > 0 ? (
            <p className="text-xs text-muted-foreground">
              Reenviar código en <span className="font-medium tabular-nums">{waitSeconds}s</span>
            </p>
          ) : (
            <button
              onClick={handleSend}
              disabled={sending}
              className="text-xs text-primary hover:underline disabled:opacity-50"
            >
              {sending ? 'Enviando...' : 'Reenviar código'}
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          El código caduca en 10 minutos.
        </p>
      </div>
    </div>
  )
}
