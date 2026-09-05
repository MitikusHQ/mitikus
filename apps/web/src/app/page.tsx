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

  const isEn = locale === 'en'
  const landing = isEn
    ? {
        heroLine1: 'Your business, clients, invoices',
        heroLine2: 'and memory in one place.',
        heroSubtitle: 'The platform for freelancers and small teams that want to manage clients, issue invoices, store documents and consult their business memory — without scattered tools, with built-in AI.',
        startTrial: 'Start free — 15 days',
        viewPricing: 'See pricing',
        // Problem section
        problemEyebrow: 'Sound familiar?',
        problemSubtitle: "It's not a team problem. It's a scattered-tools problem.",
        problemItems: [
          { title: 'Everything scattered', text: 'Documents in email, contracts in Dropbox, sheets in Excel, slides in Drive — and you can never find the right version.' },
          { title: 'Contracts out of control', text: 'You send a PDF by email, the other party prints it, signs by hand and sends a photo back. Or worse: never sends it back.' },
          { title: 'Repeated work', text: 'Every project starts from scratch. You copy from last time, adjust manually and still spend hours on something you\'ve already done.' },
          { title: 'Team without shared context', text: 'Each person works in their own folder. What one learned from a client never reaches the colleague working with the next one.' },
          { title: 'No traceability', text: 'Who changed what? When was the contract sent? Which version did the client approve? There\'s no way to know without searching through emails.' },
        ],
        // Use cases
        useCasesEyebrow: 'Real workflows with tangible results',
        useCasesTitle: 'What you can do with MITIKUS',
        useCasesSubtitle: 'Each workflow ends with a deliverable ready for the client — without jumping between tools.',
        useCases: [
          { n: '01', title: 'Create a business proposal', desc: 'Describe the project to Arkos, review the draft generated in your business tone, adjust it in the editor and export to Word or PDF. From briefing to document in minutes.', result: 'PDF / Word ready to send', icon: '📄' },
          { n: '02', title: 'Send a contract for signature', desc: 'Upload the contract, enter the client email and press send. The client reads it in the browser and signs with a verification code. No paper, no back-and-forth email.', result: 'Digitally signed contract', icon: '✍️' },
          { n: '03', title: 'Generate a client report', desc: 'Add your notes, data and sources to a notebook. Arkos synthesises, structures and drafts the report. You review and deliver.', result: 'Editable and exportable report', icon: '📒' },
          { n: '04', title: 'Create and present to the client', desc: 'Write the key points in the slide editor, generate the design with AI and share a public link instead of attaching a PowerPoint.', result: 'Presentation with its own URL', icon: '🖥️' },
          { n: '05', title: 'Create and send an invoice', desc: 'Add the client, services and amounts. MITIKUS calculates VAT, generates the sequential number and produces the PDF ready to send or download. Tax details configured once.', result: 'Downloadable PDF invoice', icon: '🧾' },
          { n: '06', title: 'Organise project documentation', desc: 'Save documents, spreadsheets, contracts and PDFs in the same workspace. All accessible, with traceability of who changed what and when.', result: 'Centralised project folder', icon: '🗂️' },
        ],
        // Tools section
        toolsTitle: 'Everything you need, native',
        toolsSubtitle: "These aren't third-party integrations. They're MITIKUS's own tools, inside your workspace.",
        tools: [
          { icon: '📄', title: 'Documents', text: 'Full-featured text editor with rich formatting. Export to Word in one click. Share and collaborate with your team.' },
          { icon: '📊', title: 'Spreadsheets', text: 'Native spreadsheets with formulas, filters and cell formatting. No Excel, no Google Sheets.' },
          { icon: '📑', title: 'PDFs', text: 'Upload, organise and view PDFs directly. In-document search included.' },
          { icon: '✍️', title: 'Contracts with digital signature', text: 'Send contracts to clients, who sign with OTP verification by SMS or email. No paper, no reply email.' },
          { icon: '🖥️', title: 'Presentations', text: 'Create and present directly from MITIKUS. Share a link with the client instead of sending a file.' },
          { icon: '📒', title: 'Research notebooks', text: 'Organise your sources, notes and analysis. Arkos synthesises the content and generates conclusions for you.' },
          { icon: '🧾', title: 'Invoices', text: 'Create invoices with service lines, automatic VAT and sequential numbering. Download the PDF ready to send to the client. Billing in preparation for Verifactu (AEAT).' },
          { icon: '📷', title: 'Expense scanner', text: 'Photograph any receipt or invoice with the camera. AI extracts supplier, amount, VAT and category automatically.' },
        ],
        // Arkos section
        arkosEyebrow: 'Integrated artificial intelligence',
        arkosTitle: 'Arkos, your team\'s co-pilot',
        arkosBody: 'Arkos learns the context of your company, your sector and your projects. Tell it what you need — drafting a report, analysing information, preparing a proposal — and it generates the content. You review and deliver.',
        arkosBullets: [
          'Generates drafts adapted to your sector and type of work',
          'Synthesises sources and notes in your research notebooks',
          'Helps complete documents, sheets and presentations',
          'Remembers your company context in every session',
        ],
        // Team section
        teamEyebrow: 'Teamwork',
        teamTitle: 'The whole team, in the same space',
        teamBody: 'Invite whoever you need with a link. Each person has their role — owner, admin, editor or viewer — and works on the same documents, contracts and projects.',
        teamBullets: [
          'Invitations by link or email with 7-day expiry',
          'Roles with granular permissions per person',
          'Activity history and full traceability',
          'One shared workspace for the whole organisation',
        ],
        // Benefits section
        benefitsTitle: 'What changes for your team?',
        benefits: [
          { title: 'Fewer tools', text: 'One place for documents, contracts, sheets and presentations — no parallel subscriptions.' },
          { title: 'Contracts closed sooner', text: 'The client signs with digital verification. No follow-up emails, no printers.' },
          { title: 'Repetitive work, eliminated', text: 'AI generates the drafts. You review and deliver. The time you used to spend writing, you now use on what matters.' },
          { title: 'Team aligned', text: 'The whole team on the same context. What one consultant knows is available to everyone.' },
          { title: 'Full traceability', text: 'Know who changed what and when. No searching through emails or Dropbox folders.' },
          { title: 'Nothing to install', text: 'Works from the browser. Start the same day, from anywhere.' },
        ],
        // For whom section
        forWhomEyebrow: 'Built for teams that deliver',
        forWhomTitle: 'Does your team work like this?',
        sectors: [
          { sector: 'Marketing agencies', desc: 'Proposals, campaign reports and client contracts in one space.' },
          { sector: 'Consultancies', desc: 'Reports, analysis notebooks and centralised project documentation.' },
          { sector: 'Law firms and studios', desc: 'Contracts with digital signature, client management and integrated billing.' },
          { sector: 'Sales teams', desc: 'Commercial proposals, lead tracking and sales cycle documentation.' },
          { sector: 'Startups and SMEs', desc: 'The full document stack without paying for five different tools.' },
          { sector: 'Freelancers', desc: 'Invoices, contracts and projects organised. No Excel, no Dropbox, no hassle.' },
        ],
        // Comparison section
        comparisonEyebrow: 'No comparison',
        comparisonTitle: 'Why not the usual tools?',
        comparisonSubtitle: 'The tools you already use are good at what they do. The problem is there are ten of them, and none of them talks to the others.',
        withMitikus: 'With MITIKUS',
        comparison: [
          {
            them: 'Google Workspace / Microsoft 365',
            issue: 'Documents, yes. But contracts are still PDF attachments in email. Invoices, somewhere else. Client context, lost in Drive history.',
            us: 'MITIKUS unites everything in one space: the document, the digitally signed contract and the corresponding invoice, with a history of who did what.',
          },
          {
            them: 'Notion / Coda',
            issue: 'Perfect for notes and internal databases. But no digital signature, no billing, no AI trained on your documents.',
            us: 'MITIKUS adds OTP digital signature, PDF invoices with automatic VAT and a co-pilot that knows your company context — not just your notes.',
          },
          {
            them: 'DocuSign / Signaturit',
            issue: 'They solve the signature, but only the signature. The contract arrives by email, is signed, and the document is isolated from the rest of your work.',
            us: 'In MITIKUS the contract lives alongside the client, the proposal and the invoice. The signature is one more step in the workflow, not a separate tool.',
          },
        ],
        // CTA
        ctaTitle: 'Ready to start?',
        ctaSubtitle: '15 days free, no credit card. Your entire workspace ready in minutes.',
        ctaButton: 'Start free',
        // FAQ
        faqTitle: 'Frequently asked questions',
        faqItems: [
          { q: 'What type of company is MITIKUS for?', a: 'For any company or team that works with documents, contracts and clients. Whatever the sector — agencies, law firms, consultancies, studios, startups. If your team produces and manages documents, MITIKUS is made for you.' },
          { q: 'What tools does MITIKUS include?', a: 'Documents with rich editor, spreadsheets, PDF viewer and manager, contracts with OTP digital signature, presentations, research notebooks with AI, and automated workflows. All in one workspace.' },
          { q: 'How does contract signing work?', a: 'You upload the contract, enter the client email and send it from MITIKUS. The client receives a link, views the contract in the browser and signs with a verification code (OTP) sent to their email. No paper, no installation needed.' },
          { q: 'Can I invite my team?', a: 'Yes. You invite by email or link. Each person has a role (admin, editor or viewer) with the corresponding permissions. The Professional plan includes up to 15 users.' },
          { q: 'Do I need to install anything?', a: 'No. Everything works from the browser — no extensions, no desktop apps. Start the same day.' },
          { q: 'Is my data secure?', a: 'Each organisation is completely isolated. No one outside your team can access your documents, contracts or projects.' },
          { q: 'Can I try it for free?', a: 'Yes, 15 full days with all tools, no credit card. If you need help setting it up for your team, write to us.' },
          { q: 'Can I cancel whenever I want?', a: 'Yes, from your account panel, without calls or complicated processes. The plan remains active until the end of the already paid period.' },
        ],
        // Footer
        footerTagline: 'The tools your team needs, in one place.',
        footerPrivacy: 'Privacy policy',
        footerTerms: 'Terms of use',
        footerDpa: 'DPA (Data processing)',
      }
    : {
        heroLine1: 'Tu negocio, clientes, facturas',
        heroLine2: 'y memoria en un solo lugar.',
        heroSubtitle: 'La plataforma para autónomos y pymes que quieren gestionar clientes, emitir facturas, guardar documentos y consultar la memoria de su negocio — sin herramientas dispersas, con IA integrada.',
        startTrial: 'Empezar gratis — 15 días',
        viewPricing: 'Ver precios',
        // Problema
        problemEyebrow: '¿Te suena esta situación?',
        problemSubtitle: 'No es un problema de tu equipo. Es un problema de herramientas dispersas.',
        problemItems: [
          { title: 'Todo disperso', text: 'Los documentos en el correo, los contratos en Dropbox, las hojas en Excel, las presentaciones en Drive — y nunca encuentras la versión correcta.' },
          { title: 'Contratos sin control', text: 'Envías un PDF por email, la otra parte lo imprime, lo firma a mano y te lo devuelve en foto. O peor: no te lo devuelve nunca.' },
          { title: 'Trabajo que se repite', text: 'Cada proyecto empieza de cero. Copias de lo anterior, ajustas manualmente y aun así dedicas horas a algo que ya has hecho antes.' },
          { title: 'El equipo no comparte contexto', text: 'Cada persona trabaja en su propia carpeta. Lo que aprendió uno con un cliente no llega al compañero que trabaja con el siguiente.' },
          { title: 'Sin trazabilidad', text: '¿Quién modificó qué? ¿Cuándo se envió el contrato? ¿Qué versión aprobó el cliente? No hay forma de saberlo sin buscar en correos.' },
        ],
        // Casos de uso
        useCasesEyebrow: 'Flujos reales con resultado tangible',
        useCasesTitle: 'Lo que puedes hacer con MITIKUS',
        useCasesSubtitle: 'Cada flujo termina con un entregable listo para el cliente — sin saltar entre herramientas.',
        useCases: [
          { n: '01', title: 'Crear una propuesta comercial', desc: 'Describe el proyecto a Arkos, revisa el borrador generado con el tono de tu negocio, ajústalo en el editor y expórtalo a Word o PDF. Del briefing al documento en minutos.', result: 'PDF / Word listo para enviar', icon: '📄' },
          { n: '02', title: 'Enviar contrato para firma', desc: 'Sube el contrato, introduce el email del cliente y pulsa enviar. El cliente lo lee en el navegador y firma con un código de verificación. Sin papel, sin correo de ida y vuelta.', result: 'Contrato firmado digitalmente', icon: '✍️' },
          { n: '03', title: 'Generar informe para cliente', desc: 'Añade tus notas, datos y fuentes a un cuaderno. Arkos sintetiza, estructura y redacta el informe. Tú lo revisas y lo entregas.', result: 'Informe editable y exportable', icon: '📒' },
          { n: '04', title: 'Crear y presentar al cliente', desc: 'Escribe los puntos clave en el editor de diapositivas, genera el diseño con la IA y comparte un enlace público en lugar de adjuntar un PowerPoint.', result: 'Presentación con URL propia', icon: '🖥️' },
          { n: '05', title: 'Crear y enviar una factura', desc: 'Añade el cliente, los servicios y los importes. MITIKUS calcula el IVA, genera el número correlativo y produce el PDF listo para enviar o descargar. Datos fiscales configurados una sola vez.', result: 'Factura PDF descargable', icon: '🧾' },
          { n: '06', title: 'Organizar la documentación de un proyecto', desc: 'Guarda documentos, hojas de cálculo, contratos y PDFs en el mismo espacio de trabajo. Todo accesible, con trazabilidad de quién modificó qué y cuándo.', result: 'Carpeta de proyecto centralizada', icon: '🗂️' },
        ],
        // Herramientas
        toolsTitle: 'Todo lo que necesitas, nativo',
        toolsSubtitle: 'No son integraciones de terceros. Son herramientas propias de MITIKUS, dentro de tu espacio de trabajo.',
        tools: [
          { icon: '📄', title: 'Documentos', text: 'Editor de texto completo con formato rico. Exporta a Word con un clic. Comparte y colabora con tu equipo.' },
          { icon: '📊', title: 'Hojas de cálculo', text: 'Hojas de cálculo nativas con fórmulas, filtros y formato de celdas. Sin Excel, sin Google Sheets.' },
          { icon: '📑', title: 'PDFs', text: 'Sube, organiza y visualiza PDFs directamente. Búsqueda dentro del documento incluida.' },
          { icon: '✍️', title: 'Contratos con firma digital', text: 'Envía contratos a clientes, que los firman con verificación OTP por SMS o email. Sin papel, sin correo de vuelta.' },
          { icon: '🖥️', title: 'Presentaciones', text: 'Crea y presenta directamente desde MITIKUS. Comparte un enlace al cliente en lugar de enviar un archivo.' },
          { icon: '📒', title: 'Cuadernos de investigación', text: 'Organiza tus fuentes, notas y análisis. Arkos sintetiza el contenido y genera conclusiones por ti.' },
          { icon: '🧾', title: 'Facturas', text: 'Crea facturas con líneas de servicio, IVA automático y numeración secuencial. Descarga el PDF listo para enviar al cliente. Facturación en preparación para Verifactu (AEAT).' },
          { icon: '📷', title: 'Escáner de gastos', text: 'Fotografía cualquier ticket o factura con la cámara. La IA extrae proveedor, importe, IVA y categoría automáticamente.' },
        ],
        // Arkos
        arkosEyebrow: 'Inteligencia artificial integrada',
        arkosTitle: 'Arkos, el copiloto de tu equipo',
        arkosBody: 'Arkos aprende el contexto de tu empresa, tu sector y tus proyectos. Dile lo que necesitas — redactar un informe, analizar información, preparar una propuesta — y genera el contenido. Tú revisas y entregas.',
        arkosBullets: [
          'Genera borradores adaptados a tu sector y tipo de trabajo',
          'Sintetiza fuentes y notas en tus cuadernos de investigación',
          'Ayuda a completar documentos, hojas y presentaciones',
          'Recuerda el contexto de tu empresa en cada sesión',
        ],
        // Equipo
        teamEyebrow: 'Trabajo en equipo',
        teamTitle: 'Todo el equipo, en el mismo espacio',
        teamBody: 'Invita a quien necesites con un enlace. Cada persona tiene su rol — propietario, administrador, editor o visualizador — y trabaja sobre los mismos documentos, contratos y proyectos.',
        teamBullets: [
          'Invitaciones por enlace o email con caducidad de 7 días',
          'Roles con permisos granulares por persona',
          'Historial de actividad y trazabilidad completa',
          'Un espacio de trabajo compartido por toda la organización',
        ],
        // Beneficios
        benefitsTitle: '¿Qué cambia para tu equipo?',
        benefits: [
          { title: 'Menos herramientas', text: 'Un solo sitio para documentos, contratos, hojas y presentaciones — sin suscripciones paralelas.' },
          { title: 'Contratos cerrados antes', text: 'El cliente firma con verificación digital. Sin correos de seguimiento ni impresoras.' },
          { title: 'Trabajo repetitivo, eliminado', text: 'La IA genera los borradores. Tú revisas y entregas. El tiempo que antes dedicabas a redactar, ahora lo usas en lo que importa.' },
          { title: 'Equipo alineado', text: 'Todo el equipo sobre el mismo contexto. Lo que sabe un consultor está disponible para todos.' },
          { title: 'Trazabilidad completa', text: 'Sabes quién modificó qué y cuándo. Sin buscar en correos ni en carpetas de Dropbox.' },
          { title: 'Sin instalar nada', text: 'Funciona desde el navegador. Empiezas el mismo día, desde cualquier sitio.' },
        ],
        // Para quién
        forWhomEyebrow: 'Hecho para equipos que entregan',
        forWhomTitle: '¿Tu equipo trabaja así?',
        sectors: [
          { sector: 'Agencias de marketing', desc: 'Propuestas, informes de campaña y contratos de cliente en un solo espacio.' },
          { sector: 'Consultoras y asesorías', desc: 'Informes, cuadernos de análisis y documentación de proyecto centralizada.' },
          { sector: 'Despachos y estudios', desc: 'Contratos con firma digital, gestión de clientes y facturación integrada.' },
          { sector: 'Equipos de ventas', desc: 'Propuestas comerciales, seguimiento de leads y documentación del ciclo de venta.' },
          { sector: 'Startups y pymes', desc: 'Todo el stack documental sin pagar cinco herramientas diferentes.' },
          { sector: 'Freelances y autónomos', desc: 'Facturas, contratos y proyectos organizados. Sin Excel, sin Dropbox, sin esfuerzo.' },
        ],
        // VS Competencia
        comparisonEyebrow: 'Sin comparación',
        comparisonTitle: '¿Por qué no las herramientas de siempre?',
        comparisonSubtitle: 'Las herramientas que ya usas son buenas en lo suyo. El problema es que son diez, y ninguna habla con las demás.',
        withMitikus: 'Con MITIKUS',
        comparison: [
          {
            them: 'Google Workspace / Microsoft 365',
            issue: 'Documentos, sí. Pero los contratos siguen siendo PDFs adjuntos en el correo. Las facturas, en otro sitio. El contexto del cliente, perdido en el histórico de Drive.',
            us: 'MITIKUS une todo en un espacio: el documento, el contrato firmado digitalmente y la factura correspondiente, con el historial de quién hizo qué.',
          },
          {
            them: 'Notion / Coda',
            issue: 'Perfectos para notas y bases de datos internas. Pero no tienen firma digital, ni facturación, ni IA entrenada en tus documentos.',
            us: 'MITIKUS añade firma digital OTP, facturas PDF con IVA automático y un copiloto que conoce el contexto de tu empresa — no solo tus notas.',
          },
          {
            them: 'DocuSign / Signaturit',
            issue: 'Resuelven la firma, pero solo la firma. El contrato llega por email, se firma, y el documento queda aislado del resto de tu trabajo.',
            us: 'En MITIKUS el contrato vive junto al cliente, la propuesta y la factura. La firma es un paso más del flujo, no una herramienta aparte.',
          },
        ],
        // CTA
        ctaTitle: '¿Listo para empezar?',
        ctaSubtitle: '15 días gratis, sin tarjeta de crédito. Todo tu espacio de trabajo listo en minutos.',
        ctaButton: 'Empezar gratis',
        // FAQ
        faqTitle: 'Preguntas frecuentes',
        faqItems: [
          { q: '¿Para qué tipo de empresa es MITIKUS?', a: 'Para cualquier empresa o equipo que trabaje con documentos, contratos y clientes. Da igual el sector — agencias, despachos, consultoras, estudios, startups. Si tu equipo produce y gestiona documentos, MITIKUS está hecho para vosotros.' },
          { q: '¿Qué herramientas incluye MITIKUS?', a: 'Documentos con editor rico, hojas de cálculo, visor y gestor de PDFs, contratos con firma digital OTP, presentaciones, cuadernos de investigación con IA, y flujos de trabajo automatizados. Todo en un solo espacio de trabajo.' },
          { q: '¿Cómo funciona la firma de contratos?', a: 'Subes el contrato, introduces el email del cliente y se lo envías desde MITIKUS. El cliente recibe un enlace, ve el contrato en el navegador y firma con un código de verificación (OTP) que le llega al email. Sin papel, sin instalar nada.' },
          { q: '¿Puedo invitar a mi equipo?', a: 'Sí. Invitas por email o por enlace. Cada persona tiene un rol (administrador, editor o visualizador) con sus permisos correspondientes. El plan Professional incluye hasta 15 usuarios.' },
          { q: '¿Necesito instalar algo?', a: 'No. Todo funciona desde el navegador — sin extensiones, sin apps de escritorio. Empiezas el mismo día.' },
          { q: '¿Mis datos están seguros?', a: 'Cada organización está completamente aislada. Nadie externo a tu equipo puede acceder a tus documentos, contratos ni proyectos.' },
          { q: '¿Puedo probarlo gratis?', a: 'Sí, 15 días completos con todas las herramientas, sin tarjeta de crédito. Si necesitas ayuda para configurarlo para tu equipo, escríbenos.' },
          { q: '¿Puedo cancelar cuando quiera?', a: 'Sí, desde el panel de tu cuenta, sin llamadas ni procesos complicados. El plan sigue activo hasta el final del periodo ya pagado.' },
        ],
        // Footer
        footerTagline: 'Las herramientas que necesita tu equipo, en un solo lugar.',
        footerPrivacy: 'Política de privacidad',
        footerTerms: 'Términos de uso',
        footerDpa: 'DPA (Tratamiento de datos)',
      }

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
  const isEn = locale === 'en'
  const tools = isEn
    ? [
        { icon: '📄', label: 'Documents' },
        { icon: '📊', label: 'Sheets' },
        { icon: '📑', label: 'PDFs' },
        { icon: '✍️', label: 'Contracts' },
        { icon: '🖥️', label: 'Slides' },
        { icon: '📒', label: 'Notebooks' },
        { icon: '🧾', label: 'Invoices' },
        { icon: '📷', label: 'Expenses' },
      ]
    : [
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
        <span className="text-xs text-muted-foreground ml-2">{isEn ? 'My Office — MITIKUS' : 'Mi Office — MITIKUS'}</span>
      </div>
      <div className="p-5">
        <p className="text-[11px] text-muted-foreground mb-4">{isEn ? 'Tools available in your workspace' : 'Herramientas disponibles en tu espacio'}</p>
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
          <span className="text-[11px] text-foreground/70">{isEn ? 'Brain ready to help you in any tool' : 'Arkos listo para ayudarte en cualquier herramienta'}</span>
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
