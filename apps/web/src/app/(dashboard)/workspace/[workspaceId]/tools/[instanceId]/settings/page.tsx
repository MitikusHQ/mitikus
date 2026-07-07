import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { ToolSectionNav } from '../_components/ToolSectionNav'
import { ConfigClient } from './_components/ConfigClient'
import { getOrCreateConfig } from '@/app/actions/config'
import { getAvailableProviderIds } from '@/lib/providers'

interface Props {
  params: Promise<{ workspaceId: string; instanceId: string }>
}

export default async function ToolSettingsPage({ params }: Props) {
  const [{ workspaceId, instanceId }, user] = await Promise.all([params, requireUser()])

  const [workspace, instance] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } }),
    db.toolInstance.findFirst({
      where: { id: instanceId, workspaceId, status: 'ACTIVE' },
      select: { name: true, toolDefinition: { select: { name: true } } },
    }),
  ])

  if (!workspace) notFound()
  if (!instance) notFound()

  const [config, availableProviderIds] = await Promise.all([
    getOrCreateConfig(instanceId, workspaceId),
    Promise.resolve(getAvailableProviderIds()),
  ])

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold truncate">{instance.name}</h1>
        <p className="text-xs text-muted-foreground truncate">{instance.toolDefinition.name}</p>
      </div>

      <ToolSectionNav workspaceId={workspaceId} instanceId={instanceId} />

      <div className="mb-6">
        <h2 className="text-lg font-semibold">Configuración de la instalación</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Ajusta el proveedor IA, modelo, creatividad y formato de salida para esta herramienta.
        </p>
      </div>

      <ConfigClient
        toolInstanceId={instanceId}
        workspaceId={workspaceId}
        initialConfig={config}
        availableProviderIds={availableProviderIds}
      />
    </div>
  )
}
