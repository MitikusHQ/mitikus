'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { StepStatus } from '@/lib/missions/types'

interface Props {
  stepId:        string
  objectiveId:   string
  workspaceId:   string
  currentStatus: StepStatus
}

export function MissionStepActions({ stepId, objectiveId, currentStatus }: Props) {
  const router  = useRouter()
  const [busy, setBusy] = useState(false)

  async function transition(status: StepStatus) {
    if (busy) return
    setBusy(true)
    try {
      await fetch(`/api/missions/${objectiveId}/steps/${stepId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  if (currentStatus === 'completed') {
    return (
      <button
        onClick={() => transition('pending')}
        disabled={busy}
        className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        title="Marcar como pendiente"
        aria-label="Deshacer completado"
      >
        ↩
      </button>
    )
  }

  if (currentStatus === 'skipped') {
    return (
      <button
        onClick={() => transition('pending')}
        disabled={busy}
        className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        title="Recuperar paso"
        aria-label="Recuperar paso omitido"
      >
        ↩
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      {currentStatus === 'pending' && (
        <button
          onClick={() => transition('in_progress')}
          disabled={busy}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium disabled:opacity-40"
          aria-label="Iniciar paso"
        >
          Iniciar
        </button>
      )}
      {currentStatus === 'in_progress' && (
        <button
          onClick={() => transition('completed')}
          disabled={busy}
          className="text-xs text-green-600 dark:text-green-400 hover:underline font-medium disabled:opacity-40"
          aria-label="Marcar como completado"
        >
          Completar
        </button>
      )}
      {currentStatus === 'pending' && (
        <button
          onClick={() => transition('skipped')}
          disabled={busy}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 ml-1"
          title="Omitir paso"
          aria-label="Omitir paso"
        >
          —
        </button>
      )}
    </div>
  )
}
