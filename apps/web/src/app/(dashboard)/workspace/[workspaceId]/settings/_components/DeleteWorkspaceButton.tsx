'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteWorkspace } from '@/app/actions/workspace'

export function DeleteWorkspaceButton({ workspaceId, workspaceName }: {
  workspaceId: string
  workspaceName: string
}) {
  const router = useRouter()
  const inputId = useId()
  const [confirming, setConfirming] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const matches = confirmation.length > 0 && confirmation === workspaceName
  const destructiveClass = 'px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'

  async function handleDelete() {
    if (!matches || deleting) return
    setDeleting(true)
    setError(null)
    try {
      const result = await deleteWorkspace(workspaceId)
      if (result) {
        setError(result.error)
        setDeleting(false)
        return
      }
      router.push('/')
    } catch {
      setError('No se ha podido eliminar el workspace. Inténtalo de nuevo.')
      setDeleting(false)
    }
  }

  if (!confirming) {
    return <button type="button" className={destructiveClass} onClick={() => setConfirming(true)}>Eliminar workspace</button>
  }

  return (
    <div className="space-y-3" aria-busy={deleting}>
      <label htmlFor={inputId} className="block text-sm">
        Escribe <strong>{workspaceName}</strong> para confirmar la eliminación permanente.
      </label>
      <input
        id={inputId}
        autoFocus
        autoComplete="off"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        disabled={deleting}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
      />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={handleDelete} disabled={!matches || deleting} className={destructiveClass}>
          {deleting ? 'Eliminando…' : 'Eliminar workspace'}
        </button>
        <button type="button" disabled={deleting} className="px-4 py-2 rounded-md border text-sm disabled:opacity-60" onClick={() => {
          setConfirming(false)
          setConfirmation('')
          setError(null)
        }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
