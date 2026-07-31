import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getReceipts } from '@/app/actions/receipts'
import { ReceiptsClient } from './_components/ReceiptsClient'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function ReceiptsPage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true, name: true },
  })
  if (!workspace) notFound()

  const receipts = await getReceipts(workspaceId)

  return (
    <>
      <div className="px-6 py-2.5 border-b bg-background print:hidden">
        <Link
          href={`/workspace/${workspaceId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Panel
        </Link>
      </div>
      <ReceiptsClient workspaceId={workspaceId} initialReceipts={receipts} />
    </>
  )
}
