import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { ToolSectionNav } from '../_components/ToolSectionNav'
import { ConfigClient } from './_components/ConfigClient'
import { getOrCreateConfig } from '@/app/actions/config'
import { getAvailableProviderIds } from '@/lib/providers'
import { assignClientToInstance } from '@/app/actions/tool'

interface Props {
  params: Promise<{ workspaceId: string; instanceId: string }>
}

export default async function ToolSettingsPage({ params }: Props) {
  const [{ workspaceId, instanceId }, user] = await Promise.all([params, requireUser()])

  const [workspace, instance, clients] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } }),
    db.toolInstance.findFirst({
      where: { id: instanceId, workspaceId, status: 'ACTIVE' },
      select: { name: true, clientId: true, toolDefinition: { select: { name: true } } },
    }),
    db.client.findMany({
      where: { workspaceId, isArchived: false },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
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

      {/* Cliente vinculado */}
      <div className="mb-8 rounded-xl border bg-card p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Cliente vinculado</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Asocia esta herramienta a un cliente para que aparezca en su expediente.
          </p>
        </div>
        <form action={assignClientToInstance} className="flex items-end gap-3">
          <input type="hidden" name="instanceId" value={instanceId} />
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <div className="flex-1">
            <select
              name="clientId"
              defaultValue={instance.clientId ?? ''}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Sin cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            Guardar
          </button>
        </form>
        {clients.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Aún no tienes clientes en este workspace.{' '}
            <a href={`/workspace/${workspaceId}/clients/new`} className="text-primary hover:underline">
              Crear cliente
            </a>
          </p>
        )}
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
