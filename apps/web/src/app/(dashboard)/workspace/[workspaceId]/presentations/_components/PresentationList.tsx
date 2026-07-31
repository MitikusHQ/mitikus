'use client'

import { useState } from 'react'
import { PresentationCard } from './PresentationCard'
import { NewPresentationModal } from './NewPresentationModal'
import type { PresentationData } from '@/app/actions/presentations'

interface Props {
  workspaceId:   string
  initial:       PresentationData[]
  currentUserId: string
}

export function PresentationList({ workspaceId, initial, currentUserId }: Props) {
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
        <div className="rounded-xl border border-dashed bg-card p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl mx-auto">🎯</div>
          <div className="space-y-1.5">
            <p className="font-semibold text-base">Sin presentaciones todavía</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Crea diapositivas con texto, listas y notas. Compártelas con un enlace público.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + Nueva presentación
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {presentations.map((p) => (
            <PresentationCard key={p.id} presentation={p} workspaceId={workspaceId} currentUserId={currentUserId} />
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
