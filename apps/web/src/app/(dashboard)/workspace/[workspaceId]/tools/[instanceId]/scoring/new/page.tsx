import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { validateToolSchema } from '@protools/schema'
import type { ScoringConfig } from '@protools/schema'
import { CapabilityNav } from '../../_components/CapabilityNav'
import { ScoringRenderer } from '../../_components/ScoringRenderer'
import { buildCapabilityTabs } from '@/lib/capability-tabs'

interface Props {
  params: Promise<{ workspaceId: string; instanceId: string }>
}

export default async function ScoringNewPage({ params }: Props) {
  const [{ workspaceId, instanceId }, user] = await Promise.all([params, requireUser()])

  const [workspace, instance] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } }),
    db.toolInstance.findFirst({
      where: { id: instanceId, workspaceId, status: 'ACTIVE' },
      include: { toolDefinition: true },
    }),
  ])

  if (!workspace || !instance) notFound()

  const schemaResult = validateToolSchema(instance.toolDefinition.schema)
  if (!schemaResult.success) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-destructive text-sm">Schema de herramienta inválido.</p>
      </div>
    )
  }

  const schema = schemaResult.data
  const scoringCap = schema.capabilities.find((c) => c.type === 'SCORING')
  if (!scoringCap) notFound()
  const scoringConfig = scoringCap.config as ScoringConfig

  const tabs = buildCapabilityTabs(schema, workspaceId, instanceId)

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold mb-6">Nueva evaluación</h1>
      <CapabilityNav tabs={tabs} active="SCORING" />
      <ScoringRenderer
        instanceId={instanceId}
        workspaceId={workspaceId}
        config={scoringConfig}
      />
    </div>
  )
}
