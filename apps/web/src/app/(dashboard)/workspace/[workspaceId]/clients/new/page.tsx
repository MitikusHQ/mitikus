import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { ClientForm } from '../_components/ClientForm'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function NewClientPage({ params }: Props) {
  const { workspaceId } = await params
  const user = await requireUser()

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) notFound()

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold mb-8">Nuevo cliente</h1>
      <ClientForm workspaceId={workspaceId} />
    </div>
  )
}
