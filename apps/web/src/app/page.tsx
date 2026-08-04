import type { Metadata } from 'next'
import type React from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { ThemeToggle } from './(dashboard)/_components/ThemeToggle'
import { LocaleSelector } from './(dashboard)/_components/LocaleSelector'
import { ScrollReveal } from './_components/ScrollReveal'
import { CookieBanner } from './_components/CookieBanner'
import { getLocale } from '@/i18n/locale'
import { PricingSection } from './_components/PricingSection'

export const metadata: Metadata = {
  title: 'MITIKUS — Crea, gestiona y entrega documentos de cliente con IA',
  description:
    'La plataforma para profesionales, pymes y equipos que crean, gestionan y entregan documentos, contratos e informes de cliente. Propuestas, contratos con firma digital, facturas y presentaciones — todo en un solo lugar.',
  keywords: [
    'gestión documental profesionales', 'contratos firma digital pymes',
    'crear propuestas comerciales IA', 'facturación online pymes',
    'presentaciones clientes', 'software gestión documentos cliente',
  ],
  openGraph: {
    title: 'MITIKUS — Crea, gestiona y entrega documentos de cliente con IA',
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
    title: 'MITIKUS — El espacio de trabajo completo para tu equipo',
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

  const jsonLd = {
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

  return (
    <main className="min-h-screen bg-background">
      <ScrollReveal />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── NAV ── */}
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
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
          <nav className="flex items-center gap-2 sm:gap-4" aria-label="Navegación principal">
            <LocaleSelector currentLocale={locale} />
            <ThemeToggle />
            <a href="/sign-in" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors">
              Iniciar sesión
            </a>
            <a
              href="/sign-up"
              className="text-sm font-medium bg-primary text-primary-foreground px-3 py-1.5 sm:px-4 sm:py-2 rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              Empezar gratis
            </a>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 leading-tight">
          Tu espacio de trabajo,<br className="hidden sm:block" /> todo en uno.
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          La plataforma para profesionales y equipos que quieren entregar propuestas, contratos, informes
          y facturas más rápido — sin herramientas dispersas y con IA que conoce tu negocio.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          <a
            href="/sign-up"
            className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Empezar gratis — 15 días
          </a>
          <a
            href="#herramientas"
            className="rounded-md border border-input bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
          >
            Ver qué incluye
          </a>
        </div>

        {/* Hero visual — Mi Office en miniatura */}
        <MockupOfficeHub />
      </section>

      {/* ── EL PROBLEMA ── */}
      <section className="bg-muted/30 border-y">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-bold text-center mb-2">¿Te suena esta situación?</h2>
          <p className="text-center text-muted-foreground mb-10">
            No es un problema de tu equipo. Es un problema de herramientas dispersas.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <ProblemItem
              title="Todo disperso"
              text="Los documentos en el correo, los contratos en Dropbox, las hojas en Excel, las presentaciones en Drive — y nunca encuentras la versión correcta."
            />
            <ProblemItem
              title="Contratos sin control"
              text="Envías un PDF por email, la otra parte lo imprime, lo firma a mano y te lo devuelve en foto. O peor: no te lo devuelve nunca."
            />
            <ProblemItem
              title="Trabajo que se repite"
              text="Cada proyecto empieza de cero. Copias de lo anterior, ajustas manualmente y aun así dedicas horas a algo que ya has hecho antes."
            />
            <ProblemItem
              title="El equipo no comparte contexto"
              text="Cada persona trabaja en su propia carpeta. Lo que aprendió uno con un cliente no llega al compañero que trabaja con el siguiente."
            />
            <ProblemItem
              title="Sin trazabilidad"
              text="¿Quién modificó qué? ¿Cuándo se envió el contrato? ¿Qué versión aprobó el cliente? No hay forma de saberlo sin buscar en correos."
            />
          </div>
        </div>
      </section>

      {/* ── CASOS DE USO ── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center mb-3">
          Flujos reales con resultado tangible
        </p>
        <h2 className="text-2xl font-bold text-center mb-2">Lo que puedes hacer con MITIKUS</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          Cada flujo termina con un entregable listo para el cliente — sin saltar entre herramientas.
        </p>
        <div className="space-y-4">
          {[
            {
              n: '01',
              title: 'Crear una propuesta comercial',
              desc: 'Describe el proyecto a Arkos, revisa el borrador generado con el tono de tu negocio, ajústalo en el editor y expórtalo a Word o PDF. Del briefing al documento en minutos.',
              result: 'PDF / Word listo para enviar',
              icon: '📄',
            },
            {
              n: '02',
              title: 'Enviar contrato para firma',
              desc: 'Sube el contrato, introduce el email del cliente y pulsa enviar. El cliente lo lee en el navegador y firma con un código de verificación. Sin papel, sin correo de ida y vuelta.',
              result: 'Contrato firmado digitalmente',
              icon: '✍️',
            },
            {
              n: '03',
              title: 'Generar informe para cliente',
              desc: 'Añade tus notas, datos y fuentes a un cuaderno. Arkos sintetiza, estructura y redacta el informe. Tú lo revisas y lo entregas.',
              result: 'Informe editable y exportable',
              icon: '📒',
            },
            {
              n: '04',
              title: 'Crear y presentar al cliente',
              desc: 'Escribe los puntos clave en el editor de diapositivas, genera el diseño con la IA y comparte un enlace público en lugar de adjuntar un PowerPoint.',
              result: 'Presentación con URL propia',
              icon: '🖥️',
            },
            {
              n: '05',
              title: 'Organizar la documentación de un proyecto',
              desc: 'Guarda documentos, hojas de cálculo, contratos y PDFs en el mismo espacio de trabajo. Todo accesible, con trazabilidad de quién modificó qué y cuándo.',
              result: 'Carpeta de proyecto centralizada',
              icon: '🗂️',
            },
          ].map((uc) => (
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
        <h2 className="text-2xl font-bold text-center mb-2">Todo lo que necesitas, nativo</h2>
        <p className="text-center text-muted-foreground mb-12">
          No son integraciones de terceros. Son herramientas propias de MITIKUS, dentro de tu espacio de trabajo.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <ToolCard
            icon="📄"
            title="Documentos"
            text="Editor de texto completo con formato rico. Exporta a Word con un clic. Comparte y colabora con tu equipo."
          />
          <ToolCard
            icon="📊"
            title="Hojas de cálculo"
            text="Hojas de cálculo nativas con fórmulas, filtros y formato de celdas. Sin Excel, sin Google Sheets."
          />
          <ToolCard
            icon="📑"
            title="PDFs"
            text="Sube, organiza y visualiza PDFs directamente. Búsqueda dentro del documento incluida."
          />
          <ToolCard
            icon="✍️"
            title="Contratos con firma digital"
            text="Envía contratos a clientes, que los firman con verificación OTP por SMS o email. Sin papel, sin correo de vuelta."
          />
          <ToolCard
            icon="🖥️"
            title="Presentaciones"
            text="Crea y presenta directamente desde MITIKUS. Comparte un enlace al cliente en lugar de enviar un archivo."
          />
          <ToolCard
            icon="📒"
            title="Cuadernos de investigación"
            text="Organiza tus fuentes, notas y análisis. Arkos sintetiza el contenido y genera conclusiones por ti."
          />
          <ToolCard
            icon="🧾"
            title="Facturas"
            text="Crea facturas con líneas de servicio, IVA automático y numeración secuencial. Descarga el PDF listo para enviar al cliente."
          />
          <ToolCard
            icon="📷"
            title="Escáner de gastos"
            text="Fotografía cualquier ticket o factura con la cámara. La IA extrae proveedor, importe, IVA y categoría automáticamente."
          />
        </div>
        </div>
      </section>

      {/* ── IA CON ARKOS ── */}
      <section className="bg-muted/30 border-y">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Inteligencia artificial integrada
              </p>
              <h2 className="text-2xl font-bold mb-4">Arkos, el copiloto de tu equipo</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Arkos aprende el contexto de tu empresa, tu sector y tus proyectos.
                Dile lo que necesitas — redactar un informe, analizar información, preparar
                una propuesta — y genera el contenido. Tú revisas y entregas.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  'Genera borradores adaptados a tu sector y tipo de trabajo',
                  'Sintetiza fuentes y notas en tus cuadernos de investigación',
                  'Ayuda a completar documentos, hojas y presentaciones',
                  'Recuerda el contexto de tu empresa en cada sesión',
                ].map((item) => (
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
              Trabajo en equipo
            </p>
            <h2 className="text-2xl font-bold mb-4">Todo el equipo, en el mismo espacio</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Invita a quien necesites con un enlace. Cada persona tiene su rol —
              propietario, administrador, editor o visualizador — y trabaja
              sobre los mismos documentos, contratos y proyectos.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                'Invitaciones por enlace o email con caducidad de 7 días',
                'Roles con permisos granulares por persona',
                'Historial de actividad y trazabilidad completa',
                'Un espacio de trabajo compartido por toda la organización',
              ].map((item) => (
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
          <h2 className="text-2xl font-bold text-center mb-10">¿Qué cambia para tu equipo?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <BenefitItem title="Menos herramientas" text="Un solo sitio para documentos, contratos, hojas y presentaciones — sin suscripciones paralelas." />
            <BenefitItem title="Contratos cerrados antes" text="El cliente firma con verificación digital. Sin correos de seguimiento ni impresoras." />
            <BenefitItem title="Trabajo repetitivo, eliminado" text="La IA genera los borradores. Tú revisas y entregas. El tiempo que antes dedicabas a redactar, ahora lo usas en lo que importa." />
            <BenefitItem title="Equipo alineado" text="Todo el equipo sobre el mismo contexto. Lo que sabe un consultor está disponible para todos." />
            <BenefitItem title="Trazabilidad completa" text="Sabes quién modificó qué y cuándo. Sin buscar en correos ni en carpetas de Dropbox." />
            <BenefitItem title="Sin instalar nada" text="Funciona desde el navegador. Empiezas el mismo día, desde cualquier sitio." />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section>
        <div className="max-w-5xl mx-auto px-6 py-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center mb-2">
            Casos de uso reales
          </p>
          <h2 className="text-2xl font-bold text-center mb-10">Lo que dicen los primeros equipos</h2>
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            <TestimonialCard
              quote="Antes tardábamos 3 días en cerrar un contrato. Ahora el cliente firma el mismo día desde el móvil. El OTP fue lo que nos convenció."
              name="Marta G."
              role="Socia directora"
              company="Consultoría de RRHH · Madrid"
              initials="MG"
            />
            <TestimonialCard
              quote="Teníamos documentos en Google Drive, contratos en email y facturas en otro sitio. Con MITIKUS es todo el mismo lugar. El equipo adoptó en una tarde."
              name="Jordi P."
              role="CEO"
              company="Agencia de marketing digital · Barcelona"
              initials="JP"
              featured
            />
            <TestimonialCard
              quote="Arkos genera el primer borrador del informe de auditoría en minutos. Yo reviso, ajusto y entrego. He recuperado casi dos horas por proyecto."
              name="Elena R."
              role="Consultora IT independiente"
              company="Freelance · Valencia"
              initials="ER"
            />
          </div>

          {/* Caso de uso destacado */}
          <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-card p-8 flex flex-col sm:flex-row gap-8 items-start">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-2xl">🏢</div>
            <div className="flex-1 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Caso de uso</p>
              <h3 className="text-lg font-bold leading-snug">
                Cómo una consultoría de ciberseguridad redujo su ciclo de entrega a la mitad
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Un equipo de 4 personas que realizaba auditorías IT para pymes industriales pasó de gestionar
                cada proyecto con correo, Word y DocuSign a tener todo en MITIKUS. Misiones con pasos claros,
                informes generados por Arkos, contratos firmados digitalmente y el cliente con visibilidad en tiempo real.
                Resultado: de 5 días de media por entrega a 2,5 — sin contratar a nadie más.
              </p>
              <div className="flex flex-wrap gap-4 pt-1">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">−50%</p>
                  <p className="text-xs text-muted-foreground">tiempo de entrega</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">4→8</p>
                  <p className="text-xs text-muted-foreground">proyectos/mes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">0</p>
                  <p className="text-xs text-muted-foreground">contratos sin firmar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section>
        <PricingSection />
      </section>

      {/* ── FAQ ── */}
      <section className="bg-muted/30 border-y">
        <div className="max-w-3xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-bold text-center mb-10">Preguntas frecuentes</h2>
          <div className="space-y-5">
            <FaqItem
              q="¿Para qué tipo de empresa es MITIKUS?"
              a="Para cualquier empresa o equipo que trabaje con documentos, contratos y clientes. Da igual el sector — agencias, despachos, consultoras, estudios, startups. Si tu equipo produce y gestiona documentos, MITIKUS está hecho para vosotros."
            />
            <FaqItem
              q="¿Qué herramientas incluye MITIKUS?"
              a="Documentos con editor rico, hojas de cálculo, visor y gestor de PDFs, contratos con firma digital OTP, presentaciones, cuadernos de investigación con IA, y flujos de trabajo automatizados. Todo en un solo espacio de trabajo."
            />
            <FaqItem
              q="¿Cómo funciona la firma de contratos?"
              a="Subes el contrato, introduces el email del cliente y se lo envías desde MITIKUS. El cliente recibe un enlace, ve el contrato en el navegador y firma con un código de verificación (OTP) que le llega al email. Sin papel, sin instalar nada."
            />
            <FaqItem
              q="¿Puedo invitar a mi equipo?"
              a="Sí. Invitas por email o por enlace. Cada persona tiene un rol (administrador, editor o visualizador) con sus permisos correspondientes. El plan Professional incluye hasta 15 usuarios."
            />
            <FaqItem
              q="¿Necesito instalar algo?"
              a="No. Todo funciona desde el navegador — sin extensiones, sin apps de escritorio. Empiezas el mismo día."
            />
            <FaqItem
              q="¿Mis datos están seguros?"
              a="Cada organización está completamente aislada. Nadie externo a tu equipo puede acceder a tus documentos, contratos ni proyectos."
            />
            <FaqItem
              q="¿Puedo probarlo gratis?"
              a="Sí, 15 días completos con todas las herramientas, sin tarjeta de crédito. Si necesitas ayuda para configurarlo para tu equipo, escríbenos."
            />
            <FaqItem
              q="¿Puedo cancelar cuando quiera?"
              a="Sí, desde el panel de tu cuenta, sin llamadas ni procesos complicados. El plan sigue activo hasta el final del periodo ya pagado."
            />
          </div>
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section id="precios" className="bg-muted/30 border-y">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-bold text-center mb-2">Precios claros, sin sorpresas</h2>
          <p className="text-center text-muted-foreground mb-10">
            Desde 29 €/mes. Sin permanencia. Cancela cuando quieras.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Solo', price: 29, users: 1, workspaces: 1, badge: 'Para profesionales' },
              { name: 'Starter', price: 49, users: 2, workspaces: 1 },
              { name: 'Professional', price: 149, users: 5, workspaces: 3, popular: true },
              { name: 'Business', price: 349, users: 15, workspaces: 10 },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border bg-card p-5 flex flex-col gap-3 relative ${plan.popular ? 'border-primary shadow-sm' : plan.badge ? 'border-primary/30' : ''}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground whitespace-nowrap">
                    Más popular
                  </span>
                )}
                {plan.badge && !plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-[11px] font-semibold text-primary whitespace-nowrap">
                    {plan.badge}
                  </span>
                )}
                <div>
                  <p className="font-semibold text-sm">{plan.name}</p>
                  <div className="flex items-baseline gap-0.5 mt-1">
                    <span className="text-2xl font-bold">€{plan.price}</span>
                    <span className="text-xs text-muted-foreground">/mes</span>
                  </div>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 flex-1">
                  <li>{plan.users === 1 ? '1 usuario' : `Hasta ${plan.users} usuarios`}</li>
                  <li>{plan.workspaces === 1 ? '1 workspace' : `${plan.workspaces} workspaces`}</li>
                  {plan.name === 'Solo'
                    ? <><li>Facturación + fiscal</li><li>Arkos IA incluido</li></>
                    : <li>Todas las herramientas incluidas</li>
                  }
                </ul>
                <a
                  href="/sign-up"
                  className={`text-center rounded-lg py-2 text-xs font-medium transition-colors ${plan.popular ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border border-input hover:bg-muted'}`}
                >
                  Empezar gratis
                </a>
              </div>
            ))}
          </div>
          <p className="text-center mt-6 text-xs text-muted-foreground">
            ¿Necesitas más?{' '}
            <a href="/pricing" className="underline hover:text-foreground transition-colors">
              Ver todos los detalles de cada plan →
            </a>
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section>
        <div className="max-w-xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">¿Listo para empezar?</h2>
          <p className="text-muted-foreground mb-8">
            15 días gratis, sin tarjeta de crédito. Todo tu espacio de trabajo listo en minutos.
          </p>
          <a
            href="/sign-up"
            className="inline-block rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Empezar gratis
          </a>
        </div>
      </section>

      <footer className="border-t">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>MITIKUS — las herramientas que necesita tu equipo, en un solo lugar.</span>
          <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-end">
            <a href="/privacy" className="hover:text-foreground transition-colors">Política de privacidad</a>
            <span>·</span>
            <a href="/terms" className="hover:text-foreground transition-colors">Términos de uso</a>
            <span>·</span>
            <a href="/dpa" className="hover:text-foreground transition-colors">DPA (Tratamiento de datos)</a>
            <span>·</span>
            <span>© {new Date().getFullYear()} MITIKUS</span>
          </div>
        </div>
      </footer>
      <CookieBanner initialShow={!hasConsentCookie} />
    </main>
  )
}

