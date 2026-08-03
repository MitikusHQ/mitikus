import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { SupportChatClient } from './_components/SupportChatClient'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export const metadata = { title: 'Soporte · MITIKUS' }

export default async function SupportPage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  })
  if (!workspace) notFound()

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-2xl mx-auto w-full">
      <SupportChatClient workspaceId={workspaceId} />
    </div>
  )
}
