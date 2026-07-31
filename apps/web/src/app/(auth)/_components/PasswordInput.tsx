'use client'

import { useState, useEffect } from 'react'

type StrengthScore = 0 | 1 | 2

function calcStrength(pwd: string): StrengthScore {
  if (pwd.length < 8) return 0
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((r) =>
    r.test(pwd),
  ).length
  if (pwd.length >= 12 && classes >= 3) return 2
  if (pwd.length >= 8 && classes >= 2) return 1
  return 0
}

const STRENGTH_CONFIG: Record<StrengthScore, { label: string; color: string; bar: string }> = {
  0: { label: 'Débil', color: 'text-red-600', bar: 'bg-red-500' },
  1: { label: 'Media', color: 'text-amber-600', bar: 'bg-amber-500' },
  2: { label: 'Fuerte', color: 'text-green-600', bar: 'bg-green-500' },
}

interface PasswordInputProps {
  id: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  required?: boolean
  showStrength?: boolean
  placeholder?: string
  autoFocus?: boolean
  'aria-describedby'?: string
}

export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete = 'current-password',
  required,
  showStrength = false,
  placeholder,
  autoFocus,
  'aria-describedby': ariaDescribedBy,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const [capsLock, setCapsLock] = useState(false)

  useEffect(() => {
    const update = (e: Event) => {
      if (e instanceof KeyboardEvent) {
        setCapsLock(e.getModifierState('CapsLock'))
      }
    }
    window.addEventListener('keydown', update)
    window.addEventListener('keyup', update)
    return () => {
      window.removeEventListener('keydown', update)
      window.removeEventListener('keyup', update)
    }
  }, [])

  const score = showStrength && value ? calcStrength(value) : null
  const cfg = score !== null ? STRENGTH_CONFIG[score] : null
  const strengthId = showStrength ? `${id}-strength` : undefined

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-describedby={[ariaDescribedBy, strengthId].filter(Boolean).join(' ') || undefined}
          className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {visible ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>

      {capsLock && (
        <p className="text-xs text-amber-600 flex items-center gap-1" role="alert">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="17 11 12 6 7 11" />
            <line x1="12" y1="6" x2="12" y2="18" />
            <line x1="8" y1="21" x2="16" y2="21" />
          </svg>
          Bloq Mayús activado
        </p>
      )}

      {showStrength && value && cfg && score !== null && (
        <div id={strengthId} aria-live="polite">
          <div className="flex gap-1 mb-1">
            {([0, 1, 2] as StrengthScore[]).map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? cfg.bar : 'bg-muted'}`}
              />
            ))}
          </div>
          <p className={`text-xs ${cfg.color}`}>{cfg.label}</p>
        </div>
      )}
    </div>
  )
}
