import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { validateToolSchema } from '@protools/schema'
import { ToolSectionNav } from '../_components/ToolSectionNav'
import { ExecutionClient } from './_components/ExecutionClient'

interface Props {
  params: Promise<{ workspaceId: string; instanceId: string }>
  searchParams: Promise<{ from?: string; fromMission?: string; fromStep?: string }>
}

export default async function ToolRunPage({ params, searchParams }: Props) {
  const [{ workspaceId, instanceId }, { from, fromMission, fromStep }, user] = await Promise.all([
    params,
    searchParams,
    requireUser(),
  ])

  const [workspace, instance] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } }),
    db.toolInstance.findFirst({
      where: { id: instanceId, workspaceId, status: 'ACTIVE' },
      include: { toolDefinition: true },
    }),
  ])

  if (!workspace) notFound()
  if (!instance) notFound()

  const schemaResult = validateToolSchema(instance.toolDefinition.schema)
  if (!schemaResult.success) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-destructive text-sm">Schema de herramienta inválido.</p>
      </div>
    )
  }

  const { fields } = schemaResult.data.dataSchema

  // Carga variables pre-rellenadas desde una ejecución previa (?from=executionId)
  let initialValues: Record<string, string> | undefined
  if (from) {
    const prevExecution = await db.toolExecution.findFirst({
      where: { id: from, toolInstanceId: instanceId, workspaceId },
      select: { variables: true },
    })
    if (prevExecution?.variables) {
      const vars = prevExecution.variables as Record<string, unknown>
      initialValues = Object.fromEntries(
        Object.entries(vars)
          .filter(([, v]) => v !== null && v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      )
    }
  }

  const isReplay = !!initialValues

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold truncate">{instance.name}</h1>
        <p className="text-xs text-muted-foreground truncate">
          {instance.toolDefinition.name}
          {isReplay && (
            <span className="ml-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-medium">
              Reejecución
            </span>
          )}
        </p>
      </div>

      <ToolSectionNav workspaceId={workspaceId} instanceId={instanceId} />
      <ExecutionClient
        toolInstanceId={instanceId}
        workspaceId={workspaceId}
        toolName={instance.name}
        fields={fields}
        initialValues={initialValues}
        fromMissionId={fromMission}
        fromStepId={fromStep}
      />
    </div>
  )
}
