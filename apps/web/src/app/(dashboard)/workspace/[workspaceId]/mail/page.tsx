import { getMailboxMessages } from '@/app/actions/mail'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { MailboxClient } from './_components/MailboxClient'

interface Props {
  params: Promise<{ workspaceId: string }>
  searchParams?: Promise<{ to?: string }>
}

export default async function MailPage({ params, searchParams }: Props) {
  const [{ workspaceId }, query] = await Promise.all([params, searchParams ?? Promise.resolve({} as { to?: string })])
  const user = await requireUser()
  const [inbox, contacts, companyProfile] = await Promise.all([
    getMailboxMessages(workspaceId, 'inbox'),
    db.client.findMany({
      where: { workspaceId, workspace: { orgId: user.orgId }, email: { not: null } },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, contactName: true, sector: true, clientType: true },
    }),
    db.companyProfile.findUnique({
      where: { workspaceId },
      select: { emailSignature: true, smtpHost: true, smtpUser: true, imapHost: true, imapUser: true },
    }),
  ])
  const hasSmtpConfig = !!(companyProfile?.smtpHost && companyProfile?.smtpUser)
  const hasImapConfig = !!(companyProfile?.imapHost && companyProfile?.imapUser)
  const mailContacts = contacts
    .filter((contact: { email?: string | null }) => Boolean(contact.email?.trim()))
    .map((contact: { id: string; name: string; email: string | null; contactName: string | null; sector: string | null; clientType: string | null }) => ({ ...contact, email: contact.email ?? '' }))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Correo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona el correo de tu workspace.
          </p>
        </div>
      </div>
      <MailboxClient workspaceId={workspaceId} initialMessages={inbox.messages} initialToEmail={query.to ?? ''} contacts={mailContacts} defaultSignature={companyProfile?.emailSignature} hasSmtpConfig={hasSmtpConfig} hasImapConfig={hasImapConfig} />
    </div>
  )
}







