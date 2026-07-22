import { notFound } from 'next/navigation'
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
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      <SheetEditorClient sheet={sheet} workspaceId={workspaceId} />
    </div>
  )
}
