import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de privacidad — MITIKUS',
  description: 'Información sobre cómo MITIKUS trata tus datos personales.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold hover:opacity-80 transition-opacity">
            MITIKUS
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Volver al inicio
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-14 prose prose-neutral dark:prose-invert">
        <h1 className="text-3xl font-bold mb-2">Política de privacidad</h1>
        <p className="text-muted-foreground text-sm mb-10">Última actualización: julio de 2026</p>

        <Section title="1. Responsable del tratamiento">
          <p>
            El responsable del tratamiento de los datos personales recogidos a través de{' '}
            <strong>mitikus.com</strong> es <strong>MITIKUS</strong> (en adelante, «nosotros»).
            Puedes contactarnos en{' '}
            <a href="mailto:hola@mitikus.com" className="text-primary hover:underline">
              hola@mitikus.com
            </a>
            .
          </p>
        </Section>

        <Section title="2. Datos que recogemos">
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Datos de cuenta:</strong> nombre, dirección de correo electrónico y contraseña cifrada al registrarte.</li>
            <li><strong>Datos de uso:</strong> páginas visitadas, acciones dentro de la aplicación y registros técnicos (logs) para el correcto funcionamiento del servicio.</li>
            <li><strong>Datos de facturación:</strong> gestionados directamente por Stripe. MITIKUS no almacena datos de tarjetas de crédito.</li>
            <li><strong>Comunicaciones:</strong> mensajes que nos envíes por correo o a través del formulario de contacto.</li>
          </ul>
        </Section>

        <Section title="3. Finalidad y base legal">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-semibold">Finalidad</th>
                <th className="text-left py-2 font-semibold">Base legal</th>
              </tr>
            </thead>
            <tbody>
              <Row a="Prestar el servicio contratado" b="Ejecución del contrato" />
              <Row a="Gestión de pagos y facturación" b="Ejecución del contrato" />
              <Row a="Comunicaciones sobre el servicio" b="Interés legítimo" />
              <Row a="Mejora del producto (datos agregados y anonimizados)" b="Interés legítimo" />
              <Row a="Cumplimiento de obligaciones legales" b="Obligación legal" />
            </tbody>
          </table>
        </Section>

        <Section title="4. Cookies">
          <p className="text-sm">
            Utilizamos únicamente <strong>cookies esenciales</strong> necesarias para el funcionamiento
            del servicio (sesión de usuario y preferencias de idioma). No usamos cookies de seguimiento,
            publicidad ni análisis de terceros.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm mt-3">
            <li><strong>mitikus-cookie-consent</strong> — guarda tu elección sobre cookies (12 meses).</li>
            <li><strong>protools-locale</strong> — guarda tu preferencia de idioma (12 meses).</li>
            <li><strong>Cookies de sesión de Clerk</strong> — gestionan tu autenticación (sesión).</li>
          </ul>
        </Section>

        <Section title="5. Conservación de datos">
          <p className="text-sm">
            Conservamos tus datos mientras mantengas una cuenta activa. Si cancelas tu cuenta, eliminamos
            tus datos personales en un plazo máximo de 30 días, salvo que la ley nos obligue a conservarlos
            durante un periodo mayor.
          </p>
        </Section>

        <Section title="6. Destinatarios y transferencias internacionales">
          <p className="text-sm">
            Compartimos datos exclusivamente con los proveedores necesarios para prestar el servicio:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm mt-3">
            <li><strong>Clerk</strong> — autenticación de usuarios (EE. UU., con garantías adecuadas).</li>
            <li><strong>Stripe</strong> — procesamiento de pagos (EE. UU., con garantías adecuadas).</li>
            <li><strong>Railway / PostgreSQL</strong> — base de datos (UE).</li>
            <li><strong>Vercel</strong> — alojamiento de la aplicación (EE. UU., con garantías adecuadas).</li>
          </ul>
          <p className="text-sm mt-3">
            Todos los proveedores fuera de la UE operan bajo las cláusulas contractuales tipo aprobadas
            por la Comisión Europea o mecanismos equivalentes.
          </p>
        </Section>

        <Section title="7. Tus derechos">
          <p className="text-sm">
            Como usuario tienes derecho a <strong>acceder</strong>, <strong>rectificar</strong>,{' '}
            <strong>suprimir</strong>, <strong>oponerte</strong> al tratamiento y solicitar la{' '}
            <strong>portabilidad</strong> de tus datos. También puedes presentar una reclamación ante
            la Agencia Española de Protección de Datos (
            <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              aepd.es
            </a>
            ).
          </p>
          <p className="text-sm mt-2">
            Para ejercer cualquier derecho escríbenos a{' '}
            <a href="mailto:hola@mitikus.com" className="text-primary hover:underline">
              hola@mitikus.com
            </a>
            .
          </p>
        </Section>

        <Section title="8. Cambios en esta política">
          <p className="text-sm">
            Podemos actualizar esta política cuando sea necesario. Si los cambios son significativos
            te avisaremos por correo electrónico o con un aviso visible en la aplicación.
          </p>
        </Section>
      </article>

      <footer className="border-t">
        <div className="max-w-3xl mx-auto px-6 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} MITIKUS. Todos los derechos reservados.
        </div>
      </footer>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold mb-3 border-b pb-2">{title}</h2>
      {children}
    </section>
  )
}

function Row({ a, b }: { a: string; b: string }) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-2 pr-4">{a}</td>
      <td className="py-2 text-muted-foreground">{b}</td>
    </tr>
  )
}
