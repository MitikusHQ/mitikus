import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { getTasks } from '@/app/actions/tasks'
import { TaskList } from './_components/TaskList'

interface Props {
  params: Promise<{ workspaceId: string }>
  searchParams: Promise<{ status?: string; mine?: string; priority?: string; clientId?: string; objectiveId?: string }>
}

export default async function TasksPage({ params, searchParams }: Props) {
  const [{ workspaceId }, sp, user] = await Promise.all([params, searchParams, requireUser()])

  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } })
  if (!workspace) notFound()

  const tasks = await getTasks(workspaceId, user.id, {
    status: sp.status,
    mine: sp.mine === 'true',
    priority: sp.priority,
    clientId: sp.clientId,
    objectiveId: sp.objectiveId,
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <TaskList
        workspaceId={workspaceId}
        userId={user.id}
        initialTasks={tasks}
        initialFilters={{
          status: sp.status ?? 'all',
          mine: sp.mine === 'true',
        }}
      />
    </div>
  )
}
