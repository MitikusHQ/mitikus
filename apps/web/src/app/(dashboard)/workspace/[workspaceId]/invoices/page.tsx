import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { getInvoices } from '@/app/actions/invoices'
import { InvoicesClient } from './_components/InvoicesClient'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function InvoicesPage({ params }: Props) {
  const [{ workspaceId }, user, locale] = await Promise.all([params, requireUser(), getLocale()])
  const t = getDashboardTranslations(locale)

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: {
      id: true,
      companyProfile: { select: { defaultPaymentNotes: true } },
    },
  })
  if (!workspace) notFound()

  const [invoices, rawClients] = await Promise.all([
    getInvoices(workspaceId),
    db.client.findMany({
      where: { workspaceId, isArchived: false },
      select: {
        id: true,
        name: true,
        contactName: true,
        email: true,
        phone: true,
        taxId: true,
        fiscalAddress: true,
        postalCode: true,
        city: true,
        province: true,
        country: true,
      },
      orderBy: { name: 'asc' },
    }),
  ])
  const clients = rawClients.map((c) => ({ ...c, email: c.email ?? undefined }))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">{t.invoicesTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.invoicesSubtitle}</p>
      </div>
      <InvoicesClient
        workspaceId={workspaceId}
        initialInvoices={invoices}
        clients={clients}
        defaultPaymentNotes={workspace.companyProfile?.defaultPaymentNotes ?? ''}
        locale={locale}
      />
    </div>
  )
}
