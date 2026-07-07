import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
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
    <ReactFlowProvider>
      <WorkflowEditor workflow={workflow} workspaceName={workspace.name} tools={tools} />
    </ReactFlowProvider>
  )
}
