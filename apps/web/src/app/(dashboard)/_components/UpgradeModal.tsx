'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface Props {
  onClose: () => void
  reason?: 'limit' | 'blocked'
}

export function UpgradeModal({ onClose, reason = 'limit' }: Props) {
  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-2xl border bg-card shadow-xl p-8 space-y-6">
        {/* Icono */}
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl mx-auto">
          {reason === 'blocked' ? '🔒' : '⚡'}
        </div>

        {/* Copy */}
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold">
            {reason === 'blocked'
              ? 'Acceso beta restringido'
              : 'Límite de herramientas alcanzado'}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {reason === 'blocked'
              ? 'Tu cuenta está en lista de espera. Escríbenos para solicitar acceso anticipado.'
              : 'Has llegado al máximo de herramientas de tu plan actual. Pasa al siguiente nivel para instalar más.'}
          </p>
        </div>

        {/* Beneficios del upgrade */}
        {reason === 'limit' && (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              'Hasta 15 herramientas instaladas',
              '30 generaciones IA al mes',
              'Soporte prioritario',
            ].map((b) => (
              <li key={b} className="flex items-center gap-2">
                <span className="text-primary text-base">✓</span>
                {b}
              </li>
            ))}
          </ul>
        )}

        {/* CTAs */}
        <div className="space-y-2">
          {reason === 'blocked' ? (
            <a
              href="mailto:hola@mitikus.com?subject=Solicitud%20de%20acceso%20beta"
              className="block w-full text-center rounded-lg bg-primary text-primary-foreground font-medium py-2.5 text-sm hover:bg-primary/90 transition-colors"
            >
              Contactar al equipo
            </a>
          ) : (
            <Link
              href="/pricing"
              className="block w-full text-center rounded-lg bg-primary text-primary-foreground font-medium py-2.5 text-sm hover:bg-primary/90 transition-colors"
              onClick={onClose}
            >
              Ver planes →
            </Link>
          )}
          <button
            type="button"
            onClick={onClose}
            className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  )
}
