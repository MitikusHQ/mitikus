'use client'

import { useActionState } from 'react'
import { archiveClient, type ClientActionState } from '@/app/actions/client'

interface Props {
  workspaceId: string
  clientId: string
  clientName: string
}

export function ArchiveButton({ workspaceId, clientId, clientName }: Props) {
  const [state, action, isPending] = useActionState<ClientActionState, FormData>(
    archiveClient,
    null,
  )

  return (
    <form action={action}>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="clientId" value={clientId} />
      <button
        type="submit"
        disabled={isPending}
        onClick={(e) => {
          if (!confirm(`¿Archivar a "${clientName}"? Se ocultará de la lista.`)) {
            e.preventDefault()
          }
        }}
        className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Archivando…' : 'Archivar'}
      </button>
      {state?.error && <p className="text-xs text-destructive mt-1">{state.error}</p>}
    </form>
  )
}
