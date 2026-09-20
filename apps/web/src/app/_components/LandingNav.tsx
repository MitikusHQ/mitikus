'use client'

import { useState, useRef } from 'react'
import { type Locale } from '@/i18n/config'
import { getLandingTranslations } from '@/i18n/landing-translations'
import { LocaleSelector } from '@/app/(dashboard)/_components/LocaleSelector'
import { ThemeToggle } from '@/app/(dashboard)/_components/ThemeToggle'

interface LandingNavProps {
  locale: Locale
}

function DrumPicker({ options }: { options: { label: string; href: string }[] }) {
  const [idx, setIdx] = useState(0)
  const touchStartY = useRef<number | null>(null)

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setIdx(i => (e.deltaY > 0 ? (i + 1) % options.length : (i - 1 + options.length) % options.length))
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0]?.clientY ?? null
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return
    const endY = e.changedTouches[0]?.clientY ?? touchStartY.current
    const diff = touchStartY.current - endY
    if (Math.abs(diff) > 10) {
      setIdx(i => (diff > 0 ? (i + 1) % options.length : (i - 1 + options.length) % options.length))
    } else {
      const href = options[idx]?.href
      if (href) window.location.href = href
    }
    touchStartY.current = null
  }

  const currentLabel = options[idx]?.label ?? ''

  return (
    <div
      className="md:hidden relative h-7 w-32 overflow-hidden border border-input rounded-md cursor-pointer select-none"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => { if (touchStartY.current === null) { const href = options[idx]?.href; if (href) window.location.href = href } }}
      role="button"
      aria-label={currentLabel}
    >
      {/* Chevrons hint */}
      <div className="absolute right-1.5 inset-y-0 flex flex-col justify-center gap-0 pointer-events-none z-10">
        <svg width="8" height="5" viewBox="0 0 8 5" className="text-muted-foreground/60 fill-current"><path d="M4 0L8 5H0z"/></svg>
        <svg width="8" height="5" viewBox="0 0 8 5" className="text-muted-foreground/60 fill-current mt-0.5"><path d="M4 5L0 0h8z"/></svg>
      </div>
      {/* Sliding labels */}
      <div
        className="flex flex-col transition-transform duration-200 ease-out"
        style={{ transform: `translateY(-${idx * 100}%)` }}
      >
        {options.map(o => (
          <div
            key={o.href}
            className="h-7 flex items-center px-2 pr-6 text-xs font-medium whitespace-nowrap text-foreground"
          >
            {o.label}
          </div>
        ))}
      </div>
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
