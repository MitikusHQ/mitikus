import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSpreadsheet } from '@/app/actions/spreadsheets'
import { requireUser } from '@/lib/auth'
import { SheetEditorClient } from './_components/SheetEditorClient'

interface Props {
  params: Promise<{ workspaceId: string; sheetId: string }>
}

export default async function SheetEditorPage({ params }: Props) {
  const [{ workspaceId, sheetId }] = await Promise.all([params, requireUser()])
  const sheet = await getSpreadsheet(sheetId, workspaceId)
  if (!sheet) notFound()

  return (
    <>
      <div className="px-6 py-2.5 border-b bg-background">
        <Link href={`/workspace/${workspaceId}/sheets`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Hojas de cálculo
        </Link>
      </div>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 56px - 41px)' }}>
        <SheetEditorClient sheet={sheet} workspaceId={workspaceId} />
      </div>
    </>
  )
}
