'use client'

import { useState } from 'react'
import { type Locale } from '@/i18n/config'
import { LocaleSelector } from '@/app/(dashboard)/_components/LocaleSelector'
import { ThemeToggle } from '@/app/(dashboard)/_components/ThemeToggle'

interface LandingNavProps {
  locale: Locale
}

export function LandingNav({ locale }: LandingNavProps) {
  const [open, setOpen] = useState(false)
  const isEn = locale !== 'es'
  const signIn = isEn ? 'Sign in' : 'Iniciar sesión'
  const startFree = isEn ? 'Start free' : 'Empezar gratis'
  const openMenu = isEn ? 'Open menu' : 'Abrir menú'
  const closeMenu = isEn ? 'Close menu' : 'Cerrar menú'

  return (
    <div className="flex items-center gap-2">
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-4" aria-label="Navegación principal">
        <LocaleSelector currentLocale={locale} locales={['en', 'es']} />
        <ThemeToggle />
        <a href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Blog
        </a>
        <a
          href="/sign-in"
          className="text-sm font-medium border border-input px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
        >
          {signIn}
        </a>
      </nav>

      {/* CTA siempre visible */}
      <a
        href="/sign-up"
        className="text-sm font-medium bg-primary text-primary-foreground px-3 py-1.5 md:px-4 md:py-2 rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap"
      >
        {startFree}
      </a>

      {/* Hamburger — solo móvil */}
      <button
        type="button"
        aria-label={open ? closeMenu : openMenu}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(v => !v)}
        className="md:hidden flex flex-col items-center justify-center w-9 h-9 rounded-md hover:bg-muted/60 transition-colors"
      >
        <span className={`block w-5 h-0.5 bg-foreground transition-transform duration-200 ${open ? 'rotate-45 translate-y-1' : ''}`} />
        <span className={`block w-5 h-0.5 bg-foreground mt-1 transition-opacity duration-200 ${open ? 'opacity-0' : ''}`} />
        <span className={`block w-5 h-0.5 bg-foreground mt-1 transition-transform duration-200 ${open ? '-rotate-45 -translate-y-2.5' : ''}`} />
      </button>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          className="md:hidden absolute top-full left-0 right-0 border-b bg-background/98 backdrop-blur-sm shadow-md px-6 py-4 flex flex-col gap-3"
        >
          <div className="flex items-center gap-3">
            <LocaleSelector currentLocale={locale} locales={['en', 'es']} />
            <ThemeToggle />
          </div>
          <a href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1" onClick={() => setOpen(false)}>
            Blog
          </a>
          <a
            href="/sign-in"
            className="text-sm font-medium border border-input px-3 py-1.5 rounded-md hover:bg-accent transition-colors text-center"
            onClick={() => setOpen(false)}
          >
            {signIn}
          </a>
        </div>
      )}
    </div>
  )
}
