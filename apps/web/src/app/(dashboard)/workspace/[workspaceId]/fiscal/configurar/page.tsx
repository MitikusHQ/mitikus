import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { LegalFormPicker } from '../_components/LegalFormPicker'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function FiscalConfigPage({ params }: Props) {
  const [{ workspaceId }, user] = await Promise.all([params, requireUser()])

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) notFound()

  return (
    <>
      <div className="px-6 py-2.5 border-b bg-background">
        <Link href={`/workspace/${workspaceId}/fiscal`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Calendario Fiscal
        </Link>
      </div>
      <LegalFormPicker workspaceId={workspaceId} />
    </>
  )
}
