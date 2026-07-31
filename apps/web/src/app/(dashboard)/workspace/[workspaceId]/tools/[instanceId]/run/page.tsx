import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { validateToolSchema, type FormConfig } from '@protools/schema'
import { ToolSectionNav } from '../_components/ToolSectionNav'
import { ExecutionClient } from './_components/ExecutionClient'
import { suggestNextTools } from '@/lib/tool-intelligence'
import { getBusinessContext } from '@/lib/business-memory'
import { computeContextDefaults } from '@/lib/context-autofill'

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

  const nextTools = instance
    ? await suggestNextTools(instance.toolDefinition.slug, 3).catch(() => [])
    : []

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

  // Extrae secciones del FORM default para el VariableForm
  const defaultFormCap = schemaResult.data.capabilities.find(
    (c) => c.type === 'FORM' && c.isDefault,
  ) ?? schemaResult.data.capabilities.find((c) => c.type === 'FORM')
  const formSections =
    defaultFormCap?.config && 'layout' in defaultFormCap.config
      ? (defaultFormCap.config as FormConfig).sections
      : undefined

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

  // Contexto de empresa para auto-relleno (solo si no es replay)
  const contextDefaults = isReplay
    ? {}
    : await getBusinessContext(workspaceId)
        .then((ctx) => computeContextDefaults(Object.keys(fields), ctx, initialValues ?? {}))
        .catch(() => ({}))

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Link href={`/workspace/${workspaceId}/tools/${instanceId}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 block">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        {instance.name}
      </Link>
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
        contextDefaults={Object.keys(contextDefaults).length > 0 ? contextDefaults : undefined}
        fromMissionId={fromMission}
        fromStepId={fromStep}
        nextTools={nextTools.map((t) => ({ slug: t.slug, name: t.name, reason: t.reason }))}
        formSections={formSections}
      />
    </div>
  )
}
