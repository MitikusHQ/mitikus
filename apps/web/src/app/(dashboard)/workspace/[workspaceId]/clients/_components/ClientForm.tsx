'use client'

import { useActionState } from 'react'
import { createClient, updateClient, type ClientActionState } from '@/app/actions/client'

interface ClientData {
  id: string
  name: string
  email: string | null
  sector: string | null
  notes: string | null
}

interface Props {
  workspaceId: string
  client?: ClientData
}

export function ClientForm({ workspaceId, client }: Props) {
  const action = client ? updateClient : createClient
  const [state, formAction, isPending] = useActionState<ClientActionState, FormData>(
    action,
    null,
  )

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      {client && <input type="hidden" name="clientId" value={client.id} />}

      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre <span className="text-destructive">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoFocus={!client}
          defaultValue={client?.name ?? ''}
          placeholder="Empresa o persona"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={client?.email ?? ''}
          placeholder="contacto@empresa.com"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="sector" className="text-sm font-medium text-muted-foreground">
          Sector
        </label>
        <input
          id="sector"
          name="sector"
          type="text"
          defaultValue={client?.sector ?? ''}
          placeholder="Tecnología, Hostelería…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="notes" className="text-sm font-medium text-muted-foreground">
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={client?.notes ?? ''}
          placeholder="Información adicional…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending
          ? client
            ? 'Guardando…'
            : 'Creando…'
          : client
            ? 'Guardar cambios'
            : 'Crear cliente'}
      </button>
    </form>
  )
}
