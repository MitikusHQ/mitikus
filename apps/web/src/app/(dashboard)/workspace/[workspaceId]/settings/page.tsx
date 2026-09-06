import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { WorkspaceSettingsClient } from './_components/WorkspaceSettingsClient'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

export const metadata: Metadata = { title: 'Settings — MITIKUS' }

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function WorkspaceSettingsPage({ params }: Props) {
  const [{ workspaceId }, user, locale] = await Promise.all([params, requireUser(), getLocale()])
  const t = getDashboardTranslations(locale)

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      brandColor: true,
      logoShowName: true,
      logoCropX: true,
      logoCropY: true,
      logoCropZoom: true,
      logoTextX: true,
      logoTextY: true,
      logoTextSize: true,
      logoTextColor: true,
      logoTextFont: true,
      restrictCreationToAdmins: true,
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
        },
      },
    },
  })

  if (!workspace) notFound()

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-1">{t.wsSettingsTitle}</h1>
      <p className="text-muted-foreground text-sm mb-8">{t.wsSettingsSubtitle}</p>
      <WorkspaceSettingsClient workspace={workspace} userRole={user.role} locale={locale} />
    </div>
  )
}
