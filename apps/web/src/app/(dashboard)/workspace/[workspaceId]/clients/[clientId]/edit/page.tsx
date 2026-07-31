import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ClientForm } from '../../_components/ClientForm'

interface Props {
  params: Promise<{ workspaceId: string; clientId: string }>
}

export default async function EditClientPage({ params }: Props) {
  const { workspaceId, clientId } = await params
  const user = await requireUser()

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) notFound()

  const client = await db.client.findFirst({
    where: { id: clientId, workspaceId },
  })
  if (!client) notFound()

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Link href={`/workspace/${workspaceId}/clients/${clientId}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        {client.name}
      </Link>
      <h1 className="text-xl font-semibold mb-8">Editar cliente</h1>
      <ClientForm workspaceId={workspaceId} client={client} />
    </div>
  )
}
