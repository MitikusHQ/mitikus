'use client'

import { useState, useTransition } from 'react'
import { deleteLead } from '@/app/actions/leads'

interface Props {
  leadId: string
  workspaceId: string
  leadName: string
}

export function DeleteLeadButton({ leadId, workspaceId, leadName }: Props) {
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteLead(leadId, workspaceId)
      setConfirm(false)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="text-muted-foreground hover:text-destructive transition-colors p-1"
        aria-label="Eliminar lead"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </button>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background border rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-semibold">¿Eliminar lead?</h3>
            <p className="text-sm text-muted-foreground">
              Se eliminará <strong>{leadName}</strong> de forma permanente.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirm(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-60"
              >
                {isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
