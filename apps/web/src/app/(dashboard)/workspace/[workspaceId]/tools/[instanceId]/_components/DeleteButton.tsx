'use client'

import { useActionState } from 'react'
import { deleteRecord } from '@/app/actions/record'

interface Props {
  instanceId: string
  recordId: string
}

export function DeleteButton({ instanceId, recordId }: Props) {
  const [state, formAction, isPending] = useActionState(deleteRecord, null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) {
      e.preventDefault()
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit}>
      <input type="hidden" name="instanceId" value={instanceId} />
      <input type="hidden" name="recordId" value={recordId} />
      {state?.error && (
        <span className="text-xs text-destructive mr-2">{state.error}</span>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="text-xs text-destructive hover:underline disabled:opacity-50"
      >
        {isPending ? 'Eliminando…' : 'Eliminar'}
      </button>
    </form>
  )
}
