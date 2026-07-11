import type { Metadata } from 'next'
import type React from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { DemoRequestForm } from './_components/DemoRequestForm'
import { ThemeToggle } from './(dashboard)/_components/ThemeToggle'
import { LocaleSelector } from './(dashboard)/_components/LocaleSelector'
import { ScrollReveal } from './_components/ScrollReveal'
import { getLocale } from '@/i18n/locale'

// LANDING-001 — SEO específico de esta página (sobrescribe el genérico de layout.tsx)
export const metadata: Metadata = {
  title: 'MITIKUS — Auditorías IT en minutos, no en horas',
  description:
    'MITIKUS convierte vuestras auditorías técnicas, checklists e informes para clientes en procesos guiados por IA. Pensado para consultoras IT de 3 a 15 personas.',
  keywords: [
    'auditoría IT', 'consultoría informática', 'software para consultoras IT',
    'automatizar auditorías', 'checklist seguridad IT', 'informes técnicos IA',
  ],
  openGraph: {
    title: 'MITIKUS — Auditorías IT en minutos, no en horas',
    description:
      'Convierte cada auditoría, checklist e informe para tus clientes en un proceso guiado por IA. Para consultoras IT de 3 a 15 personas.',
    type: 'website',
    locale: 'es_ES',
    url: 'https://www.mitikus.com/',
    siteName: 'MITIKUS',
    images: [{ url: 'https://www.mitikus.com/api/og', width: 1200, height: 630, alt: 'MITIKUS — Auditorías IT en minutos, no en horas' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MITIKUS — Auditorías IT en minutos, no en horas',
    description: 'Convierte cada auditoría, checklist e informe para tus clientes en un proceso guiado por IA.',
    images: ['https://www.mitikus.com/api/og'],
  },
  alternates: {
    canonical: 'https://www.mitikus.com/',
  },
}

export default async function HomePage() {
  const { userId } = await auth()
  const locale = await getLocale()

  if (userId) {
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { org: { include: { workspaces: { orderBy: { createdAt: 'asc' }, take: 1 } } } },
    })
    const firstWorkspace = user?.org?.workspaces?.[0]
    redirect(firstWorkspace ? `/workspace/${firstWorkspace.id}` : '/onboarding')
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'MITIKUS',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Plataforma de IA que convierte auditorías técnicas, checklists e informes de consultoras IT en procesos guiados, de objetivo a entrega.',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: '39',
      highPrice: '349',
    },
  }

  return (
    <main className="min-h-screen bg-background">
      <ScrollReveal />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── NAV mínima ── */}
      <header className="border-b">
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
          <div className="flex items-center gap-4">
            <LocaleSelector currentLocale={locale} />
            <ThemeToggle />
            <a href="/sign-in" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Iniciar sesión
            </a>
            <a
              href="/sign-in"
              className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              Empezar gratis
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO (Fase 2) ── */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Tus auditorías IT, en un momento
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          MITIKUS convierte cada auditoría, checklist e informe que haces para tus clientes
          en un proceso guiado por IA — pensado para pasar de horas de redacción a minutos de revisión.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          <a
            href="/sign-in"
            className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Empezar gratis — 15 días
          </a>
          <a
            href="#como-funciona"
            className="rounded-md border border-input bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
          >
            Ver cómo funciona
          </a>
        </div>

        {/* Visual del Hero: comparación de tiempo — dato, no captura de pantalla */}
        <div className="rounded-xl border bg-card p-6 max-w-md mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Antes</p>
              <p className="text-2xl font-bold font-mono">~3h</p>
              <p className="text-xs text-muted-foreground">redactando el informe a mano</p>
            </div>
            <span className="text-2xl text-muted-foreground/40">→</span>
            <div>
              <p className="text-xs text-muted-foreground">Con MITIKUS</p>
              <p className="text-2xl font-bold font-mono text-primary">~20min</p>
              <p className="text-xs text-muted-foreground">revisando lo que ya generó la IA</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── EL PROBLEMA (Fase 3) ── */}
      <section className="bg-muted/30 border-y">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-bold text-center mb-2">¿A qué te suena?</h2>
          <p className="text-center text-muted-foreground mb-10">
            No es un problema de talento. Es un problema de tiempo.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <ProblemItem
              title="Horas perdidas"
              text="Cada auditoría a un cliente puede llevarte 3-4 horas solo en redactar el informe final."
            />
            <ProblemItem
              title="Informes repetitivos"
              text="Gran parte de lo que escribes ya lo habías escrito antes, para otro cliente, casi con las mismas palabras."
            />
            <ProblemItem
              title="Documentación manual"
              text="Plantillas de Word que nunca están del todo actualizadas, copiando y pegando entre proyectos."
            />
            <ProblemItem
              title="Procesos desorganizados"
              text="Cada consultor hace las auditorías un poco a su manera — la calidad depende de quién la haga."
            />
            <ProblemItem
              title="Conocimiento disperso"
              text="Lo que aprendiste en la auditoría del cliente A no ayuda en nada con el cliente B."
            />
          </div>
        </div>
      </section>

      {/* ── LA SOLUCIÓN (Fase 4) ── */}
      <section className="max-w-3xl mx-auto px-6 py-14 text-center">
        <h2 className="text-2xl font-bold mb-4">Lo mismo que haces hoy, sin empezar de cero cada vez</h2>
        <p className="text-muted-foreground leading-relaxed">
          MITIKUS convierte cada objetivo —auditar a un cliente, hacer un checklist de seguridad,
          preparar un informe técnico— en un proceso guiado: defines qué necesitas, la IA genera el
          contenido técnico, tú revisas y entregas. Sin reinventar la rueda en cada cliente nuevo.
        </p>
      </section>

      {/* ── CÓMO FUNCIONA (Fase 5) — pasos con mockups de app ── */}
      <section id="como-funciona" className="bg-muted/30 border-y">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-2">¿Cómo funciona?</h2>
          <p className="text-center text-muted-foreground mb-14">De objetivo a informe entregable, en cuatro pasos.</p>

          <div className="space-y-20">
            <HowItWorksStep
              n={1}
              title="Le cuentas a MITIKUS en qué trabajas"
              text="Nada de configuración. Solo describes tu consultora — sector, tamaño, tipo de clientes — y MITIKUS aprende. En segundos conoce tu contexto y ya puede ayudarte."
              mockup={<MockupCopilot />}
            />
            <HowItWorksStep
              n={2}
              title="Pides lo que necesitas, en lenguaje normal"
              text='Dices "quiero hacer una auditoría de seguridad para un cliente del retail" y MITIKUS te propone tres estrategias distintas — rápida, completa o centrada en normativa. Eliges y en segundos tienes una misión lista.'
              mockup={<MockupStrategies />}
              reverse
            />
            <HowItWorksStep
              n={3}
              title="Ejecutas cada paso con una herramienta IA"
              text="Cada paso de la misión tiene su herramienta. Rellenas los datos del cliente, le das a ejecutar, y la IA genera el análisis técnico completo: vulnerabilidades, riesgos, recomendaciones. En menos de un minuto."
              mockup={<MockupTool />}
            />
            <HowItWorksStep
              n={4}
              title="El informe sale listo para el cliente"
              text="No es un borrador. Es un informe estructurado que en la mayoría de casos solo necesita quince minutos de revisión antes de enviarlo. Y MITIKUS recuerda lo que aprendió para la próxima vez."
              mockup={<MockupResult />}
              reverse
            />
          </div>
        </div>
      </section>

      {/* ── BENEFICIOS (Fase 6) ── */}
      <section className="max-w-4xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-bold text-center mb-10">¿Qué cambia para ti?</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <BenefitItem title="Menos tiempo" text="De horas de redacción a minutos de revisión por auditoría." />
          <BenefitItem title="Más auditorías" text="Puedes atender más clientes sin ampliar el equipo." />
          <BenefitItem title="Más consistencia" text="Toda auditoría sigue la misma calidad, la haga quien la haga." />
          <BenefitItem title="Menos errores" text="Nada se olvida — cada misión tiene sus pasos definidos de antemano." />
          <BenefitItem title="Conocimiento reutilizable" text="Lo aprendido en un cliente ayuda en el siguiente, automáticamente." />
          <BenefitItem title="Sin instalar nada" text="Funciona desde el navegador — empiezas el mismo día." />
        </div>
      </section>

      {/* ── PRECIOS (Fase 8) ── */}
      <section className="bg-muted/30 border-y">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-bold text-center mb-2">¿Precios?</h2>
          <p className="text-center text-muted-foreground mb-10">Sin letra pequeña. Cancelas cuando quieras.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <PriceCard
              name="Evaluación Profesional" price="Gratis" period="15 días"
              forWhom="Para probar con una auditoría real antes de decidir."
              cta="Empezar gratis" ctaHref="/sign-in"
            />
            <PriceCard
              name="Starter" price="39€" period="/mes"
              forWhom="Consultores autónomos o equipos de 1-2 personas."
              cta="Contratar" ctaHref="/sign-in"
            />
            <PriceCard
              name="Professional" price="149€" period="/mes"
              forWhom="Consultoras de 3 a 15 personas — tu tamaño."
              cta="Contratar" ctaHref="/sign-in"
              highlighted
            />
            <PriceCard
              name="Business" price="349€" period="/mes"
              forWhom="Consultoras en crecimiento, varios equipos o sedes."
              cta="Contratar" ctaHref="/sign-in"
            />
            <PriceCard
              name="Enterprise" price="A medida" period=""
              forWhom="Integraciones, SSO o condiciones específicas."
              cta="Hablar con nosotros" ctaHref="/sign-in"
            />
          </div>
        </div>
      </section>

      {/* ── FAQ (Fase 9) ── */}
      <section className="max-w-3xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-bold text-center mb-10">Preguntas frecuentes</h2>
        <div className="space-y-5">
          <FaqItem
            q="¿Necesito instalar algo?"
            a="No. Todo funciona desde el navegador, sin instalar nada."
          />
          <FaqItem
            q="¿Mis datos están seguros?"
            a="Cada cliente y cada auditoría se guardan de forma aislada — nadie fuera de tu equipo puede verlos."
          />
          <FaqItem
            q="¿Puedo cancelar cuando quiera?"
            a="Sí, desde el propio panel, sin llamadas ni letra pequeña. Sigue activo hasta el final del periodo ya pagado."
          />
          <FaqItem
            q="¿Sirve para una consultora pequeña?"
            a="Es exactamente para quién lo hemos diseñado — equipos de 3 a 15 personas, incluso autónomos."
          />
          <FaqItem
            q="¿Puedo probarlo gratis?"
            a="Sí, 15 días con una auditoría real tuya, sin tarjeta de crédito."
          />
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="bg-muted/30 border-t">
        <div className="max-w-xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">¿Listo para empezar?</h2>
          <p className="text-muted-foreground mb-8">
            15 días gratis, sin tarjeta de crédito. Tu primera auditoría lista en minutos.
          </p>
          <a
            href="/sign-in"
            className="inline-block rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Empezar gratis
          </a>
        </div>
      </section>

      <footer className="border-t">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>MITIKUS — hecho para consultoras IT que ya no quieren empezar cada auditoría de cero.</span>
          <span>© {new Date().getFullYear()} MITIKUS. Todos los derechos reservados.</span>
        </div>
      </footer>
    </main>
  )
}

function ProblemItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="font-semibold text-sm mb-1">{title}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
    </div>
  )
}

function StepItem({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mb-3">
        {n}
      </div>
      <p className="font-semibold text-sm mb-1">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  )
}

function HowItWorksStep({
  n, title, text, mockup, reverse,
}: {
  n: number; title: string; text: string; mockup: React.ReactNode; reverse?: boolean
}) {
  return (
    <div className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-10 items-center`}>
      <div className="flex-1 max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
            {n}
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-muted-foreground leading-relaxed text-sm">{text}</p>
      </div>
      <div className="flex-1 w-full max-w-lg">
        {mockup}
      </div>
    </div>
  )
}

function MockupCopilot() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <div className="bg-muted/50 border-b px-4 py-2.5 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
        <span className="text-xs text-muted-foreground ml-2">Copilot — MITIKUS</span>
      </div>
      <div className="flex gap-0 min-h-[260px]">
        <div className="w-36 border-r p-3 space-y-3 flex-shrink-0">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Empresa</div>
          <div className="space-y-2">
            <div className="text-[11px]"><span className="text-muted-foreground">Sector</span><br /><span className="font-medium">Consultoría IT</span></div>
            <div className="text-[11px]"><span className="text-muted-foreground">País</span><br /><span className="font-medium">España</span></div>
            <div className="text-[11px]"><span className="text-muted-foreground">Tamaño</span><br /><span className="font-medium">8 personas</span></div>
          </div>
        </div>
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground max-w-[85%]">
              ¡Hola! Cuéntame en qué trabaja tu consultora y empiezo a ayudarte.
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-xs ml-auto max-w-[85%]">
              Somos una consultora IT de 8 personas, clientes pymes industriales, Madrid.
            </div>
            <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground max-w-[85%]">
              Perfecto. Ya conozco tu contexto. ¿En qué quieres trabajar hoy?
            </div>
          </div>
          <div className="border rounded-lg p-2 flex items-center gap-2 mt-3">
            <span className="text-xs text-muted-foreground flex-1">Escribe tu objetivo...</span>
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6M6 3l2 2-2 2" stroke="white" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MockupStrategies() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <div className="bg-muted/50 border-b px-4 py-2.5 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
        <span className="text-xs text-muted-foreground ml-2">Copilot — estrategias</span>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground">He analizado tu objetivo. Elige la estrategia que mejor se adapte a lo que necesitas.</p>
        <div className="rounded-lg border p-3 space-y-1 hover:border-primary/50 transition-colors cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Auditoría rápida</span>
            <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">3–5 días · Bajo riesgo</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Revisión de puntos críticos. Ideal para una primera toma de contacto.</p>
        </div>
        <div className="rounded-lg border-2 border-primary p-3 space-y-1 cursor-pointer bg-primary/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Auditoría completa</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">✓ Recomendada</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Todas las capas de seguridad. Informe detallado para el cliente.</p>
        </div>
        <div className="rounded-lg border p-3 space-y-1 hover:border-primary/50 transition-colors cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Orientada a normativa</span>
            <span className="text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full">ISO 27001 · ENS</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Foco en cumplimiento regulatorio. Incluye checklist de certificación.</p>
        </div>
      </div>
    </div>
  )
}

function MockupTool() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <div className="bg-muted/50 border-b px-4 py-2.5 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
        <span className="text-xs text-muted-foreground ml-2">IT Security Audit — Paso 1 de 8</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs font-semibold">Datos del cliente</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Cliente', 'Industrias Pérez S.L.'],
            ['Sector', 'Industrial / Manufactura'],
            ['País', 'España'],
            ['Infraestructura', 'Servidor propio + nube'],
          ].map(([label, val]) => (
            <div key={label} className="space-y-1">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <div className="border rounded px-2 py-1.5 text-[11px] bg-background">{val}</div>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">La IA generará el análisis completo</span>
          <div className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-md">
            Ejecutar
          </div>
        </div>
      </div>
    </div>
  )
}

function MockupResult() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <div className="bg-muted/50 border-b px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
          <span className="text-xs text-muted-foreground ml-2">Resultado — Auditoría de seguridad</span>
        </div>
        <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">✓ Completado</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Vulnerabilidades detectadas</p>
          {[
            { level: 'Alta', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', text: 'Acceso remoto sin MFA en 3 servidores críticos.' },
            { level: 'Media', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', text: 'Política de contraseñas desactualizada (< 90 días).' },
            { level: 'Baja', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', text: 'Logs de acceso sin retención mínima de 6 meses.' },
          ].map((item) => (
            <div key={item.text} className="flex items-start gap-2">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${item.color}`}>{item.level}</span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">12 recomendaciones · listo para entregar</span>
          <div className="border text-xs px-3 py-1 rounded-md text-muted-foreground hover:bg-muted cursor-pointer">
            Exportar
          </div>
        </div>
      </div>
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

function PriceCard({
  name, price, period, forWhom, cta, ctaHref, highlighted,
}: {
  name: string; price: string; period: string; forWhom: string; cta?: string; ctaHref?: string; highlighted?: boolean
}) {
  return (
    <div className={`rounded-lg border p-5 flex flex-col ${highlighted ? 'border-primary border-2 bg-card' : 'bg-card'}`}>
      {highlighted && (
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-2">Recomendado</span>
      )}
      <p className="font-semibold text-sm">{name}</p>
      <p className="text-xl font-bold mt-1">{price}</p>
      {period && <p className="text-xs text-muted-foreground mt-0.5">{period}</p>}
      <p className="text-xs text-muted-foreground mt-2 mb-4 flex-1">{forWhom}</p>
      {cta && ctaHref && <a
        href={ctaHref}
        className={`text-xs font-medium text-center rounded-md px-3 py-2 transition-colors ${
          highlighted
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'border border-input hover:bg-accent'
        }`}
      >
        {cta}
      </a>}
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