// ── Mockup components ─────────────────────────────────────────────────────────

function MockupOfficeHub() {
  const tools = [
    { icon: '📄', label: 'Documentos' },
    { icon: '📊', label: 'Hojas' },
    { icon: '📑', label: 'PDFs' },
    { icon: '✍️', label: 'Contratos' },
    { icon: '🖥️', label: 'Presentaciones' },
    { icon: '📒', label: 'Cuadernos' },
    { icon: '🧾', label: 'Facturas' },
    { icon: '📷', label: 'Gastos' },
  ]
  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm max-w-lg mx-auto">
      <div className="bg-muted/50 border-b px-4 py-2.5 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
        <span className="text-xs text-muted-foreground ml-2">Mi Office — MITIKUS</span>
      </div>
      <div className="p-5">
        <p className="text-[11px] text-muted-foreground mb-4">Herramientas disponibles en tu espacio</p>
        <div className="grid grid-cols-3 gap-3">
          {tools.map((t) => (
            <div key={t.label} className="rounded-lg border bg-background p-3 flex flex-col items-center gap-1.5 hover:border-primary/40 transition-colors cursor-pointer">
              <span className="text-xl">{t.icon}</span>
              <span className="text-[11px] font-medium text-center">{t.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" className="text-primary"/><path d="M4 6l1.5 1.5L8 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-primary"/></svg>
          </div>
          <span className="text-[11px] text-muted-foreground">Arkos listo para ayudarte en cualquier herramienta</span>
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
    { name: 'invite@empresa.com', role: 'Pendiente', initials: '···', color: 'bg-muted text-muted-foreground' },
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
