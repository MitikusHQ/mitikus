import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { DemoRequestForm } from './_components/DemoRequestForm'

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
  },
}

export default async function HomePage() {
  const { userId } = await auth()

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── NAV mínima ── */}
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-semibold">MITIKUS</span>
          <div className="flex items-center gap-4">
            <a href="/sign-in" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Iniciar sesión
            </a>
            <a
              href="#demo"
              className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              Solicitar demo
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO (Fase 2) ── */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Vuestras auditorías IT, en una fracción del tiempo
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          MITIKUS convierte cada auditoría, checklist e informe que hacéis para vuestros clientes
          en un proceso guiado por IA — pensado para pasar de horas de redacción a minutos de revisión.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          <a
            href="#demo"
            className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Solicitar demo de 20 minutos
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
        <p className="text-xs text-muted-foreground mt-4">
          Para consultoras IT boutique de 3 a 15 personas — no para grandes departamentos IT.
        </p>
      </section>

      {/* ── EL PROBLEMA (Fase 3) ── */}
      <section className="bg-muted/30 border-y">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-bold text-center mb-2">¿Reconocéis esto?</h2>
          <p className="text-center text-muted-foreground mb-10">
            No es un problema de talento. Es un problema de tiempo.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <ProblemItem
              title="Horas perdidas"
              text="Cada auditoría a un cliente puede llevaros 3-4 horas solo en redactar el informe final."
            />
            <ProblemItem
              title="Informes repetitivos"
              text="Gran parte de lo que escribís ya lo habíais escrito antes, para otro cliente, casi con las mismas palabras."
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
              text="Lo que aprendisteis en la auditoría del cliente A no ayuda en nada con el cliente B."
            />
          </div>
        </div>
      </section>

      {/* ── LA SOLUCIÓN (Fase 4) ── */}
      <section className="max-w-3xl mx-auto px-6 py-14 text-center">
        <h2 className="text-2xl font-bold mb-4">Lo mismo que hacéis hoy, sin empezar de cero cada vez</h2>
        <p className="text-muted-foreground leading-relaxed">
          MITIKUS convierte cada objetivo —auditar a un cliente, hacer un checklist de seguridad,
          preparar un informe técnico— en un proceso guiado: definís qué necesitáis, la IA genera el
          contenido técnico, vuestro equipo revisa y entrega. Sin reinventar la rueda en cada cliente
          nuevo.
        </p>
      </section>

      {/* ── CÓMO FUNCIONA (Fase 5) — diagrama de pasos, sin capturas ── */}
      <section id="como-funciona" className="bg-muted/30 border-y">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-bold text-center mb-2">Cómo funciona</h2>
          <p className="text-center text-muted-foreground mb-10">De un objetivo a un informe entregable, en seis pasos.</p>
          <div className="grid sm:grid-cols-3 gap-5">
            <StepItem n={1} title="Cliente" text="Tenéis un cliente que necesita una auditoría, un checklist o un informe." />
            <StepItem n={2} title="Se lo contáis" text="Le explicáis a nuestro asistente qué necesitáis, en lenguaje normal." />
            <StepItem n={3} title="Se convierte en pasos" text="Se genera automáticamente una lista clara: qué hacer, en qué orden, con qué herramienta." />
            <StepItem n={4} title="Herramienta IA" text="Cada paso usa una herramienta con IA que ya conoce el contexto de ese cliente." />
            <StepItem n={5} title="Resultado" text="El contenido técnico se genera en minutos: hallazgos, riesgos, recomendaciones." />
            <StepItem n={6} title="Informe" text="Revisáis, ajustáis el tono si hace falta, y lo entregáis a vuestro cliente." />
          </div>
        </div>
      </section>

      {/* ── BENEFICIOS (Fase 6) ── */}
      <section className="max-w-4xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-bold text-center mb-10">Lo que cambia para vuestro equipo</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <BenefitItem title="Menos tiempo" text="De horas de redacción a minutos de revisión por auditoría." />
          <BenefitItem title="Más auditorías" text="El mismo equipo puede atender más clientes sin contratar." />
          <BenefitItem title="Más consistencia" text="Toda auditoría sigue la misma calidad, la haga quien la haga." />
          <BenefitItem title="Menos errores" text="Nada se olvida — cada misión tiene sus pasos definidos de antemano." />
          <BenefitItem title="Conocimiento reutilizable" text="Lo aprendido en un cliente ayuda en el siguiente, automáticamente." />
          <BenefitItem title="Sin instalar nada" text="Funciona desde el navegador — vuestro equipo empieza el mismo día." />
        </div>
      </section>

      {/* ── PRECIOS (Fase 8) ── */}
      <section className="bg-muted/30 border-y">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-bold text-center mb-2">Precios</h2>
          <p className="text-center text-muted-foreground mb-10">Sin letra pequeña. Cancelas cuando quieras.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <PriceCard
              name="Evaluación Profesional" price="Gratis" period="15 días"
              forWhom="Para probar con una auditoría real antes de decidir."
              cta="Empezar gratis" ctaHref="#demo"
            />
            <PriceCard
              name="Starter" price="39€" period="/mes"
              forWhom="Consultores autónomos o equipos de 1-2 personas."
              cta="Solicitar demo" ctaHref="#demo"
            />
            <PriceCard
              name="Professional" price="149€" period="/mes"
              forWhom="Consultoras de 3 a 15 personas — vuestro tamaño."
              cta="Solicitar demo" ctaHref="#demo"
              highlighted
            />
            <PriceCard
              name="Business" price="349€" period="/mes"
              forWhom="Consultoras en crecimiento, varios equipos o sedes."
              cta="Solicitar demo" ctaHref="#demo"
            />
            <PriceCard
              name="Enterprise" price="A medida" period=""
              forWhom="Integraciones, SSO o condiciones específicas."
              cta="Hablar con nosotros" ctaHref="#demo"
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
            a="No. Todo funciona desde el navegador, sin instalar nada en vuestros equipos."
          />
          <FaqItem
            q="¿Mis datos están seguros?"
            a="Cada cliente y cada auditoría se guardan de forma aislada por organización — nadie fuera de vuestro equipo puede verlos."
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
            a="Sí, 15 días con una auditoría real vuestra, sin tarjeta de crédito."
          />
        </div>
      </section>

      {/* ── CTA FINAL / DEMO (Fase 10) ── */}
      <section id="demo" className="bg-muted/30 border-t">
        <div className="max-w-xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-2">¿Hablamos de vuestra próxima auditoría?</h2>
          <p className="text-center text-muted-foreground mb-8">
            20 minutos, sin presentaciones largas. Nos contáis cómo trabajáis hoy y os enseñamos qué cambiaría.
          </p>
          <DemoRequestForm />
        </div>
      </section>

      <footer className="border-t">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>MITIKUS — hecho para consultoras IT que ya no quieren empezar cada auditoría desde cero.</span>
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
  name: string; price: string; period: string; forWhom: string; cta: string; ctaHref: string; highlighted?: boolean
}) {
  return (
    <div className={`rounded-lg border p-5 flex flex-col ${highlighted ? 'border-primary border-2 bg-card' : 'bg-card'}`}>
      {highlighted && (
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-2">Recomendado</span>
      )}
      <p className="font-semibold text-sm">{name}</p>
      <p className="text-xl font-bold mt-1">
        {price}<span className="text-xs font-normal text-muted-foreground">{period}</span>
      </p>
      <p className="text-xs text-muted-foreground mt-2 mb-4 flex-1">{forWhom}</p>
      <a
        href={ctaHref}
        className={`text-xs font-medium text-center rounded-md px-3 py-2 transition-colors ${
          highlighted
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'border border-input hover:bg-accent'
        }`}
      >
        {cta}
      </a>
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
