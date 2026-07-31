import { notFound } from 'next/navigation'
import Link from 'next/link'
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
    <>
      <div className="px-6 py-2.5 border-b bg-background">
        <Link href={`/workspace/${workspaceId}/presentations`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Presentaciones
        </Link>
      </div>
      <PresentationEditorClient
        presentation={presentation}
        workspaceId={workspaceId}
      />
    </>
  )
}
