import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Términos de uso — MITIKUS',
  description: 'Condiciones generales del servicio MITIKUS para consultoras IT.',
}

export default function TermsPage() {
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

      <article className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-3xl font-bold mb-2">Términos de uso</h1>
        <p className="text-muted-foreground text-sm mb-10">Última actualización: julio de 2026</p>

        <Section title="1. Objeto y aceptación">
          <p className="text-sm leading-relaxed">
            Estos Términos de uso regulan el acceso y la utilización del servicio <strong>MITIKUS</strong>{' '}
            (en adelante, «el Servicio»), disponible en <strong>mitikus.com</strong>. Al crear una cuenta o
            usar el Servicio, aceptas quedar vinculado por estos Términos. Si no estás de acuerdo, no uses
            el Servicio.
          </p>
        </Section>

        <Section title="2. Descripción del servicio">
          <p className="text-sm leading-relaxed">
            MITIKUS es una plataforma SaaS dirigida a consultoras IT que permite generar, gestionar y
            entregar auditorías técnicas, checklists e informes para clientes mediante flujos guiados
            por inteligencia artificial. El Servicio incluye, entre otras funcionalidades: generación de
            herramientas de auditoría, gestión de clientes, flujos de trabajo, almacenamiento de documentos
            y firma de contratos.
          </p>
        </Section>

        <Section title="3. Acceso y cuenta">
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>Para acceder al Servicio debes crear una cuenta con un correo electrónico válido.</li>
            <li>
              Eres responsable de mantener la confidencialidad de tus credenciales y de todas las
              actividades que ocurran bajo tu cuenta.
            </li>
            <li>
              Debes notificarnos inmediatamente cualquier uso no autorizado de tu cuenta en{' '}
              <a href="mailto:hola@mitikus.com" className="text-primary hover:underline">
                hola@mitikus.com
              </a>
              .
            </li>
            <li>
              MITIKUS se reserva el derecho de suspender o cancelar cuentas que incumplan estos Términos.
            </li>
          </ul>
        </Section>

        <Section title="4. Periodo de prueba y planes de pago">
          <p className="text-sm leading-relaxed mb-3">
            Al registrarte tienes acceso a un <strong>periodo de prueba gratuito de 14 días</strong> con
            acceso completo al Servicio. Transcurrido ese periodo, el acceso pasa a modo lectura hasta que
            actives un plan de pago.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>
              Los precios de los planes están disponibles en la sección de facturación de tu workspace.
            </li>
            <li>El pago se procesa de forma segura a través de <strong>Stripe</strong>.</li>
            <li>
              Las suscripciones se renuevan automáticamente al final de cada período (mensual o anual)
              salvo que canceles con al menos 24 horas de antelación.
            </li>
            <li>
              No realizamos reembolsos por fracciones de período no consumido, salvo obligación legal
              o acuerdo expreso.
            </li>
          </ul>
        </Section>

        <Section title="5. Uso aceptable">
          <p className="text-sm leading-relaxed mb-3">
            Te comprometes a usar el Servicio únicamente para fines legítimos y de acuerdo con la
            legislación vigente. En particular, queda prohibido:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>Usar el Servicio para actividades ilegales, fraudulentas o que vulneren derechos de terceros.</li>
            <li>Intentar acceder sin autorización a sistemas, datos o cuentas de otros usuarios.</li>
            <li>Introducir virus, malware o cualquier código dañino.</li>
            <li>Hacer scraping masivo o uso automatizado no autorizado de la API.</li>
            <li>Revender o sublicenciar el acceso al Servicio sin autorización escrita previa.</li>
            <li>Usar el Servicio para generar contenido que infrinja derechos de propiedad intelectual.</li>
          </ul>
        </Section>

        <Section title="6. Propiedad intelectual">
          <p className="text-sm leading-relaxed mb-3">
            <strong>Propiedad de MITIKUS:</strong> El Servicio, incluyendo el software, diseño, marca y
            documentación, es propiedad de MITIKUS y está protegido por las leyes de propiedad intelectual
            aplicables. No te concedemos ningún derecho sobre estos elementos más allá del uso necesario
            para disfrutar del Servicio.
          </p>
          <p className="text-sm leading-relaxed">
            <strong>Tu contenido:</strong> Conservas todos los derechos sobre el contenido que crees o
            subas (informes, documentos, plantillas, datos de clientes). Nos otorgas únicamente la licencia
            limitada, no exclusiva y revocable necesaria para prestar el Servicio.
          </p>
        </Section>

        <Section title="7. Privacidad y protección de datos">
          <p className="text-sm leading-relaxed">
            El tratamiento de tus datos personales se rige por nuestra{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Política de privacidad
            </Link>
            , que forma parte integrante de estos Términos. MITIKUS cumple con el Reglamento General
            de Protección de Datos (RGPD) y la legislación española aplicable.
          </p>
        </Section>

        <Section title="8. Disponibilidad del servicio">
          <p className="text-sm leading-relaxed">
            Nos esforzamos por mantener el Servicio disponible de forma continua, pero no garantizamos
            una disponibilidad del 100 %. Podemos interrumpir el Servicio temporalmente por mantenimiento,
            actualizaciones o causas de fuerza mayor. En la medida permitida por la ley, MITIKUS no será
            responsable de los daños derivados de interrupciones del servicio.
          </p>
        </Section>

        <Section title="9. Limitación de responsabilidad">
          <p className="text-sm leading-relaxed mb-3">
            El Servicio se proporciona «tal cual» y «según disponibilidad». En la máxima medida permitida
            por la legislación aplicable:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>
              MITIKUS no garantiza que el Servicio sea ininterrumpido, libre de errores ni que los
              resultados generados por IA sean exactos o completos.
            </li>
            <li>
              Los informes y documentos generados son borradores de apoyo. La revisión y validación
              final es responsabilidad del usuario.
            </li>
            <li>
              Nuestra responsabilidad total ante cualquier reclamación no superará el importe pagado
              por el Servicio durante los 3 meses anteriores al hecho que da lugar a la reclamación.
            </li>
          </ul>
        </Section>

        <Section title="10. Modificaciones del servicio y los términos">
          <p className="text-sm leading-relaxed">
            Podemos modificar el Servicio o estos Términos en cualquier momento. Si los cambios son
            materiales, te avisaremos con al menos <strong>15 días de antelación</strong> por correo
            electrónico. El uso continuado del Servicio tras la entrada en vigor de los nuevos Términos
            implica su aceptación.
          </p>
        </Section>

        <Section title="11. Cancelación y terminación">
          <p className="text-sm leading-relaxed mb-3">
            Puedes cancelar tu cuenta en cualquier momento desde los ajustes de tu workspace. Tras la
            cancelación:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>Mantendas acceso en modo lectura hasta el final del período pagado.</li>
            <li>Puedes exportar tus datos durante ese período.</li>
            <li>Eliminamos tus datos personales en un plazo máximo de 30 días.</li>
          </ul>
          <p className="text-sm leading-relaxed mt-3">
            MITIKUS puede cancelar o suspender tu acceso si incumples estos Términos, con o sin aviso previo
            dependiendo de la gravedad del incumplimiento.
          </p>
        </Section>

        <Section title="12. Legislación aplicable y jurisdicción">
          <p className="text-sm leading-relaxed">
            Estos Términos se rigen por la legislación española. Para cualquier controversia derivada
            de los mismos, las partes se someten a los juzgados y tribunales de España, sin perjuicio
            de los derechos que la normativa de consumidores pueda reconocerte si eres persona física.
          </p>
        </Section>

        <Section title="13. Contacto">
          <p className="text-sm leading-relaxed">
            Para cualquier pregunta sobre estos Términos, escríbenos a{' '}
            <a href="mailto:hola@mitikus.com" className="text-primary hover:underline">
              hola@mitikus.com
            </a>
            .
          </p>
        </Section>
      </article>

      <footer className="border-t">
        <div className="max-w-3xl mx-auto px-6 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} MITIKUS. Todos los derechos reservados. ·{' '}
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Política de privacidad
          </Link>
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
