import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Acuerdo de Tratamiento de Datos (DPA) — MITIKUS',
  description: 'Acuerdo de encargado del tratamiento de datos conforme al RGPD entre MITIKUS y sus clientes.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  )
}

export default function DpaPage() {
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
        <h1 className="text-3xl font-bold mb-2">Acuerdo de Tratamiento de Datos (DPA)</h1>
        <p className="text-muted-foreground text-sm mb-10">
          Última actualización: julio de 2026 · Conforme al Reglamento (UE) 2016/679 (RGPD)
        </p>

        <Section title="1. Partes del acuerdo">
          <p>
            Este Acuerdo de Encargado del Tratamiento («DPA») se celebra entre <strong>MITIKUS</strong>{' '}
            («Encargado del Tratamiento») y el cliente que contrata los servicios de MITIKUS («Responsable del
            Tratamiento»), en cumplimiento del artículo 28 del Reglamento (UE) 2016/679 (RGPD).
          </p>
          <p>
            Este DPA forma parte integrante de los <Link href="/terms" className="underline hover:text-foreground">Términos de uso</Link> y
            la <Link href="/privacy" className="underline hover:text-foreground">Política de privacidad</Link> de MITIKUS.
            Al aceptar los Términos de uso, el cliente acepta también este DPA.
          </p>
        </Section>

        <Section title="2. Objeto y naturaleza del tratamiento">
          <p>
            MITIKUS trata datos personales por cuenta del cliente con el único fin de prestar los servicios
            contratados: almacenamiento y procesamiento de documentos, contratos, hojas de cálculo,
            presentaciones y otros archivos del espacio de trabajo del cliente.
          </p>
          <p>
            El tratamiento incluye: almacenamiento, acceso, recuperación, visualización y eliminación de datos
            conforme a las instrucciones del cliente.
          </p>
        </Section>

        <Section title="3. Categorías de datos tratados">
          <p>Los datos tratados por cuenta del cliente pueden incluir:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Datos de identificación de usuarios del espacio de trabajo (nombre, email, rol).</li>
            <li>Contenido de documentos, contratos y archivos subidos por el cliente.</li>
            <li>Datos de contacto de terceros incluidos en contratos (nombre, email, firma OTP).</li>
            <li>Registros de actividad y auditoría dentro del espacio de trabajo.</li>
          </ul>
          <p>
            MITIKUS no trata categorías especiales de datos (datos sensibles) salvo que el cliente los incluya
            expresamente en documentos, en cuyo caso es el cliente el responsable de su adecuada gestión.
          </p>
        </Section>

        <Section title="4. Obligaciones del encargado (MITIKUS)">
          <p>MITIKUS se compromete a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Tratar los datos únicamente siguiendo instrucciones documentadas del responsable.</li>
            <li>Garantizar la confidencialidad del personal autorizado para tratar los datos.</li>
            <li>Implementar medidas técnicas y organizativas adecuadas conforme al artículo 32 RGPD.</li>
            <li>No subcontratar el tratamiento sin autorización previa del responsable, salvo los subencargados indicados en el apartado 6.</li>
            <li>Asistir al responsable en el cumplimiento de los derechos de los interesados (acceso, rectificación, supresión, portabilidad).</li>
            <li>Suprimir o devolver todos los datos al finalizar el servicio, según elección del responsable.</li>
            <li>Poner a disposición del responsable toda la información necesaria para demostrar el cumplimiento del RGPD.</li>
            <li>Notificar sin dilación indebida cualquier brecha de seguridad que afecte a datos del responsable.</li>
          </ul>
        </Section>

        <Section title="5. Obligaciones del responsable (cliente)">
          <p>El cliente, como responsable del tratamiento, se compromete a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Disponer de base jurídica válida para los datos que introduce en MITIKUS.</li>
            <li>Informar a los interesados del tratamiento conforme a los artículos 13 y 14 RGPD.</li>
            <li>No introducir categorías especiales de datos sin las salvaguardas requeridas por el RGPD.</li>
            <li>Comunicar a MITIKUS cualquier instrucción sobre los datos con antelación suficiente.</li>
          </ul>
        </Section>

        <Section title="6. Subencargados del tratamiento">
          <p>
            MITIKUS utiliza los siguientes proveedores como subencargados del tratamiento, todos ellos con
            domicilio en la UE o con garantías adecuadas conforme al RGPD:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Vercel Inc.</strong> — Infraestructura de alojamiento y despliegue (EE.UU., con cláusulas contractuales tipo).</li>
            <li><strong>Supabase / PostgreSQL</strong> — Base de datos (UE).</li>
            <li><strong>Resend</strong> — Envío de correos transaccionales (EE.UU., con cláusulas contractuales tipo).</li>
            <li><strong>Clerk</strong> — Autenticación de usuarios (EE.UU., con cláusulas contractuales tipo).</li>
            <li><strong>Anthropic / OpenAI</strong> — Procesamiento de IA (EE.UU., con cláusulas contractuales tipo). Los datos enviados a estos proveedores no se usan para entrenar modelos.</li>
          </ul>
          <p>
            MITIKUS informará al cliente con al menos 30 días de antelación de cualquier cambio en los
            subencargados. El cliente podrá oponerse motivadamente a dicho cambio.
          </p>
        </Section>

        <Section title="7. Transferencias internacionales de datos">
          <p>
            Algunos subencargados indicados en el apartado 6 están establecidos fuera del Espacio Económico
            Europeo. En tales casos, MITIKUS garantiza que las transferencias se realizan con base en las
            Cláusulas Contractuales Tipo adoptadas por la Comisión Europea, conforme al artículo 46 RGPD.
          </p>
        </Section>

        <Section title="8. Medidas de seguridad">
          <p>MITIKUS aplica, entre otras, las siguientes medidas técnicas y organizativas:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Cifrado en tránsito mediante TLS 1.2+.</li>
            <li>Aislamiento de datos por organización (ninguna organización accede a datos de otra).</li>
            <li>Acceso al sistema de producción restringido a personal autorizado con autenticación fuerte.</li>
            <li>Registro de auditoría de acciones sobre datos sensibles.</li>
            <li>Verificación OTP para firma de contratos por terceros.</li>
          </ul>
        </Section>

        <Section title="9. Duración y terminación">
          <p>
            Este DPA tiene la misma duración que el contrato de servicios entre las partes. A su terminación,
            MITIKUS suprimirá los datos del cliente en un plazo máximo de 30 días, salvo que la legislación
            aplicable exija su conservación durante un período mayor.
          </p>
          <p>
            El cliente puede solicitar la exportación de sus datos en cualquier momento durante la vigencia
            del contrato a través del panel de administración o contactando con{' '}
            <a href="mailto:privacidad@mitikus.com" className="underline hover:text-foreground">privacidad@mitikus.com</a>.
          </p>
        </Section>

        <Section title="10. Contacto y ejercicio de derechos">
          <p>
            Para cualquier consulta relativa a este DPA, notificación de brechas o ejercicio de derechos,
            contacta con nosotros en{' '}
            <a href="mailto:privacidad@mitikus.com" className="underline hover:text-foreground">privacidad@mitikus.com</a>.
          </p>
          <p>
            Si el cliente considera que el tratamiento no se ajusta a la normativa, tiene derecho a presentar
            una reclamación ante la Agencia Española de Protección de Datos (AEPD) en{' '}
            <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">aepd.es</a>.
          </p>
        </Section>
      </article>

      <footer className="border-t">
        <div className="max-w-3xl mx-auto px-6 py-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground transition-colors">Política de privacidad</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-foreground transition-colors">Términos de uso</Link>
          <span>·</span>
          <span>© {new Date().getFullYear()} MITIKUS</span>
        </div>
      </footer>
    </main>
  )
}
