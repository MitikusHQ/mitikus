'use client'

import { useState } from 'react'
import { type Locale } from '@/i18n/config'
import { getLandingTranslations } from '@/i18n/landing-translations'
import { LocaleSelector } from '@/app/(dashboard)/_components/LocaleSelector'
import { ThemeToggle } from '@/app/(dashboard)/_components/ThemeToggle'

interface LandingNavProps {
  locale: Locale
}

function DrumPicker({ options }: { options: { label: string; href: string }[] }) {
  const [idx, setIdx] = useState(0)
  const toggle = () => setIdx(i => (i + 1) % options.length)
  const current = options[idx]

  return (
    <div className="md:hidden flex items-center border border-input rounded-md overflow-hidden h-7 select-none">
      {/* Label — tap para navegar */}
      <a
        href={current?.href ?? '#'}
        className="flex-1 flex items-center px-2 text-xs font-medium whitespace-nowrap text-foreground h-full"
      >
        <span
          key={idx}
          className="animate-in fade-in slide-in-from-bottom-1 duration-150"
        >
          {current?.label}
        </span>
      </a>
      {/* Botón toggle — tap para cambiar opción */}
      <button
        type="button"
        onClick={toggle}
        className="flex items-center justify-center w-6 h-full border-l border-input hover:bg-muted/60 transition-colors shrink-0"
        aria-label="Cambiar opción"
      >
        <svg width="8" height="10" viewBox="0 0 8 10" className="fill-muted-foreground">
          <path d="M4 0L7 4H1z"/>
          <path d="M4 10L1 6h6z"/>
        </svg>
      </button>
    </div>
  )
}

export function LandingNav({ locale }: LandingNavProps) {
  const [open, setOpen] = useState(false)
  const t = getLandingTranslations(locale)
  const signIn = t.navSignIn
  const startFree = t.navStartFree
  const openMenu = locale === 'es' ? 'Abrir menú' : locale === 'de' ? 'Menü öffnen' : locale === 'fr' ? 'Ouvrir le menu' : 'Open menu'
  const closeMenu = locale === 'es' ? 'Cerrar menú' : locale === 'de' ? 'Menü schließen' : locale === 'fr' ? 'Fermer le menu' : 'Close menu'

  return (
    <div className="flex items-center gap-2">
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-4" aria-label="Navegación principal">
        <LocaleSelector currentLocale={locale} />
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

      {/* Drum picker — solo móvil, reemplaza los dos botones */}
      <DrumPicker options={[
        { label: signIn, href: '/sign-in' },
        { label: startFree, href: '/sign-up' },
      ]} />

      {/* CTA — solo desktop */}
      <a
        href="/sign-up"
        className="hidden md:inline-flex text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap"
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
            <LocaleSelector currentLocale={locale} />
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
          <a
            href="/sign-up"
            className="text-sm font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors text-center"
            onClick={() => setOpen(false)}
          >
            {startFree}
          </a>
        </div>
      )}
    </div>
  )
}
