import type { Metadata } from 'next'
import { BrainTabs } from './_components/BrainTabs'

export const metadata: Metadata = { title: 'Brain — MITIKUS' }

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function BrainPage({ params }: Props) {
  const { workspaceId } = await params

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-6 pt-8 pb-4 border-b border-border">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">✦</span>
          <h1 className="text-2xl font-bold">Brain</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Consulta la memoria de tu workspace — documentos, objetivos, conversaciones y herramientas.
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto h-full">
          <BrainTabs workspaceId={workspaceId} />
        </div>
      </div>
    </div>
  )
}
