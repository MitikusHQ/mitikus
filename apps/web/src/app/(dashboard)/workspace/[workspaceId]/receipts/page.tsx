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
        <nav aria-label="Migas de pan" className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href={`/workspace/${workspaceId}/office`} className="hover:text-foreground transition-colors">
            Mi Office
          </Link>
          <svg className="w-3.5 h-3.5 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
          <span className="text-foreground font-medium">Gastos</span>
        </nav>
      </div>
      <div className="px-6 pt-6 pb-2 print:hidden">
        <h1 className="text-xl font-semibold">Gastos</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Escanea tickets y facturas — la IA extrae los datos automáticamente</p>
      </div>
      <ReceiptsClient workspaceId={workspaceId} initialReceipts={receipts} />
    </>
  )
}
