import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ReactFlowProvider } from '@xyflow/react'
import { getWorkflowDetail, getToolPalette } from '@/app/actions/workflows'
import { WorkflowEditor } from './_components/WorkflowEditor'

interface Props {
  params: Promise<{ workspaceId: string; workflowId: string }>
}

export default async function WorkflowEditorPage({ params }: Props) {
  const [{ workspaceId, workflowId }, user] = await Promise.all([params, requireUser()])

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true, name: true },
  })
  if (!workspace) notFound()

  const [workflow, tools] = await Promise.all([
    getWorkflowDetail(workflowId, workspaceId),
    getToolPalette(),
  ])
  if (!workflow) notFound()

  return (
    <>
      <div className="px-6 py-2.5 border-b bg-background">
        <Link href={`/workspace/${workspaceId}/workflows`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Flujos de trabajo
        </Link>
      </div>
      <ReactFlowProvider>
        <WorkflowEditor workflow={workflow} workspaceName={workspace.name} tools={tools} />
      </ReactFlowProvider>
    </>
  )
}
