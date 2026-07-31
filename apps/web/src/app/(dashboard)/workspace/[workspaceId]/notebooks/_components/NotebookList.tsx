'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createNotebook } from '@/app/actions/notebooks'
import { NotebookCard } from './NotebookCard'
import type { NotebookData } from '@/app/actions/notebooks'

interface Props {
  workspaceId:   string
  initial:       NotebookData[]
  currentUserId: string
}

export function NotebookList({ workspaceId, initial, currentUserId }: Props) {
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
        <div className="rounded-xl border border-dashed bg-card p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl mx-auto">🔬</div>
          <div className="space-y-1.5">
            <p className="font-semibold text-base">Sin notebooks todavía</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Un notebook reúne fuentes de información y deja que la IA las analice y sintetice por ti.
            </p>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {creating ? 'Creando...' : '+ Nuevo notebook'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notebooks.map((n) => (
            <NotebookCard key={n.id} notebook={n} workspaceId={workspaceId} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  )
}
