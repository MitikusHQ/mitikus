'use client'

import { useActionState, useState } from 'react'
import { installTool, type InstallToolState } from '@/app/actions/tool'

interface WorkspaceOption {
  id: string
  name: string
  clients: { id: string; name: string }[]
}

interface Props {
  toolDefinitionId: string
  toolName: string
  workspaces: WorkspaceOption[]
  defaultWorkspaceId?: string
}

export function InstallToolForm({
  toolDefinitionId,
  toolName,
  workspaces,
  defaultWorkspaceId,
}: Props) {
  const [state, action, isPending] = useActionState<InstallToolState, FormData>(
    installTool,
    null,
  )
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(
    defaultWorkspaceId ?? workspaces[0]?.id ?? '',
  )

  const currentWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId)

  if (workspaces.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Necesitas crear un workspace antes de instalar herramientas.
      </p>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="toolDefinitionId" value={toolDefinitionId} />

      <div className="space-y-1">
        <label className="text-sm font-medium">Workspace</label>
        <select
          name="workspaceId"
          value={selectedWorkspaceId}
          onChange={(e) => setSelectedWorkspaceId(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      {currentWorkspace && currentWorkspace.clients.length > 0 && (
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Cliente <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <select
            name="clientId"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Sin cliente específico</option>
            {currentWorkspace.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium">
          Nombre de la instancia{' '}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <input
          name="name"
          type="text"
          placeholder={toolName}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Instalando…' : 'Instalar herramienta'}
      </button>
    </form>
  )
}
