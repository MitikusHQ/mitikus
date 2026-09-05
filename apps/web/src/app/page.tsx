export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import type React from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { ScrollReveal } from './_components/ScrollReveal'
import { CookieBanner } from './_components/CookieBanner'
import { getLocale } from '@/i18n/locale'
import { PricingSection } from './_components/PricingSection'
import { LandingNav } from './_components/LandingNav'
import { getLandingTranslations } from '@/i18n/landing-translations'

export const metadata: Metadata = {
  title: 'MITIKUS — Tu espacio de trabajo, todo en uno',
  description:
    'Propuestas, contratos con firma digital, facturas y presentaciones para profesionales y equipos — todo en un solo lugar. Prueba gratis 15 días.',
  keywords: [
    'gestión documental profesionales', 'contratos firma digital pymes',
    'crear propuestas comerciales IA', 'facturación online pymes',
    'presentaciones clientes', 'software gestión documentos cliente',
  ],
  openGraph: {
    title: 'MITIKUS — Tu espacio de trabajo, todo en uno',
    description:
      'Propuestas, contratos con firma digital, facturas y presentaciones — para profesionales y equipos que quieren entregar más rápido.',
    type: 'website',
    locale: 'es_ES',
    url: 'https://www.mitikus.com/',
    siteName: 'MITIKUS',
    images: [{ url: 'https://www.mitikus.com/api/og', width: 1200, height: 630, alt: 'MITIKUS — El espacio de trabajo completo para tu equipo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MITIKUS — Tu espacio de trabajo, todo en uno',
    description: 'Documentos, contratos, hojas de cálculo, presentaciones y IA en un solo lugar.',
    images: ['https://www.mitikus.com/api/og'],
  },
  alternates: {
    canonical: 'https://www.mitikus.com/',
  },
}

export default async function HomePage() {
  const { userId } = await auth()
  const locale = await getLocale()
  const cookieStore = await cookies()
  const hasConsentCookie = !!cookieStore.get('mitikus-cookie-consent')

  if (userId) {
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { org: { include: { workspaces: { orderBy: { createdAt: 'asc' }, take: 1 } } } },
    })
    const firstWorkspace = user?.org?.workspaces?.[0]
    redirect(firstWorkspace ? `/workspace/${firstWorkspace.id}` : '/onboarding')
  }

  const jsonLdApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'MITIKUS',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Espacio de trabajo para equipos: documentos, contratos con firma digital, hojas de cálculo, presentaciones, cuadernos de investigación y flujos de trabajo con IA.',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: '29',
      highPrice: '349',
    },
  }

  const jsonLdOrg = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MITIKUS',
    url: 'https://www.mitikus.com',
    logo: 'https://www.mitikus.com/favicon.svg',
    description: 'Hub de productividad para profesionales, pymes y equipos. Gestión de clientes, documentos, facturas y contratos en un único lugar.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: 'Spanish',
      url: 'https://www.mitikus.com/sign-up',
    },
  }

  const jsonLdWebSite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MITIKUS',
    url: 'https://www.mitikus.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.mitikus.com/sign-up',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  const landing = getLandingTranslations(locale)

  return (
    <main className="min-h-screen bg-background">
      <ScrollReveal />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }} />

      {/* ── NAV ── */}
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur-sm relative">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="44" height="44" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <linearGradient id="nlg" x1="10" y1="10" x2="190" y2="190" gradientUnits="userSpaceOnUse">
                  <stop offset="0%"   stopColor="#FFD040"/>
                  <stop offset="28%"  stopColor="#FF7028"/>
                  <stop offset="50%"  stopColor="#FF2878"/>
                  <stop offset="72%"  stopColor="#8B28FF"/>
                  <stop offset="100%" stopColor="#1820B8"/>
                </linearGradient>
                <clipPath id="nlc"><circle cx="100" cy="100" r="87"/></clipPath>
              </defs>
              <circle cx="100" cy="100" r="90" fill="none" stroke="url(#nlg)" strokeWidth="5.5"/>
              <g clipPath="url(#nlc)">
                <polygon points="-10,0   192,95  192,100 -10,98"  fill="url(#nlg)"/>
                <polygon points="-10,102 192,100 192,105 -10,200" fill="url(#nlg)"/>
              </g>
            </svg>
            <span className="font-bold tracking-widest text-base" style={{ background: 'linear-gradient(100deg,#FFD040,#FF7028,#FF2878,#8B28FF,#1820B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              MITIKUS
            </span>
          </div>
          <LandingNav locale={locale} />
        </div>
      </header>

      {/* ── HERO ── */}
      <section data-no-reveal className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 leading-tight">
          {landing.heroLine1}<br className="hidden sm:block" /> {landing.heroLine2}
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          {landing.heroSubtitle}
        </p>
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          <a
            href="/sign-up"
            className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            {landing.startTrial}
          </a>
          <a
            href="#precios"
            className="rounded-md border border-input bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
          >
            {landing.viewPricing}
          </a>
        </div>

        {/* Hero visual — Mi Office en miniatura */}
        <MockupOfficeHub locale={locale} />
      </section>

      {/* ── EL PROBLEMA ── */}
      <section className="bg-muted/30 border-y">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-bold text-center mb-2">{landing.problemEyebrow}</h2>
          <p className="text-center text-muted-foreground mb-10">
            {landing.problemSubtitle}
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {landing.problemItems.map((item) => (
              <ProblemItem key={item.title} title={item.title} text={item.text} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CASOS DE USO ── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center mb-3">
          {landing.useCasesEyebrow}
        </p>
        <h2 className="text-2xl font-bold text-center mb-2">{landing.useCasesTitle}</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          {landing.useCasesSubtitle}
        </p>
        <div className="space-y-4">
          {landing.useCases.map((uc) => (
            <div key={uc.n} className="rounded-xl border bg-card p-5 flex flex-col sm:flex-row gap-5 items-start">
              <div className="shrink-0 flex items-center gap-3 sm:flex-col sm:items-center sm:gap-1 sm:w-16">
                <span className="text-2xl">{uc.icon}</span>
                <span className="text-xs font-semibold text-muted-foreground/50">{uc.n}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm mb-1">{uc.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{uc.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  {uc.result}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HERRAMIENTAS (Mi Office) ── */}
      <section id="herramientas" className="bg-muted/30 border-y">
        <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-2">{landing.toolsTitle}</h2>
        <p className="text-center text-muted-foreground mb-12">
          {landing.toolsSubtitle}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {landing.tools.map((tool) => (
            <ToolCard key={tool.title} icon={tool.icon} title={tool.title} text={tool.text} />
          ))}
        </div>
        </div>
      </section>

      {/* ── IA CON ARKOS ── */}
      <section className="bg-muted/30 border-y">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                {landing.arkosEyebrow}
              </p>
              <h2 className="text-2xl font-bold mb-4">{landing.arkosTitle}</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {landing.arkosBody}
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {landing.arkosBullets.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 w-full max-w-md">
              <MockupArkos />
            </div>
          </div>
        </div>
      </section>

      {/* ── EQUIPO ── */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row-reverse gap-12 items-center">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              {landing.teamEyebrow}
            </p>
            <h2 className="text-2xl font-bold mb-4">{landing.teamTitle}</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {landing.teamBody}
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {landing.teamBullets.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 w-full max-w-md">
            <MockupTeam />
          </div>
        </div>
      </section>

      {/* ── BENEFICIOS ── */}
      <section className="bg-muted/30 border-y">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-bold text-center mb-10">{landing.benefitsTitle}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {landing.benefits.map((b) => (
              <BenefitItem key={b.title} title={b.title} text={b.text} />
            ))}
          </div>
        </div>
      </section>


      {/* ── PARA QUIÉN ── */}
      <section className="max-w-5xl mx-auto px-6 py-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center mb-3">
          {landing.forWhomEyebrow}
        </p>
        <h2 className="text-2xl font-bold text-center mb-10">{landing.forWhomTitle}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {landing.sectors.map((item) => (
            <div key={item.sector} className="rounded-xl border bg-card p-5">
              <p className="font-semibold text-sm mb-1">{item.sector}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── VS COMPETENCIA ── */}
      <section className="bg-muted/30 border-y">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center mb-3">
            {landing.comparisonEyebrow}
          </p>
          <h2 className="text-2xl font-bold text-center mb-3">{landing.comparisonTitle}</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
            {landing.comparisonSubtitle}
          </p>
          <div className="space-y-4">
            {landing.comparison.map((item) => (
              <div key={item.them} className="rounded-xl border bg-card p-5 grid sm:grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">{item.them}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.issue}</p>
                </div>
                <div className="border-l pl-5 hidden sm:block">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">{landing.withMitikus}</p>
                  <p className="text-sm leading-relaxed">{item.us}</p>
                </div>
                <div className="sm:hidden border-t pt-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">{landing.withMitikus}</p>
                  <p className="text-sm leading-relaxed">{item.us}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section id="precios">
        <PricingSection />
      </section>

      {/* ── FAQ ── */}
      <section className="bg-muted/30 border-y">
        <div className="max-w-3xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-bold text-center mb-10">{landing.faqTitle}</h2>
          <div className="space-y-5">
            {landing.faqItems.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>


      {/* ── CTA FINAL ── */}
      <section>
        <div className="max-w-xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">{landing.ctaTitle}</h2>
          <p className="text-muted-foreground mb-8">
            {landing.ctaSubtitle}
          </p>
          <a
            href="/sign-up"
            className="inline-block rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            {landing.ctaButton}
          </a>
        </div>
      </section>

      <footer className="border-t">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-4 text-xs text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <span className="flex items-center gap-2 shrink-0">
              <svg width="20" height="20" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <defs>
                  <linearGradient id="flg" x1="10" y1="10" x2="190" y2="190" gradientUnits="userSpaceOnUse">
                    <stop offset="0%"   stopColor="#FFD040"/>
                    <stop offset="28%"  stopColor="#FF7028"/>
                    <stop offset="50%"  stopColor="#FF2878"/>
                    <stop offset="72%"  stopColor="#8B28FF"/>
                    <stop offset="100%" stopColor="#1820B8"/>
                  </linearGradient>
                  <clipPath id="flc"><circle cx="100" cy="100" r="87"/></clipPath>
                </defs>
                <circle cx="100" cy="100" r="90" fill="none" stroke="url(#flg)" strokeWidth="5.5"/>
                <g clipPath="url(#flc)">
                  <polygon points="-10,0   192,95  192,100 -10,98"  fill="url(#flg)"/>
                  <polygon points="-10,102 192,100 192,105 -10,200" fill="url(#flg)"/>
                </g>
              </svg>
              MITIKUS — {landing.footerTagline}
            </span>
            <div className="flex flex-wrap items-center gap-3 justify-center">
              <a href="/privacy" className="hover:text-foreground transition-colors">{landing.footerPrivacy}</a>
              <span>·</span>
              <a href="/terms" className="hover:text-foreground transition-colors">{landing.footerTerms}</a>
              <span>·</span>
              <a href="/dpa" className="hover:text-foreground transition-colors">{landing.footerDpa}</a>
            </div>
          </div>
          <p className="text-center">© {new Date().getFullYear()} MITIKUS</p>
        </div>
      </footer>
      <CookieBanner initialShow={!hasConsentCookie} />
    </main>
  )
}

// ── Mockup components ─────────────────────────────────────────────────────────

function MockupOfficeHub({ locale }: { locale: string }) {
  const t = getLandingTranslations(locale as import('@/i18n/config').Locale)
  const tools = t.tools.map((tool) => ({ icon: tool.icon, label: tool.title }))
  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm max-w-lg mx-auto">
      <div className="bg-muted/50 border-b px-4 py-2.5 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
        <span className="text-xs text-muted-foreground ml-2">MITIKUS</span>
      </div>
      <div className="p-5">
        <p className="text-[11px] text-muted-foreground mb-4">{t.toolsSubtitle}</p>
        <div className="grid grid-cols-3 gap-3">
          {tools.map((tool) => (
            <div key={tool.label} className="rounded-lg border bg-background p-3 flex flex-col items-center gap-1.5 hover:border-primary/40 transition-colors cursor-pointer">
              <span className="text-xl">{tool.icon}</span>
              <span className="text-[11px] font-medium text-center">{tool.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" className="text-primary"/><path d="M4 6l1.5 1.5L8 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-primary"/></svg>
          </div>
          <span className="text-[11px] text-foreground/70">{t.arkosTitle}</span>
        </div>
      </div>
    </div>
  )
}

function MockupArkos() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <div className="bg-muted/50 border-b px-4 py-2.5 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
        <span className="text-xs text-muted-foreground ml-2">Arkos — asistente IA</span>
      </div>
      <div className="p-4 flex flex-col gap-3 min-h-[220px]">
        <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground max-w-[88%]">
          Cuéntame en qué trabaja tu empresa. Puedo ayudarte a redactar documentos, preparar propuestas o sintetizar información de tus proyectos.
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-xs ml-auto max-w-[88%]">
          Somos una agencia de diseño. Necesito una propuesta de servicios para un cliente nuevo del sector retail.
        </div>
        <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground max-w-[88%]">
          Perfecto. He preparado un borrador de propuesta con servicios, cronograma y condiciones. ¿Quieres que ajuste el tono o añada apartados específicos?
        </div>
        <div className="mt-auto border rounded-lg p-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex-1">Escribe tu objetivo...</span>
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center" aria-hidden="true">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6M6 3l2 2-2 2" stroke="white" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </div>
        </div>
      </div>
    </div>
  )
}

function MockupTeam() {
  const members = [
    { name: 'Laura García', role: 'Propietaria', initials: 'LG', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
    { name: 'Marcos Ruiz', role: 'Administrador', initials: 'MR', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    { name: 'Ana Pérez', role: 'Editora', initials: 'AP', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    { name: 'Invitación pendiente', role: 'Pendiente', initials: '···', color: 'bg-muted text-muted-foreground' },
  ]
  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <div className="bg-muted/50 border-b px-4 py-2.5 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
        <span className="text-xs text-muted-foreground ml-2">Organización — equipo</span>
      </div>
      <div className="p-4 space-y-2.5">
        {members.map((m) => (
          <div key={m.name} className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${m.color}`}>
              {m.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{m.name}</p>
              <p className="text-[10px] text-muted-foreground">{m.role}</p>
            </div>
          </div>
        ))}
        <div className="pt-1 border-t">
          <div className="flex items-center gap-2 rounded-md border border-dashed p-2 cursor-pointer hover:border-primary/40 transition-colors">
            <div className="w-7 h-7 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2v6M2 5h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-muted-foreground"/></svg>
            </div>
            <span className="text-xs text-muted-foreground">Invitar a alguien</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Utility components ────────────────────────────────────────────────────────

function ProblemItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="font-semibold text-sm mb-1">{title}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
    </div>
  )
}

function ToolCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="text-2xl mb-3">{icon}</div>
      <p className="font-semibold text-sm mb-1">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  )
}

function BenefitItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="font-semibold text-sm mb-1">✓ {title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  )
}


function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="font-semibold text-sm mb-1">{q}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
    </div>
  )
}

function TestimonialCard({
  quote, name, role, company, initials, featured,
}: {
  quote: string; name: string; role: string; company: string; initials: string; featured?: boolean
}) {
  return (
    <div className={`rounded-xl border p-6 flex flex-col gap-4 ${featured ? 'border-primary/40 bg-primary/5 shadow-sm' : 'bg-card'}`}>
      <p className="text-sm leading-relaxed text-foreground/80 flex-1">
        <span className="text-primary font-bold text-lg leading-none mr-1">"</span>
        {quote}
        <span className="text-primary font-bold text-lg leading-none ml-1">"</span>
      </p>
      <div className="flex items-center gap-3 pt-2 border-t border-border/60">
        <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{name}</p>
          <p className="text-xs text-muted-foreground">{role} · {company}</p>
        </div>
      </div>
    </div>
  )
}
