'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createNotebook } from '@/app/actions/notebooks'
import { NotebookCard } from './NotebookCard'
import type { NotebookData } from '@/app/actions/notebooks'

interface Props {
  workspaceId: string
  initial:     NotebookData[]
}

export function NotebookList({ workspaceId, initial }: Props) {
  const notebooks = initial
  const router    = useRouter()
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    setCreating(true)
    const { id } = await createNotebook(workspaceId)
    router.push(`/workspace/${workspaceId}/notebooks/${id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Notebooks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {notebooks.length} {notebooks.length === 1 ? 'notebook' : 'notebooks'}
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {creating ? 'Creando...' : '+ Nuevo notebook'}
        </button>
      </div>

      {notebooks.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          <p>Aún no hay notebooks.</p>
          <button onClick={handleCreate} className="mt-3 text-primary hover:underline">
            Crea tu primer notebook
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notebooks.map((n) => (
            <NotebookCard key={n.id} notebook={n} workspaceId={workspaceId} />
          ))}
        </div>
      )}
    </div>
  )
}
