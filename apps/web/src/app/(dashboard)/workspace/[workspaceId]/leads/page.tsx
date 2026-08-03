import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { LeadList } from './_components/LeadList'
import { CopyLinkButton } from './_components/CopyLinkButton'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function LeadsPage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const [workspace, leads] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } }),
    db.workspaceLead.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  if (!workspace) notFound()

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/^﻿/, '').replace(/\/$/, '')
  const publicUrl = `${appUrl}/leads/${workspaceId}`

  const byStatus = {
    NUEVO:      leads.filter(l => l.status === 'NUEVO'),
    CONTACTADO: leads.filter(l => l.status === 'CONTACTADO'),
    CUALIFICADO: leads.filter(l => l.status === 'CUALIFICADO'),
    PERDIDO:    leads.filter(l => l.status === 'PERDIDO'),
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Leads</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Potenciales clientes — captados desde tu formulario público.
          </p>
        </div>
        <CopyLinkButton url={publicUrl} />
      </div>

      <LeadList leads={leads} byStatus={byStatus} workspaceId={workspaceId} />
    </div>
  )
}
