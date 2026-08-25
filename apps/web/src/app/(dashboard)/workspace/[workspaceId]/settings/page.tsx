import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { WorkspaceSettingsClient } from './_components/WorkspaceSettingsClient'

export const metadata: Metadata = { title: 'Ajustes del workspace — MITIKUS' }

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function WorkspaceSettingsPage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

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
        },
      },
    },
  })

  if (!workspace) notFound()

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-1">Ajustes del workspace</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Personaliza marca, datos visibles y envíos de tu espacio de trabajo.
      </p>
      <WorkspaceSettingsClient workspace={workspace} userRole={user.role} />
    </div>
  )
}
