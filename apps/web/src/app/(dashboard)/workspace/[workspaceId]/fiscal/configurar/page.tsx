import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { LegalFormPicker } from '../_components/LegalFormPicker'
import { NifForm } from '../_components/NifForm'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function FiscalConfigPage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const [workspace, profile] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } }),
    db.companyProfile.findUnique({
      where: { workspaceId },
      select: {
        fiscalName: true,
        nif: true,
        fiscalAddress: true,
        fiscalPostalCode: true,
        fiscalCity: true,
        fiscalProvince: true,
        fiscalCountry: true,
        fiscalEmail: true,
        fiscalPhone: true,
        tradeRegistry: true,
        iban: true,
        defaultPaymentNotes: true,
      },
    }),
  ])
  if (!workspace) notFound()

  return (
    <>
      <div className="px-6 py-2.5 border-b bg-background">
        <Link href={`/workspace/${workspaceId}/fiscal`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Calendario Fiscal
        </Link>
      </div>
      <div className="max-w-2xl mx-auto py-8 px-6 space-y-8">
        <NifForm
          workspaceId={workspaceId}
          profile={{
            fiscalName: profile?.fiscalName ?? '',
            nif: profile?.nif ?? '',
            fiscalAddress: profile?.fiscalAddress ?? '',
            fiscalPostalCode: profile?.fiscalPostalCode ?? '',
            fiscalCity: profile?.fiscalCity ?? '',
            fiscalProvince: profile?.fiscalProvince ?? '',
            fiscalCountry: profile?.fiscalCountry ?? '',
            fiscalEmail: profile?.fiscalEmail ?? '',
            fiscalPhone: profile?.fiscalPhone ?? '',
            tradeRegistry: profile?.tradeRegistry ?? '',
            iban: profile?.iban ?? '',
            defaultPaymentNotes: profile?.defaultPaymentNotes ?? '',
          }}
        />
        <LegalFormPicker workspaceId={workspaceId} />
      </div>
    </>
  )
}
