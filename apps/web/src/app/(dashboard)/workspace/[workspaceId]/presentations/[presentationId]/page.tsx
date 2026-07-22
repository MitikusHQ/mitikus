import { notFound } from 'next/navigation'
import { getPresentation } from '@/app/actions/presentations'
import { PresentationEditorClient } from './_components/PresentationEditorClient'

interface Props {
  params: Promise<{ workspaceId: string; presentationId: string }>
}

export default async function PresentationEditorPage({ params }: Props) {
  const { workspaceId, presentationId } = await params
  const presentation = await getPresentation(workspaceId, presentationId)
  if (!presentation) notFound()

  return (
    <PresentationEditorClient
      presentation={presentation}
      workspaceId={workspaceId}
    />
  )
}
