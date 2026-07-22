'use client'

import { useState } from 'react'
import { PresentationCard } from './PresentationCard'
import { NewPresentationModal } from './NewPresentationModal'
import type { PresentationData } from '@/app/actions/presentations'

interface Props {
  workspaceId: string
  initial:     PresentationData[]
}

export function PresentationList({ workspaceId, initial }: Props) {
  const presentations = initial
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Presentaciones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {presentations.length} {presentations.length === 1 ? 'presentación' : 'presentaciones'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/90"
        >
          + Nueva presentación
        </button>
      </div>

      {presentations.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          <p>Aún no hay presentaciones.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 text-primary hover:underline"
          >
            Crea tu primera presentación
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {presentations.map((p) => (
            <PresentationCard key={p.id} presentation={p} workspaceId={workspaceId} />
          ))}
        </div>
      )}

      {showModal && (
        <NewPresentationModal
          workspaceId={workspaceId}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
