import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import { parseWorkspaceIntegrations } from '@/lib/integrations/calendar'
import { AiProviderIntegrationClient } from './_components/AiProviderIntegrationClient'
import { CalendarIntegrationClient } from './_components/CalendarIntegrationClient'
import { ComingSoonIntegrationPanel } from './_components/ComingSoonIntegrationPanel'
import { EmailIntegrationClient } from './_components/EmailIntegrationClient'
import { FormsIntegrationClient } from './_components/FormsIntegrationClient'
import { StorageIntegrationClient } from './_components/StorageIntegrationClient'

export const metadata: Metadata = { title: 'Integrations - MITIKUS' }

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function IntegrationsPage({ params }: Props) {
  const [{ workspaceId }, user, locale] = await Promise.all([params, requireUser(), getLocale()])
  const t = getDashboardTranslations(locale)

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: {
      id: true,
      name: true,
      companyProfile: {
        select: {
          fiscalName: true,
          fiscalEmail: true,
          emailSendMode: true,
          emailSenderName: true,
          emailReplyTo: true,
          emailSignature: true,
          smtpHost: true,
          smtpPort: true,
          smtpSecure: true,
          smtpUser: true,
          imapHost: true,
          imapPort: true,
          imapSecure: true,
          imapUser: true,
          integrations: true,
        },
      },
    },
  })

  if (!workspace) notFound()
  const integrations = parseWorkspaceIntegrations(workspace.companyProfile?.integrations)

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold mb-1">{t.integrationsTitle}</h1>
      <p className="text-muted-foreground text-sm mb-10">{t.integrationsSubtitle}</p>

      {/* ── Disponible ahora ──────────────────────────────── */}
      <SectionHeader
        label="Disponible ahora"
        description="Configurable hoy, sin necesidad de cuentas externas adicionales."
      />
      <div className="space-y-4 mb-10">
        <EmailIntegrationClient workspace={workspace} locale={locale} />
        <FormsIntegrationClient workspaceId={workspace.id} locale={locale} forms={integrations.forms ?? null} />
      </div>

      {/* ── Próximamente ──────────────────────────────────── */}
      <SectionHeader
        label="Próximamente"
        description="En desarrollo. Puedes conectarlas cuando estén disponibles."
      />
      <div className="space-y-4 mb-10">
        <CalendarIntegrationClient workspaceId={workspace.id} locale={locale} calendar={integrations.calendar ?? null} />
        <ComingSoonIntegrationPanel
          locale={locale}
          title={t.integrationsVideoCallsTitle}
          description={t.integrationsVideoCallsDescription}
          providers={[
            { name: t.integrationsGoogleMeet, mark: 'G' },
            { name: t.integrationsMicrosoftTeams, mark: 'M' },
            { name: t.integrationsZoom, mark: 'Z' },
          ]}
        />
        <StorageIntegrationClient workspaceId={workspace.id} locale={locale} storage={integrations.storage ?? null} />
        <AiProviderIntegrationClient workspaceId={workspace.id} locale={locale} aiProvider={integrations.aiProvider ?? null} />
        <ComingSoonIntegrationPanel
          locale={locale}
          title={t.integrationsSignatureTitle}
          description={t.integrationsSignatureDescription}
          providers={[
            { name: t.integrationsMitikusSignature, mark: 'M', status: t.integrationsManagedByMitikus },
            { name: t.integrationsSignaturit, mark: 'S' },
            { name: t.integrationsDocuSign, mark: 'D' },
          ]}
        />
        <ComingSoonIntegrationPanel
          locale={locale}
          title={t.integrationsCommunicationTitle}
          description={t.integrationsCommunicationDescription}
          providers={[
            { name: t.integrationsWhatsAppBusiness, mark: 'W' },
            { name: t.integrationsTwilio, mark: 'T' },
          ]}
        />
        <ComingSoonIntegrationPanel
          locale={locale}
          title={t.integrationsAutomationTitle}
          description={t.integrationsAutomationDescription}
          providers={[
            { name: t.integrationsMake, mark: 'M' },
            { name: t.integrationsZapier, mark: 'Z' },
            { name: t.integrationsN8n, mark: 'N' },
          ]}
        />
        <ComingSoonIntegrationPanel
          locale={locale}
          title={t.integrationsAccountingTitle}
          description={t.integrationsAccountingDescription}
          providers={[
            { name: t.integrationsHolded, mark: 'H' },
            { name: t.integrationsSage, mark: 'S' },
            { name: t.integrationsQuipu, mark: 'Q' },
            { name: t.integrationsAnfix, mark: 'A' },
            { name: t.integrationsContasimple, mark: 'C' },
          ]}
        />
        <ComingSoonIntegrationPanel
          locale={locale}
          title={t.integrationsEcommerceTitle}
          description={t.integrationsEcommerceDescription}
          providers={[
            { name: t.integrationsShopify, mark: 'S' },
            { name: t.integrationsWooCommerce, mark: 'W' },
            { name: t.integrationsPrestashop, mark: 'P' },
          ]}
        />
        <ComingSoonIntegrationPanel
          locale={locale}
          title={t.integrationsPaymentsTitle}
          description={t.integrationsPaymentsDescription}
          providers={[
            { name: t.integrationsStripeConnect, mark: 'S' },
            { name: t.integrationsPaypal, mark: 'P' },
            { name: t.integrationsRedsys, mark: 'R' },
          ]}
        />
      </div>

      {/* ── Más adelante ──────────────────────────────────── */}
      <SectionHeader
        label="Más adelante"
        description="En el roadmap. Todavía en fase de diseño."
      />
      <div className="space-y-4">
        <ComingSoonIntegrationPanel
          locale={locale}
          title="Banca y conciliación"
          description="Conecta tu cuenta bancaria para importar movimientos y conciliarlos automáticamente con tus facturas y gastos."
          providers={[
            { name: 'BBVA', mark: 'B' },
            { name: 'CaixaBank', mark: 'C' },
            { name: 'Santander', mark: 'S' },
            { name: 'Sabadell', mark: 'S' },
          ]}
        />
      </div>
    </div>
  )
}

function SectionHeader({ label, description }: { label: string; description: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  )
}
