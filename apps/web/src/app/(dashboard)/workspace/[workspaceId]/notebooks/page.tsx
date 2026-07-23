import { requireUser } from '@/lib/auth'
import { getNotebooks } from '@/app/actions/notebooks'
import { NotebookList } from './_components/NotebookList'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function NotebooksPage({ params }: Props) {
  const [{ workspaceId }] = await Promise.all([params, requireUser()])
  const notebooks = await getNotebooks(workspaceId)

  return (
    <div className="p-6">
      <NotebookList workspaceId={workspaceId} initial={notebooks} />
    </div>
  )
}
