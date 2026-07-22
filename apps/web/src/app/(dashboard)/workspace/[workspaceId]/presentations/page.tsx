import { requireUser } from '@/lib/auth'
import { getPresentations } from '@/app/actions/presentations'
import { PresentationList } from './_components/PresentationList'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function PresentationsPage({ params }: Props) {
  await requireUser()
  const { workspaceId } = await params
  const presentations = await getPresentations(workspaceId)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PresentationList workspaceId={workspaceId} initial={presentations} />
    </div>
  )
}
